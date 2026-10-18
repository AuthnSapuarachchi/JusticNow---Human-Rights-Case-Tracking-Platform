const prisma = require('../config/db');
const { citizenCaseUpdate } = require('../utils/notify');

const RECENT_DAYS = 14;
const LIMIT = 30;
const OPEN_STATUSES = { notIn: ['RESOLVED', 'CLOSED'] };

const caseRef = (c) => c.trackingCode?.code || `CASE-${c.id}`;
const label = (value) => String(value || '').replace(/_/g, ' ').toLowerCase();
const recentSince = () => new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

/** Recent messages sent to this user, one entry per conversation showing its latest message. */
const latestMessages = async (recipientId, since, fallbackSender) => {
    const messages = await prisma.message.findMany({
        where: { recipientId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { sender: { select: { name: true } } },
    });

    const latestPerCase = new Map();
    for (const message of messages) {
        if (!latestPerCase.has(message.caseId)) latestPerCase.set(message.caseId, message);
    }

    return [...latestPerCase.values()].slice(0, LIMIT).map((m) => ({
        id: `message-${m.id}`,
        type: 'NEW_MESSAGE',
        title: `New message from ${m.sender?.name || fallbackSender}`,
        body: m.content?.trim() ? m.content.trim().slice(0, 120) : 'Sent a photo',
        href: `/cases/${m.caseId}/messages`,
        createdAt: m.createdAt,
    }));
};

/** Unread admin↔officer messages, one entry per thread (its latest unread message). */
const unreadStaffMessages = async (where) => {
    const unread = await prisma.staffMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { officer: { select: { name: true } } },
    });
    const latestPerThread = new Map();
    const warningThreads = new Set();
    for (const message of unread) {
        if (!latestPerThread.has(message.officerId)) latestPerThread.set(message.officerId, message);
        if (message.kind === 'WARNING') warningThreads.add(message.officerId);
    }
    return { latest: [...latestPerThread.values()].slice(0, LIMIT), warningThreads };
};

/** Admin: officers waiting for approval, open cases nobody is handling yet, new officer reports and officer replies. */
const adminNotifications = async () => {
    const [pendingOfficers, unassignedCases, newComplaints, replies] = await Promise.all([
        prisma.user.findMany({
            where: { role: 'OFFICER', verificationStatus: 'PENDING_VERIFICATION' },
            orderBy: { createdAt: 'desc' },
            take: LIMIT,
            include: { verificationProfile: { select: { officerId: true, organization: true } } },
        }),
        prisma.case.findMany({
            where: { officerId: null, status: OPEN_STATUSES },
            orderBy: { createdAt: 'desc' },
            take: LIMIT,
            include: { trackingCode: true },
        }),
        prisma.officerComplaint.findMany({
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' },
            take: LIMIT,
            include: { case: { include: { trackingCode: true } }, officer: { select: { name: true } } },
        }),
        // Officers only ever write in their own thread, and an admin's own messages are marked read on send.
        unreadStaffMessages({ readByAdminAt: null }),
    ]);

    return [
        ...newComplaints.map((c) => ({
            id: `complaint-${c.id}`,
            type: 'OFFICER_COMPLAINT',
            title: `Officer reported: ${c.officer?.name || 'an officer'}`,
            body: `${caseRef(c.case)} · ${label(c.reason)}`,
            href: `/admin/complaints/${c.id}`,
            createdAt: c.createdAt,
        })),
        ...replies.latest.map((m) => ({
            id: `staff-reply-${m.id}`,
            type: 'STAFF_REPLY',
            title: `Reply from ${m.officer?.name || 'an officer'}`,
            body: m.content.slice(0, 120),
            href: `/admin/officer-chat/${m.officerId}`,
            createdAt: m.createdAt,
        })),
        ...pendingOfficers.map((user) => ({
            id: `officer-pending-${user.id}`,
            type: 'OFFICER_PENDING',
            title: 'Officer awaiting approval',
            body: [user.name || user.email, user.verificationProfile?.officerId, user.verificationProfile?.organization].filter(Boolean).join(' · '),
            href: '/admin/verifications',
            createdAt: user.createdAt,
        })),
        ...unassignedCases.map((c) => ({
            id: `case-unassigned-${c.id}`,
            type: 'CASE_UNASSIGNED',
            title: 'Case needs an officer',
            body: `${caseRef(c)} · ${label(c.category)}`,
            href: `/admin/cases/${c.id}`,
            createdAt: c.createdAt,
        })),
    ];
};

/** Officer: newly assigned cases awaiting approval, recent messages from citizens, and unread admin messages. */
const officerNotifications = async (officerId) => {
    const [newCases, messages, staff] = await Promise.all([
        prisma.case.findMany({
            where: { officerId, approvedAt: null, status: OPEN_STATUSES },
            orderBy: { createdAt: 'desc' },
            take: LIMIT,
            include: { trackingCode: true },
        }),
        latestMessages(officerId, recentSince(), 'a citizen'),
        unreadStaffMessages({ officerId, readByOfficerAt: null }),
    ]);

    return [
        ...staff.latest.map((m) => {
            const isWarning = staff.warningThreads.has(m.officerId);
            return {
                id: `staff-message-${m.id}`,
                type: isWarning ? 'STAFF_WARNING' : 'STAFF_MESSAGE',
                title: isWarning ? 'Formal warning from JusticeNow Admin' : 'Message from JusticeNow Admin',
                body: m.content.slice(0, 120),
                href: '/officer/admin-chat',
                createdAt: m.createdAt,
            };
        }),
        ...newCases.map((c) => ({
            id: `case-assigned-${c.id}`,
            type: 'CASE_ASSIGNED',
            title: 'New case assigned to you',
            body: `${caseRef(c)} · ${label(c.category)} — review and approve it`,
            href: `/officer/${c.id}`,
            createdAt: c.createdAt,
        })),
        ...messages,
    ];
};

/** Citizen: status changes an officer made on their own cases, recent messages from their officer, and outcomes of their officer reports. */
const citizenNotifications = async (userId) => {
    const since = recentSince();
    const [statusChanges, messages, reviewedComplaints] = await Promise.all([
        prisma.caseStatusHistory.findMany({
            where: { case: { reporterId: userId }, changedById: { not: userId }, createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
            take: LIMIT,
            include: { case: { include: { trackingCode: true } } },
        }),
        latestMessages(userId, since, 'your officer'),
        prisma.officerComplaint.findMany({
            where: { reporterId: userId, reviewedAt: { gte: since } },
            orderBy: { reviewedAt: 'desc' },
            take: LIMIT,
            include: { case: { include: { trackingCode: true } } },
        }),
    ]);

    return [
        ...reviewedComplaints.map((c) => ({
            id: `complaint-${c.id}-${c.status}`,
            type: 'COMPLAINT_UPDATED',
            title: c.status === 'UNDER_REVIEW' ? 'Your report is being reviewed' : 'Your report was reviewed',
            body: `${caseRef(c.case)} · Open your case to see what happened.`,
            href: `/cases/${c.caseId}`,
            createdAt: c.reviewedAt,
        })),
        ...statusChanges.map((h) => ({
            id: `case-status-${h.id}`,
            ...citizenCaseUpdate(h.caseId, caseRef(h.case), h.toStatus),
            createdAt: h.createdAt,
        })),
        ...messages,
    ];
};

/** GET /api/notifications — newest first. */
const listNotifications = async (req, res) => {
    try {
        const items = req.user.role === 'ADMIN'
            ? await adminNotifications()
            : req.user.role === 'OFFICER'
                ? await officerNotifications(req.user.id)
                : req.user.role === 'CITIZEN'
                    ? await citizenNotifications(req.user.id)
                    : [];
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(items.map((item) => ({ ...item, createdAt: new Date(item.createdAt).toISOString() })));
    } catch (error) {
        console.error('Unable to load notifications:', error);
        res.status(500).json({ error: 'Unable to load notifications.' });
    }
};

module.exports = { listNotifications };
