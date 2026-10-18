const prisma = require('../config/db');
const { notifyUser, notifyAdmins } = require('../utils/notify');

/**
 * Officer conduct: citizens report their case officer, admins review the report
 * and talk to the officer (messages and formal warnings) in one shared thread.
 *
 * Privacy rule: an officer never sees complaints, complaint ids, or which citizen
 * complained. Admins decide what to relay. Citizens fear retaliation (48.1% in our
 * research), and the officer is usually still handling their case.
 */

const COMPLAINT_REASONS = ['NO_RESPONSE', 'UNPROFESSIONAL', 'PRESSURE_OR_THREAT', 'PRIVACY_BREACH', 'ASKED_FOR_PAYMENT', 'OTHER'];
const REVIEW_STATUSES = ['UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED'];
const ACTIVE_COMPLAINT = { in: ['OPEN', 'UNDER_REVIEW'] };
const DETAILS_MIN = 20;
const TEXT_MAX = 2000;
const RESOLUTION_MIN = 10;
const DAILY_COMPLAINT_LIMIT = 3;
const MESSAGE_PAGE = 100;

// What the citizen sees once an admin acts on their report.
const CITIZEN_COMPLAINT_UPDATES = {
    UNDER_REVIEW: 'An admin is reviewing your report about your officer.',
    ACTION_TAKEN: 'An admin acted on your report about your officer.',
    DISMISSED: 'An admin reviewed your report about your officer and closed it.',
};

const parseId = (param) => {
    const id = Number(param);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const caseRef = (c) => c?.trackingCode?.code || `CASE-${c?.id}`;

/** Citizen view: their own report and its outcome. No reviewer identity. */
const serializeCitizenComplaint = (c) => ({
    id: c.id,
    reason: c.reason,
    details: c.details,
    status: c.status,
    resolutionNote: c.resolutionNote,
    createdAt: c.createdAt,
    reviewedAt: c.reviewedAt,
});

/** Admin view. Reporter identity is withheld when the case was reported anonymously. */
const serializeAdminComplaint = (c) => ({
    id: c.id,
    reason: c.reason,
    details: c.details,
    status: c.status,
    resolutionNote: c.resolutionNote,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    reviewedAt: c.reviewedAt,
    reviewedBy: c.reviewedBy ? { id: c.reviewedBy.id, name: c.reviewedBy.name } : null,
    case: {
        id: c.case.id,
        reference: caseRef(c.case),
        category: c.case.category,
        status: c.case.status,
        isAnonymous: c.case.isAnonymous,
        currentOfficerId: c.case.officerId,
    },
    reporter: c.case.isAnonymous
        ? null
        : { id: c.reporter.id, name: c.reporter.name, email: c.reporter.email },
    officer: { id: c.officer.id, name: c.officer.name, email: c.officer.email, isActive: c.officer.isActive },
});

const adminComplaintInclude = {
    case: { include: { trackingCode: true } },
    reporter: { select: { id: true, name: true, email: true } },
    officer: { select: { id: true, name: true, email: true, isActive: true } },
    reviewedBy: { select: { id: true, name: true } },
};

/** Officers get the message only; admins also get the complaint it answers. */
const serializeStaffMessage = (m, viewerRole) => ({
    id: m.id,
    officerId: m.officerId,
    kind: m.kind,
    content: m.content,
    fromAdmin: m.sender.role === 'ADMIN',
    senderName: m.sender.role === 'ADMIN'
        ? (viewerRole === 'ADMIN' ? m.sender.name || 'Admin' : 'JusticeNow Admin')
        : m.sender.name || 'Officer',
    createdAt: m.createdAt,
    readAt: m.sender.role === 'ADMIN' ? m.readByOfficerAt : m.readByAdminAt,
    ...(viewerRole === 'ADMIN' ? { complaintId: m.complaintId } : {}),
});

const staffMessageInclude = { sender: { select: { id: true, name: true, role: true } } };

/** Resolves the thread an officer or admin may access; sends the error itself and returns null when denied. */
const resolveThreadOfficer = async (req, res) => {
    const officerId = req.params.officerId === 'me' ? req.user.id : parseId(req.params.officerId);
    if (!officerId) {
        res.status(400).json({ error: 'Invalid officer ID.' });
        return null;
    }
    if (req.user.role === 'OFFICER' && officerId !== req.user.id) {
        res.status(403).json({ error: 'You can only open your own conversation with the admin team.' });
        return null;
    }
    const officer = await prisma.user.findUnique({
        where: { id: officerId },
        select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!officer || officer.role !== 'OFFICER') {
        res.status(404).json({ error: 'Officer not found.' });
        return null;
    }
    return officer;
};

// ---------------------------------------------------------------------------
// Citizen
// ---------------------------------------------------------------------------

/**
 * POST /api/cases/:caseId/complaints
 * Citizen reports the officer currently handling their case.
 */
const createComplaint = async (req, res) => {
    try {
        const caseId = parseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const { reason } = req.body;
        const details = typeof req.body.details === 'string' ? req.body.details.trim() : '';
        if (!COMPLAINT_REASONS.includes(reason)) {
            return res.status(400).json({ error: 'Choose what went wrong.' });
        }
        if (details.length < DETAILS_MIN) {
            return res.status(400).json({ error: `Please describe what happened in at least ${DETAILS_MIN} characters.` });
        }
        if (details.length > TEXT_MAX) {
            return res.status(400).json({ error: `Please keep your description under ${TEXT_MAX} characters.` });
        }

        const foundCase = await prisma.case.findUnique({ where: { id: caseId }, include: { trackingCode: true } });
        // 404 rather than 403 so a citizen cannot probe other people's case ids.
        if (!foundCase || foundCase.reporterId !== req.user.id) return res.status(404).json({ error: 'Case not found.' });
        if (!foundCase.officerId) {
            return res.status(400).json({ error: 'No officer is assigned to this case yet, so there is no one to report.' });
        }

        const [activeForCase, recentCount] = await Promise.all([
            prisma.officerComplaint.findFirst({
                where: { caseId, reporterId: req.user.id, officerId: foundCase.officerId, status: ACTIVE_COMPLAINT },
                select: { id: true },
            }),
            prisma.officerComplaint.count({
                where: { reporterId: req.user.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            }),
        ]);
        if (activeForCase) {
            return res.status(409).json({ error: 'You already reported this officer for this case. An admin is looking at it.' });
        }
        if (recentCount >= DAILY_COMPLAINT_LIMIT) {
            return res.status(429).json({ error: 'You have sent several reports today. Please wait a day before sending another.' });
        }

        const complaint = await prisma.officerComplaint.create({
            data: { caseId, reporterId: req.user.id, officerId: foundCase.officerId, reason, details },
        });

        notifyAdmins(req.app.get('io'), {
            type: 'OFFICER_COMPLAINT',
            title: 'Officer reported by a citizen',
            body: `${caseRef(foundCase)} · ${reason.replace(/_/g, ' ').toLowerCase()}`,
            href: `/admin/complaints/${complaint.id}`,
        });

        res.status(201).json(serializeCitizenComplaint(complaint));
    } catch (error) {
        console.error('Error creating officer complaint:', error);
        res.status(500).json({ error: 'Unable to send your report right now.' });
    }
};

/**
 * GET /api/cases/:caseId/complaints
 * The citizen's own reports on one case, newest first.
 */
const listCaseComplaints = async (req, res) => {
    try {
        const caseId = parseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const foundCase = await prisma.case.findUnique({ where: { id: caseId }, select: { reporterId: true } });
        if (!foundCase || foundCase.reporterId !== req.user.id) return res.status(404).json({ error: 'Case not found.' });

        const complaints = await prisma.officerComplaint.findMany({
            where: { caseId, reporterId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json(complaints.map(serializeCitizenComplaint));
    } catch (error) {
        console.error('Error loading case complaints:', error);
        res.status(500).json({ error: 'Unable to load your reports.' });
    }
};

// ---------------------------------------------------------------------------
// Admin: complaint review
// ---------------------------------------------------------------------------

/**
 * GET /api/admin/complaints?status=OPEN,UNDER_REVIEW
 * Review queue, newest first, with counts per status for the filter chips.
 */
const listComplaints = async (req, res) => {
    try {
        const statuses = String(req.query.status || '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => ['OPEN', ...REVIEW_STATUSES].includes(s));
        const where = statuses.length ? { status: { in: statuses } } : {};

        const [complaints, counts] = await Promise.all([
            prisma.officerComplaint.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, include: adminComplaintInclude }),
            prisma.officerComplaint.groupBy({ by: ['status'], _count: { _all: true } }),
        ]);

        res.json({
            complaints: complaints.map(serializeAdminComplaint),
            counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
        });
    } catch (error) {
        console.error('Error listing complaints:', error);
        res.status(500).json({ error: 'Unable to load officer reports.' });
    }
};

/**
 * GET /api/admin/complaints/:id
 * One complaint plus the officer's track record and the warnings sent about it.
 */
const getComplaint = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (!id) return res.status(400).json({ error: 'Invalid report ID.' });

        const complaint = await prisma.officerComplaint.findUnique({ where: { id }, include: adminComplaintInclude });
        if (!complaint) return res.status(404).json({ error: 'Report not found.' });

        const [totalAgainst, activeAgainst, warningsSent, linkedMessages] = await Promise.all([
            prisma.officerComplaint.count({ where: { officerId: complaint.officerId } }),
            prisma.officerComplaint.count({ where: { officerId: complaint.officerId, status: ACTIVE_COMPLAINT } }),
            prisma.staffMessage.count({ where: { officerId: complaint.officerId, kind: 'WARNING' } }),
            prisma.staffMessage.findMany({
                where: { complaintId: id },
                orderBy: { createdAt: 'asc' },
                include: staffMessageInclude,
            }),
        ]);

        res.json({
            ...serializeAdminComplaint(complaint),
            officerRecord: { totalComplaints: totalAgainst, activeComplaints: activeAgainst, warningsSent },
            linkedMessages: linkedMessages.map((m) => serializeStaffMessage(m, 'ADMIN')),
        });
    } catch (error) {
        console.error('Error loading complaint:', error);
        res.status(500).json({ error: 'Unable to load this report.' });
    }
};

/**
 * PATCH /api/admin/complaints/:id
 * Body: { status: UNDER_REVIEW | ACTION_TAKEN | DISMISSED, resolutionNote? }
 * A closing decision needs a note, because the citizen is shown it.
 */
const updateComplaint = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (!id) return res.status(400).json({ error: 'Invalid report ID.' });

        const { status } = req.body;
        const resolutionNote = typeof req.body.resolutionNote === 'string' ? req.body.resolutionNote.trim() : '';
        if (!REVIEW_STATUSES.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Valid values: ${REVIEW_STATUSES.join(', ')}` });
        }
        const isClosing = status === 'ACTION_TAKEN' || status === 'DISMISSED';
        if (isClosing && resolutionNote.length < RESOLUTION_MIN) {
            return res.status(400).json({ error: `Write a short note for the citizen (at least ${RESOLUTION_MIN} characters).` });
        }
        if (resolutionNote.length > TEXT_MAX) {
            return res.status(400).json({ error: `Keep the note under ${TEXT_MAX} characters.` });
        }

        const existing = await prisma.officerComplaint.findUnique({ where: { id }, select: { status: true } });
        if (!existing) return res.status(404).json({ error: 'Report not found.' });
        if (existing.status === status) return res.status(400).json({ error: 'The report already has this status.' });

        const updated = await prisma.officerComplaint.update({
            where: { id },
            data: {
                status,
                ...(resolutionNote ? { resolutionNote } : {}),
                reviewedById: req.user.id,
                reviewedAt: new Date(),
            },
            include: adminComplaintInclude,
        });

        const io = req.app.get('io');
        notifyUser(io, updated.reporterId, {
            type: 'COMPLAINT_UPDATED',
            title: status === 'UNDER_REVIEW' ? 'Your report is being reviewed' : 'Your report was reviewed',
            body: `${caseRef(updated.case)} · ${CITIZEN_COMPLAINT_UPDATES[status]}`,
            href: `/cases/${updated.caseId}`,
        });
        notifyAdmins(io, { type: 'REFRESH', silent: true });

        res.json(serializeAdminComplaint(updated));
    } catch (error) {
        console.error('Error updating complaint:', error);
        res.status(500).json({ error: 'Unable to update this report.' });
    }
};

// ---------------------------------------------------------------------------
// Admin <-> officer channel
// ---------------------------------------------------------------------------

/**
 * GET /api/staff-chat/threads
 * Admin: every officer conversation, newest activity first, with unread counts.
 * Officer: their own conversation (empty array until an admin writes).
 */
const listThreads = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'ADMIN';
        const officers = await prisma.user.findMany({
            where: { role: 'OFFICER', staffThread: { some: {} }, ...(isAdmin ? {} : { id: req.user.id }) },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                staffThread: { orderBy: { createdAt: 'desc' }, take: 1, include: staffMessageInclude },
            },
        });
        if (officers.length === 0) return res.json([]);

        const officerIds = officers.map((o) => o.id);
        const unreadField = isAdmin ? 'readByAdminAt' : 'readByOfficerAt';
        const [unread, unreadWarnings, activeComplaints] = await Promise.all([
            prisma.staffMessage.groupBy({
                by: ['officerId'],
                where: { officerId: { in: officerIds }, [unreadField]: null },
                _count: { _all: true },
            }),
            isAdmin
                ? Promise.resolve([])
                : prisma.staffMessage.groupBy({
                    by: ['officerId'],
                    where: { officerId: { in: officerIds }, readByOfficerAt: null, kind: 'WARNING' },
                    _count: { _all: true },
                }),
            isAdmin
                ? prisma.officerComplaint.groupBy({
                    by: ['officerId'],
                    where: { officerId: { in: officerIds }, status: ACTIVE_COMPLAINT },
                    _count: { _all: true },
                })
                : Promise.resolve([]),
        ]);
        const toMap = (rows) => new Map(rows.map((r) => [r.officerId, r._count._all]));
        const unreadMap = toMap(unread);
        const warningMap = toMap(unreadWarnings);
        const complaintMap = toMap(activeComplaints);

        const threads = officers
            .map((o) => {
                const last = o.staffThread[0];
                return {
                    officerId: o.id,
                    officerName: o.name || o.email,
                    officerActive: o.isActive,
                    lastMessage: serializeStaffMessage(last, req.user.role),
                    unreadCount: unreadMap.get(o.id) || 0,
                    hasUnreadWarning: (warningMap.get(o.id) || 0) > 0,
                    ...(isAdmin ? { activeComplaints: complaintMap.get(o.id) || 0 } : {}),
                };
            })
            .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

        res.json(threads);
    } catch (error) {
        console.error('Error listing staff threads:', error);
        res.status(500).json({ error: 'Unable to load conversations.' });
    }
};

/**
 * GET /api/staff-chat/:officerId/messages?before=<messageId>
 * Oldest-first page of up to 100 messages. Opening the thread marks the other
 * side's messages as read.
 */
const getThreadMessages = async (req, res) => {
    try {
        const officer = await resolveThreadOfficer(req, res);
        if (!officer) return;

        const before = parseId(req.query.before);
        const page = await prisma.staffMessage.findMany({
            where: { officerId: officer.id, ...(before ? { id: { lt: before } } : {}) },
            orderBy: { id: 'desc' },
            take: MESSAGE_PAGE + 1,
            include: staffMessageInclude,
        });
        const hasMore = page.length > MESSAGE_PAGE;
        const messages = page.slice(0, MESSAGE_PAGE).reverse();

        const isAdmin = req.user.role === 'ADMIN';
        const readField = isAdmin ? 'readByAdminAt' : 'readByOfficerAt';
        const marked = await prisma.staffMessage.updateMany({
            where: { officerId: officer.id, [readField]: null },
            data: { [readField]: new Date() },
        });
        if (marked.count > 0) {
            // Clears the unread badge and bell on the reader's other devices.
            const io = req.app.get('io');
            if (isAdmin) notifyAdmins(io, { type: 'REFRESH', silent: true });
            else notifyUser(io, officer.id, { type: 'REFRESH', silent: true });
        }

        res.json({
            officer: { id: officer.id, name: officer.name, email: officer.email, isActive: officer.isActive },
            messages: messages.map((m) => serializeStaffMessage(m, req.user.role)),
            hasMore,
        });
    } catch (error) {
        console.error('Error loading staff messages:', error);
        res.status(500).json({ error: 'Unable to load this conversation.' });
    }
};

/**
 * POST /api/staff-chat/:officerId/messages
 * Body: { content, kind?: MESSAGE | WARNING, complaintId? }
 * Only admins can send warnings or link a complaint.
 */
const postThreadMessage = async (req, res) => {
    try {
        const officer = await resolveThreadOfficer(req, res);
        if (!officer) return;

        const isAdmin = req.user.role === 'ADMIN';
        const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
        const kind = req.body.kind === 'WARNING' ? 'WARNING' : 'MESSAGE';
        if (!content) return res.status(400).json({ error: 'Write a message first.' });
        if (content.length > TEXT_MAX) return res.status(400).json({ error: `Keep the message under ${TEXT_MAX} characters.` });
        if (kind === 'WARNING' && !isAdmin) return res.status(403).json({ error: 'Only admins can send warnings.' });

        let complaintId = null;
        if (isAdmin && req.body.complaintId != null) {
            complaintId = parseId(req.body.complaintId);
            const complaint = complaintId
                ? await prisma.officerComplaint.findUnique({ where: { id: complaintId }, select: { officerId: true } })
                : null;
            if (!complaint || complaint.officerId !== officer.id) {
                return res.status(400).json({ error: 'That report is not about this officer.' });
            }
        }

        const now = new Date();
        const message = await prisma.staffMessage.create({
            data: {
                officerId: officer.id,
                senderId: req.user.id,
                kind,
                content,
                complaintId,
                // The sender has obviously read their own message.
                ...(isAdmin ? { readByAdminAt: now } : { readByOfficerAt: now }),
            },
            include: staffMessageInclude,
        });

        // Opening a complaint thread with a warning moves the report into review.
        if (complaintId && kind === 'WARNING') {
            await prisma.officerComplaint.updateMany({
                where: { id: complaintId, status: 'OPEN' },
                data: { status: 'UNDER_REVIEW', reviewedById: req.user.id, reviewedAt: now },
            });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`user:${officer.id}`).emit('staff:message', serializeStaffMessage(message, 'OFFICER'));
            io.to('role:ADMIN').emit('staff:message', serializeStaffMessage(message, 'ADMIN'));
        }
        if (isAdmin) {
            notifyUser(io, officer.id, {
                type: kind === 'WARNING' ? 'STAFF_WARNING' : 'STAFF_MESSAGE',
                title: kind === 'WARNING' ? 'Formal warning from JusticeNow Admin' : 'Message from JusticeNow Admin',
                body: content.slice(0, 120),
                href: '/officer/admin-chat',
            });
            notifyAdmins(io, { type: 'REFRESH', silent: true });
        } else {
            notifyAdmins(io, {
                type: 'STAFF_REPLY',
                title: `Reply from ${officer.name || 'an officer'}`,
                body: content.slice(0, 120),
                href: `/admin/officer-chat/${officer.id}`,
            });
        }

        res.status(201).json(serializeStaffMessage(message, req.user.role));
    } catch (error) {
        console.error('Error sending staff message:', error);
        res.status(500).json({ error: 'Unable to send this message.' });
    }
};

module.exports = {
    COMPLAINT_REASONS,
    createComplaint,
    listCaseComplaints,
    listComplaints,
    getComplaint,
    updateComplaint,
    listThreads,
    getThreadMessages,
    postThreadMessage,
};
