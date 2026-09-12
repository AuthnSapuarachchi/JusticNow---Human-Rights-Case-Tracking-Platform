const prisma = require('../config/db');

/**
 * Validate that case ID is a positive integer
 */
const parseCaseId = (param) => {
    const caseId = Number(param);
    if (!Number.isInteger(caseId) || caseId < 1) return null;
    return caseId;
};

/**
 * GET /api/officer/dashboard/stats
 * Returns counts for:
 * - total assigned to me
 * - new
 * - urgent
 * - waiting-for-user
 * - investigating
 * - recently updated (e.g. last 7 days by CaseAction)
 */
const getDashboardStats = async (req, res) => {
    try {
        const officerId = req.user.id;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalAssigned,
            newCases,
            urgent,
            waitingForUser,
            investigating,
            recentActions
        ] = await Promise.all([
            prisma.case.count({ where: { officerId } }),
            prisma.case.count({ where: { status: { in: ['NEW', 'SUBMITTED'] } } }),
            prisma.case.count({ where: { priority: 'URGENT' } }),
            prisma.case.count({ where: { status: { in: ['WAITING_FOR_USER', 'ACTION_REQUIRED'] } } }),
            prisma.case.count({ where: { status: { in: ['INVESTIGATING', 'UNDER_REVIEW'] } } }),
            prisma.caseAction.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { caseId: true },
                distinct: ['caseId'],
            }),
        ]);

        const recentlyUpdated = recentActions.length;

        res.json({
            totalAssigned,
            newCases,
            urgent,
            waitingForUser,
            investigating,
            recentlyUpdated,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Unable to load dashboard stats.' });
    }
};

/**
 * GET /api/officer/cases
 * Queue list, filterable by assignedToMe, status, priority; paginated.
 */
const getOfficerCases = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            assignedToMe,
            status,
            priority,
            search,
            sortBy = 'updatedAt',
            sortOrder = 'desc',
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const where = {};

        if (assignedToMe === 'true' || assignedToMe === true) {
            where.officerId = req.user.id;
        } else if (assignedToMe === 'false' || assignedToMe === false) {
            where.officerId = null;
        }

        if (status && status !== 'ALL') {
            const statusList = status.split(',').map((s) => s.trim()).filter(Boolean);
            if (statusList.length === 1) {
                where.status = statusList[0];
            } else if (statusList.length > 1) {
                where.status = { in: statusList };
            }
        }

        if (priority && priority !== 'ALL') {
            where.priority = priority.toUpperCase();
        }

        if (search && search.trim()) {
            const term = search.trim();
            where.OR = [
                { description: { contains: term, mode: 'insensitive' } },
                { location: { contains: term, mode: 'insensitive' } },
                { trackingCode: { is: { code: { contains: term, mode: 'insensitive' } } } },
            ];
        }

        const validSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'id'];
        const resolvedSortBy = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
        const resolvedOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

        const [total, cases] = await Promise.all([
            prisma.case.count({ where }),
            prisma.case.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { [resolvedSortBy]: resolvedOrder },
                include: {
                    trackingCode: { select: { code: true } },
                    officer: { select: { id: true, name: true, email: true } },
                    reporter: { select: { id: true, name: true, email: true } },
                    evidence: { select: { id: true, fileUrl: true, fileType: true, createdAt: true } },
                    _count: {
                        select: {
                            notes: true,
                            infoRequests: true,
                            referrals: true,
                            actions: true,
                            evidence: true,
                        },
                    },
                },
            }),
        ]);

        res.json({
            cases,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
        });
    } catch (error) {
        console.error('Error fetching officer case queue:', error);
        res.status(500).json({ error: 'Unable to load case queue.' });
    }
};

/**
 * GET /api/officer/cases/:caseId
 * Full case detail: report fields, evidence list, notes, status history, referrals, actions
 */
const getOfficerCaseDetail = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const caseRecord = await prisma.case.findUnique({
            where: { id: caseId },
            include: {
                trackingCode: true,
                officer: { select: { id: true, name: true, email: true, role: true } },
                reporter: { select: { id: true, name: true, email: true } },
                evidence: true,
                notes: {
                    include: {
                        author: { select: { id: true, name: true, email: true, role: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                statusHistory: {
                    include: {
                        changedBy: { select: { id: true, name: true, email: true, role: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                infoRequests: {
                    include: {
                        requestedBy: { select: { id: true, name: true, email: true, role: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                referrals: {
                    include: {
                        referredBy: { select: { id: true, name: true, email: true } },
                        referredToOrganization: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
                actions: {
                    include: {
                        actor: { select: { id: true, name: true, email: true, role: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!caseRecord) {
            return res.status(404).json({ error: 'Case not found.' });
        }

        res.json(caseRecord);
    } catch (error) {
        console.error('Error fetching officer case detail:', error);
        res.status(500).json({ error: 'Unable to load case detail.' });
    }
};

/**
 * PATCH /api/officer/cases/:caseId/assign
 * Sets officerId, writes a CaseAction
 */
const assignCase = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const targetOfficerId = req.body.officerId ? Number(req.body.officerId) : req.user.id;
        if (!Number.isInteger(targetOfficerId) || targetOfficerId < 1) {
            return res.status(400).json({ error: 'Invalid officer ID.' });
        }

        const targetOfficer = await prisma.user.findUnique({
            where: { id: targetOfficerId },
            select: { id: true, name: true, email: true, role: true },
        });

        if (!targetOfficer || (targetOfficer.role !== 'OFFICER' && targetOfficer.role !== 'ADMIN')) {
            return res.status(400).json({ error: 'Target user is not an eligible officer or admin.' });
        }

        const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
        if (!existingCase) {
            return res.status(404).json({ error: 'Case not found.' });
        }

        const officerDisplayName = targetOfficer.name || targetOfficer.email;

        const [updatedCase, action] = await prisma.$transaction([
            prisma.case.update({
                where: { id: caseId },
                data: { officerId: targetOfficerId },
                include: {
                    officer: { select: { id: true, name: true, email: true } },
                    trackingCode: true,
                },
            }),
            prisma.caseAction.create({
                data: {
                    caseId,
                    actorId: req.user.id,
                    actionType: 'ASSIGNED',
                    detail: JSON.stringify({
                        assignedOfficerId: targetOfficerId,
                        assignedOfficerName: officerDisplayName,
                    }),
                },
                include: {
                    actor: { select: { id: true, name: true, email: true } },
                },
            }),
        ]);

        res.json({
            message: `Case assigned to ${officerDisplayName}.`,
            case: updatedCase,
            action,
        });
    } catch (error) {
        console.error('Error assigning case:', error);
        res.status(500).json({ error: 'Unable to assign case.' });
    }
};

/**
 * PATCH /api/officer/cases/:caseId/status
 * Validates transition, writes CaseStatusHistory + CaseAction
 */
const updateCaseStatus = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const { status: newStatus, note } = req.body;
        const validStatuses = [
            'SUBMITTED',
            'UNDER_REVIEW',
            'ACTION_REQUIRED',
            'RESOLVED',
            'CLOSED',
            'NEW',
            'WAITING_FOR_USER',
            'INVESTIGATING',
        ];

        if (!newStatus || !validStatuses.includes(newStatus)) {
            return res.status(400).json({
                error: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
            });
        }

        const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
        if (!existingCase) {
            return res.status(404).json({ error: 'Case not found.' });
        }

        if (existingCase.status === newStatus) {
            return res.status(400).json({ error: 'Case is already in this status.' });
        }

        const fromStatus = existingCase.status;
        const normalizedNote = note?.trim() || null;

        const [updatedCase, statusHistory, action] = await prisma.$transaction([
            prisma.case.update({
                where: { id: caseId },
                data: { status: newStatus },
                include: {
                    officer: { select: { id: true, name: true, email: true } },
                    trackingCode: true,
                },
            }),
            prisma.caseStatusHistory.create({
                data: {
                    caseId,
                    fromStatus,
                    toStatus: newStatus,
                    changedById: req.user.id,
                    note: normalizedNote,
                },
                include: {
                    changedBy: { select: { id: true, name: true, email: true, role: true } },
                },
            }),
            prisma.caseAction.create({
                data: {
                    caseId,
                    actorId: req.user.id,
                    actionType: 'STATUS_CHANGED',
                    detail: JSON.stringify({
                        from: fromStatus,
                        to: newStatus,
                        note: normalizedNote,
                    }),
                },
                include: {
                    actor: { select: { id: true, name: true, email: true } },
                },
            }),
        ]);

        res.json({
            message: `Case status changed from ${fromStatus} to ${newStatus}.`,
            case: updatedCase,
            statusHistory,
            action,
        });
    } catch (error) {
        console.error('Error updating case status:', error);
        res.status(500).json({ error: 'Unable to update case status.' });
    }
};

/**
 * POST /api/officer/cases/:caseId/notes
 * Adds private officer note, writes CaseAction
 */
const addCaseNote = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const { content } = req.body;
        const normalizedContent = content?.trim();
        if (!normalizedContent || normalizedContent.length < 2) {
            return res.status(400).json({ error: 'Note content of at least 2 characters is required.' });
        }

        const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
        if (!existingCase) {
            return res.status(404).json({ error: 'Case not found.' });
        }

        const [note, action] = await prisma.$transaction([
            prisma.caseNote.create({
                data: {
                    caseId,
                    authorId: req.user.id,
                    content: normalizedContent,
                },
                include: {
                    author: { select: { id: true, name: true, email: true, role: true } },
                },
            }),
            prisma.caseAction.create({
                data: {
                    caseId,
                    actorId: req.user.id,
                    actionType: 'NOTE_ADDED',
                    detail: normalizedContent.substring(0, 200),
                },
                include: {
                    actor: { select: { id: true, name: true, email: true } },
                },
            }),
        ]);

        res.status(201).json(note);
    } catch (error) {
        console.error('Error adding case note:', error);
        res.status(500).json({ error: 'Unable to add note.' });
    }
};

/**
 * GET /api/officer/cases/:caseId/notes
 * Fetches private officer notes
 */
const getCaseNotes = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const notes = await prisma.caseNote.findMany({
            where: { caseId },
            include: {
                author: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(notes);
    } catch (error) {
        console.error('Error loading case notes:', error);
        res.status(500).json({ error: 'Unable to load notes.' });
    }
};

/**
 * POST /api/officer/cases/:caseId/info-requests
 * Sends information request, sets case to WAITING_FOR_USER, writes CaseAction
 */
const createInfoRequest = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const { message } = req.body;
        const normalizedMessage = message?.trim();
        if (!normalizedMessage || normalizedMessage.length < 3) {
            return res.status(400).json({ error: 'Information request message of at least 3 characters is required.' });
        }

        const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
        if (!existingCase) {
            return res.status(404).json({ error: 'Case not found.' });
        }

        const [infoRequest, action, updatedCase] = await prisma.$transaction([
            prisma.caseInfoRequest.create({
                data: {
                    caseId,
                    requestedById: req.user.id,
                    message: normalizedMessage,
                    status: 'PENDING',
                },
                include: {
                    requestedBy: { select: { id: true, name: true, email: true, role: true } },
                },
            }),
            prisma.caseAction.create({
                data: {
                    caseId,
                    actorId: req.user.id,
                    actionType: 'INFO_REQUESTED',
                    detail: normalizedMessage.substring(0, 200),
                },
                include: {
                    actor: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.case.update({
                where: { id: caseId },
                data: { status: 'WAITING_FOR_USER' },
            }),
        ]);

        res.status(201).json({
            message: 'Information request created and case status moved to WAITING_FOR_USER.',
            infoRequest,
            case: updatedCase,
            action,
        });
    } catch (error) {
        console.error('Error creating info request:', error);
        res.status(500).json({ error: 'Unable to create info request.' });
    }
};

/**
 * POST /api/officer/cases/:caseId/referrals
 * Refers case to a legal organization or external entity
 */
const createReferral = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const { organizationId, referredToText, reason } = req.body;
        const normalizedReason = reason?.trim();
        if (!normalizedReason || normalizedReason.length < 3) {
            return res.status(400).json({ error: 'Referral reason of at least 3 characters is required.' });
        }

        const orgIdNum = organizationId ? Number(organizationId) : null;
        const normalizedText = referredToText?.trim() || null;

        if (!orgIdNum && !normalizedText) {
            return res.status(400).json({ error: 'Either an organization ID or referral organization name is required.' });
        }

        const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
        if (!existingCase) {
            return res.status(404).json({ error: 'Case not found.' });
        }

        let orgName = normalizedText;
        if (orgIdNum) {
            const org = await prisma.legalOrganization.findUnique({ where: { id: orgIdNum } });
            if (org) orgName = org.name;
        }

        const [referral, action] = await prisma.$transaction([
            prisma.caseReferral.create({
                data: {
                    caseId,
                    referredById: req.user.id,
                    referredToOrganizationId: orgIdNum,
                    referredToText: orgName,
                    reason: normalizedReason,
                },
                include: {
                    referredBy: { select: { id: true, name: true, email: true } },
                    referredToOrganization: true,
                },
            }),
            prisma.caseAction.create({
                data: {
                    caseId,
                    actorId: req.user.id,
                    actionType: 'REFERRED',
                    detail: `Referred to ${orgName || 'organization'}: ${normalizedReason.substring(0, 150)}`,
                },
                include: {
                    actor: { select: { id: true, name: true, email: true } },
                },
            }),
        ]);

        res.status(201).json({
            message: 'Referral recorded successfully.',
            referral,
            action,
        });
    } catch (error) {
        console.error('Error creating case referral:', error);
        res.status(500).json({ error: 'Unable to record referral.' });
    }
};

/**
 * POST /api/officer/cases/:caseId/actions
 * Manual free-text action log
 */
const createCaseAction = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const { actionType, detail } = req.body;
        const normalizedDetail = detail?.trim();
        if (!normalizedDetail) {
            return res.status(400).json({ error: 'Action detail is required.' });
        }

        const validActionTypes = [
            'ASSIGNED',
            'STATUS_CHANGED',
            'NOTE_ADDED',
            'INFO_REQUESTED',
            'REFERRED',
            'CLOSED',
            'ESCALATED',
        ];

        const resolvedType = validActionTypes.includes(actionType) ? actionType : 'NOTE_ADDED';

        const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
        if (!existingCase) {
            return res.status(404).json({ error: 'Case not found.' });
        }

        const action = await prisma.caseAction.create({
            data: {
                caseId,
                actorId: req.user.id,
                actionType: resolvedType,
                detail: normalizedDetail,
            },
            include: {
                actor: { select: { id: true, name: true, email: true, role: true } },
            },
        });

        res.status(201).json(action);
    } catch (error) {
        console.error('Error logging case action:', error);
        res.status(500).json({ error: 'Unable to log action.' });
    }
};

/**
 * GET /api/officer/cases/:caseId/actions
 * Full history feed
 */
const getCaseActions = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const actions = await prisma.caseAction.findMany({
            where: { caseId },
            include: {
                actor: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(actions);
    } catch (error) {
        console.error('Error loading case actions:', error);
        res.status(500).json({ error: 'Unable to load case actions.' });
    }
};

/**
 * POST /api/officer/cases/:caseId/close
 * Closes the case, records status history and action
 */
const closeCase = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const { reason, note } = req.body;
        const closeReason = reason?.trim() || note?.trim() || 'Case closed by officer';

        const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
        if (!existingCase) {
            return res.status(404).json({ error: 'Case not found.' });
        }

        if (existingCase.status === 'CLOSED') {
            return res.status(400).json({ error: 'Case is already closed.' });
        }

        const fromStatus = existingCase.status;

        const [updatedCase, statusHistory, action] = await prisma.$transaction([
            prisma.case.update({
                where: { id: caseId },
                data: { status: 'CLOSED' },
                include: {
                    officer: { select: { id: true, name: true, email: true } },
                    trackingCode: true,
                },
            }),
            prisma.caseStatusHistory.create({
                data: {
                    caseId,
                    fromStatus,
                    toStatus: 'CLOSED',
                    changedById: req.user.id,
                    note: closeReason,
                },
                include: {
                    changedBy: { select: { id: true, name: true, email: true, role: true } },
                },
            }),
            prisma.caseAction.create({
                data: {
                    caseId,
                    actorId: req.user.id,
                    actionType: 'CLOSED',
                    detail: closeReason,
                },
                include: {
                    actor: { select: { id: true, name: true, email: true } },
                },
            }),
        ]);

        res.json({
            message: 'Case closed successfully.',
            case: updatedCase,
            statusHistory,
            action,
        });
    } catch (error) {
        console.error('Error closing case:', error);
        res.status(500).json({ error: 'Unable to close case.' });
    }
};

/**
 * POST /api/officer/cases/:caseId/escalate
 * Escalates case: sets escalated = true, escalatedAt = now, priority = URGENT
 */
const escalateCase = async (req, res) => {
    try {
        const caseId = parseCaseId(req.params.caseId);
        if (!caseId) return res.status(400).json({ error: 'Invalid case ID.' });

        const { reason } = req.body;
        const escalateReason = reason?.trim() || 'Case escalated to urgent by officer';

        const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
        if (!existingCase) {
            return res.status(404).json({ error: 'Case not found.' });
        }

        const [updatedCase, action] = await prisma.$transaction([
            prisma.case.update({
                where: { id: caseId },
                data: {
                    escalated: true,
                    escalatedAt: new Date(),
                    priority: 'URGENT',
                },
                include: {
                    officer: { select: { id: true, name: true, email: true } },
                    trackingCode: true,
                },
            }),
            prisma.caseAction.create({
                data: {
                    caseId,
                    actorId: req.user.id,
                    actionType: 'ESCALATED',
                    detail: escalateReason,
                },
                include: {
                    actor: { select: { id: true, name: true, email: true } },
                },
            }),
        ]);

        res.json({
            message: 'Case escalated to urgent.',
            case: updatedCase,
            action,
        });
    } catch (error) {
        console.error('Error escalating case:', error);
        res.status(500).json({ error: 'Unable to escalate case.' });
    }
};

/**
 * GET /api/officer/organizations
 * Helper for referral dropdown: lists verified legal organizations
 */
const getOrganizations = async (req, res) => {
    try {
        const organizations = await prisma.legalOrganization.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(organizations);
    } catch (error) {
        console.error('Error loading organizations:', error);
        res.status(500).json({ error: 'Unable to load organizations.' });
    }
};

module.exports = {
    getDashboardStats,
    getOfficerCases,
    getOfficerCaseDetail,
    assignCase,
    updateCaseStatus,
    addCaseNote,
    getCaseNotes,
    createInfoRequest,
    createReferral,
    createCaseAction,
    getCaseActions,
    closeCase,
    escalateCase,
    getOrganizations,
};
