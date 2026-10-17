const prisma = require('../config/db');

const RECENT_DAYS = 14;
const LIMIT = 30;
const OPEN_STATUSES = { notIn: ['RESOLVED', 'CLOSED'] };

const caseRef = (c) => c.trackingCode?.code || `CASE-${c.id}`;
const label = (value) => String(value || '').replace(/_/g, ' ').toLowerCase();

/** Admin: officers waiting for approval, and open cases nobody is handling yet. */
const adminNotifications = async () => {
    const [pendingOfficers, unassignedCases] = await Promise.all([
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
    ]);

    return [
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

/** Officer: newly assigned cases awaiting approval, and recent messages from citizens. */
const officerNotifications = async (officerId) => {
    const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
    const [newCases, messages] = await Promise.all([
        prisma.case.findMany({
            where: { officerId, approvedAt: null, status: OPEN_STATUSES },
            orderBy: { createdAt: 'desc' },
            take: LIMIT,
            include: { trackingCode: true },
        }),
        prisma.message.findMany({
            where: { recipientId: officerId, createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { sender: { select: { name: true } }, case: { include: { trackingCode: true } } },
        }),
    ]);

    // One entry per conversation, showing its latest message.
    const latestPerCase = new Map();
    for (const message of messages) {
        if (!latestPerCase.has(message.caseId)) latestPerCase.set(message.caseId, message);
    }

    return [
        ...newCases.map((c) => ({
            id: `case-assigned-${c.id}`,
            type: 'CASE_ASSIGNED',
            title: 'New case assigned to you',
            body: `${caseRef(c)} · ${label(c.category)} — review and approve it`,
            href: `/officer/${c.id}`,
            createdAt: c.createdAt,
        })),
        ...[...latestPerCase.values()].slice(0, LIMIT).map((m) => ({
            id: `message-${m.id}`,
            type: 'NEW_MESSAGE',
            title: `New message from ${m.sender?.name || 'a citizen'}`,
            body: m.content?.trim() ? m.content.trim().slice(0, 120) : 'Sent a photo',
            href: `/cases/${m.caseId}/messages`,
            createdAt: m.createdAt,
        })),
    ];
};

/** GET /api/notifications — newest first. */
const listNotifications = async (req, res) => {
    try {
        const items = req.user.role === 'ADMIN'
            ? await adminNotifications()
            : req.user.role === 'OFFICER'
                ? await officerNotifications(req.user.id)
                : [];
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(items.map((item) => ({ ...item, createdAt: new Date(item.createdAt).toISOString() })));
    } catch (error) {
        console.error('Unable to load notifications:', error);
        res.status(500).json({ error: 'Unable to load notifications.' });
    }
};

module.exports = { listNotifications };
