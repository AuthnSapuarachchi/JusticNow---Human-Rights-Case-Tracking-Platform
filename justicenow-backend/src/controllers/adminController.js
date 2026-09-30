const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

const OPEN_STATUS_FILTER = { notIn: ['RESOLVED', 'CLOSED'] };
const VALID_CATEGORIES = ['WORKPLACE_DISCRIMINATION', 'HUMAN_RIGHTS_VIOLATION', 'DIGITAL_PRIVACY', 'OTHER'];

/**
 * Validate that an ID param is a positive integer
 */
const parseId = (param) => {
    const id = Number(param);
    if (!Number.isInteger(id) || id < 1) return null;
    return id;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const officerSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
    organizationId: true,
    organization: { select: { id: true, name: true } },
    createdAt: true,
};

/**
 * Attach an open-case count to each officer
 */
const withOpenCaseCounts = async (officers) => {
    if (officers.length === 0) return [];
    const counts = await prisma.case.groupBy({
        by: ['officerId'],
        where: { officerId: { in: officers.map((o) => o.id) }, status: OPEN_STATUS_FILTER },
        _count: { _all: true },
    });
    const countMap = new Map(counts.map((c) => [c.officerId, c._count._all]));
    return officers.map((o) => ({ ...o, openCases: countMap.get(o.id) || 0 }));
};

/**
 * GET /api/admin/stats
 * Anonymized platform statistics — no reporter identity or case descriptions.
 */
const getAdminStats = async (req, res) => {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalCases,
            unassigned,
            urgent,
            newThisWeek,
            resolvedHistory,
            byStatusRaw,
            byCategoryRaw,
            byPriorityRaw,
            activeOfficers,
            attentionCases,
        ] = await Promise.all([
            prisma.case.count(),
            prisma.case.count({ where: { officerId: null, status: { not: 'CLOSED' } } }),
            prisma.case.count({ where: { priority: 'URGENT', status: OPEN_STATUS_FILTER } }),
            prisma.case.count({ where: { createdAt: { gte: weekAgo } } }),
            prisma.caseStatusHistory.findMany({
                where: { toStatus: { in: ['RESOLVED', 'CLOSED'] }, createdAt: { gte: monthStart } },
                select: { caseId: true },
                distinct: ['caseId'],
            }),
            prisma.case.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.case.groupBy({ by: ['category'], _count: { _all: true } }),
            prisma.case.groupBy({ by: ['priority'], _count: { _all: true } }),
            prisma.user.findMany({
                where: { role: 'OFFICER', isActive: true },
                select: { id: true, name: true, email: true },
                orderBy: { name: 'asc' },
            }),
            prisma.case.findMany({
                where: {
                    status: OPEN_STATUS_FILTER,
                    OR: [{ priority: 'URGENT' }, { officerId: null }],
                },
                orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
                take: 5,
                select: {
                    id: true,
                    category: true,
                    status: true,
                    priority: true,
                    updatedAt: true,
                    trackingCode: { select: { code: true } },
                    officer: { select: { id: true, name: true, email: true } },
                },
            }),
        ]);

        const officerWorkload = (await withOpenCaseCounts(activeOfficers))
            .sort((a, b) => b.openCases - a.openCases);

        res.json({
            totalCases,
            unassigned,
            urgent,
            newThisWeek,
            resolvedThisMonth: resolvedHistory.length,
            byStatus: byStatusRaw.map((r) => ({ status: r.status, count: r._count._all })),
            byCategory: byCategoryRaw.map((r) => ({ category: r.category, count: r._count._all })),
            byPriority: byPriorityRaw.map((r) => ({ priority: r.priority, count: r._count._all })),
            officerWorkload,
            needsAttention: attentionCases,
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Unable to load admin statistics.' });
    }
};

/**
 * GET /api/admin/officers?active=true
 */
const listOfficers = async (req, res) => {
    try {
        const where = { role: 'OFFICER' };
        if (req.query.active === 'true') where.isActive = true;
        if (req.query.active === 'false') where.isActive = false;

        const officers = await prisma.user.findMany({
            where,
            select: officerSelect,
            orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        });

        res.json(await withOpenCaseCounts(officers));
    } catch (error) {
        console.error('Error listing officers:', error);
        res.status(500).json({ error: 'Unable to load officers.' });
    }
};

/**
 * Resolve an optional organizationId from the request body.
 * Returns { value } on success or { error } on invalid input.
 */
const resolveOrganizationId = async (raw) => {
    if (raw === undefined) return { value: undefined };
    if (raw === null || raw === '') return { value: null };
    const orgId = parseId(raw);
    if (!orgId) return { error: 'Invalid organization ID.' };
    const org = await prisma.legalOrganization.findUnique({ where: { id: orgId } });
    if (!org) return { error: 'Organization not found.' };
    return { value: orgId };
};

/**
 * POST /api/admin/officers
 * Creates an OFFICER account with a temporary password
 */
const createOfficer = async (req, res) => {
    try {
        const { name, email, password, organizationId } = req.body;

        if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
            return res.status(400).json({ error: 'Name, email, and a password of at least 8 characters are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const org = await resolveOrganizationId(organizationId);
        if (org.error) return res.status(400).json({ error: org.error });

        const hashedPassword = await bcrypt.hash(password, 10);

        const officer = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                role: 'OFFICER',
                organizationId: org.value ?? null,
            },
            select: officerSelect,
        });

        res.status(201).json({ ...officer, openCases: 0 });
    } catch (error) {
        console.error('Error creating officer:', error);
        res.status(500).json({ error: 'Unable to create officer account.' });
    }
};

/**
 * PATCH /api/admin/officers/:id
 * Edit name/email/organization, reset password, or activate/deactivate
 */
const updateOfficer = async (req, res) => {
    try {
        const officerId = parseId(req.params.id);
        if (!officerId) return res.status(400).json({ error: 'Invalid officer ID.' });

        const existing = await prisma.user.findUnique({ where: { id: officerId } });
        if (!existing || existing.role !== 'OFFICER') {
            return res.status(404).json({ error: 'Officer not found.' });
        }

        const { name, email, password, organizationId, isActive } = req.body;
        const data = {};

        if (name !== undefined) {
            if (!name?.trim()) return res.status(400).json({ error: 'Name cannot be empty.' });
            data.name = name.trim();
        }

        if (email !== undefined) {
            const normalizedEmail = email?.trim().toLowerCase();
            if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
                return res.status(400).json({ error: 'Please enter a valid email address.' });
            }
            if (normalizedEmail !== existing.email) {
                const clash = await prisma.user.findUnique({ where: { email: normalizedEmail } });
                if (clash) return res.status(409).json({ error: 'An account with this email already exists.' });
            }
            data.email = normalizedEmail;
        }

        if (password !== undefined && password !== '') {
            if (password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters.' });
            }
            data.password = await bcrypt.hash(password, 10);
        }

        const org = await resolveOrganizationId(organizationId);
        if (org.error) return res.status(400).json({ error: org.error });
        if (org.value !== undefined) data.organizationId = org.value;

        if (isActive !== undefined) {
            if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be true or false.' });
            data.isActive = isActive;
        }

        const officer = await prisma.user.update({
            where: { id: officerId },
            data,
            select: officerSelect,
        });

        const [withCount] = await withOpenCaseCounts([officer]);
        res.json(withCount);
    } catch (error) {
        console.error('Error updating officer:', error);
        res.status(500).json({ error: 'Unable to update officer account.' });
    }
};

/**
 * Validate and normalize organization fields from the request body
 */
const buildOrganizationData = (body, { partial }) => {
    const data = {};
    const { name, contactEmail, phone, location, description, verified } = body;

    if (!partial || name !== undefined) {
        if (!name?.trim()) return { error: 'Organization name is required.' };
        data.name = name.trim();
    }

    if (!partial || contactEmail !== undefined) {
        const normalizedEmail = contactEmail?.trim().toLowerCase();
        if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
            return { error: 'A valid contact email is required.' };
        }
        data.contactEmail = normalizedEmail;
    }

    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (location !== undefined) data.location = location?.trim() || null;
    if (description !== undefined) data.description = description?.trim() || null;

    if (verified !== undefined) {
        if (typeof verified !== 'boolean') return { error: 'verified must be true or false.' };
        data.verified = verified;
    }

    return { data };
};

/**
 * GET /api/admin/organizations
 */
const listOrganizations = async (req, res) => {
    try {
        const organizations = await prisma.legalOrganization.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { officers: true, referrals: true } } },
        });
        res.json(organizations);
    } catch (error) {
        console.error('Error listing organizations:', error);
        res.status(500).json({ error: 'Unable to load organizations.' });
    }
};

/**
 * POST /api/admin/organizations
 */
const createOrganization = async (req, res) => {
    try {
        const { data, error } = buildOrganizationData(req.body, { partial: false });
        if (error) return res.status(400).json({ error });

        const organization = await prisma.legalOrganization.create({
            data,
            include: { _count: { select: { officers: true, referrals: true } } },
        });
        res.status(201).json(organization);
    } catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).json({ error: 'Unable to create organization.' });
    }
};

/**
 * PATCH /api/admin/organizations/:id
 */
const updateOrganization = async (req, res) => {
    try {
        const orgId = parseId(req.params.id);
        if (!orgId) return res.status(400).json({ error: 'Invalid organization ID.' });

        const existing = await prisma.legalOrganization.findUnique({ where: { id: orgId } });
        if (!existing) return res.status(404).json({ error: 'Organization not found.' });

        const { data, error } = buildOrganizationData(req.body, { partial: true });
        if (error) return res.status(400).json({ error });

        const organization = await prisma.legalOrganization.update({
            where: { id: orgId },
            data,
            include: { _count: { select: { officers: true, referrals: true } } },
        });
        res.json(organization);
    } catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({ error: 'Unable to update organization.' });
    }
};

/**
 * DELETE /api/admin/organizations/:id
 * Unlinks officers first; referrals are kept (FK is ON DELETE SET NULL).
 */
const deleteOrganization = async (req, res) => {
    try {
        const orgId = parseId(req.params.id);
        if (!orgId) return res.status(400).json({ error: 'Invalid organization ID.' });

        const existing = await prisma.legalOrganization.findUnique({ where: { id: orgId } });
        if (!existing) return res.status(404).json({ error: 'Organization not found.' });

        await prisma.$transaction([
            prisma.user.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
            prisma.legalOrganization.delete({ where: { id: orgId } }),
        ]);

        res.json({ message: `${existing.name} was deleted.` });
    } catch (error) {
        console.error('Error deleting organization:', error);
        res.status(500).json({ error: 'Unable to delete organization.' });
    }
};

/**
 * GET /api/admin/categories
 * Includes the number of cases in each category.
 */
const listCategories = async (req, res) => {
    try {
        const [categories, counts] = await Promise.all([
            prisma.violationCategoryConfig.findMany({ orderBy: { id: 'asc' } }),
            prisma.case.groupBy({ by: ['category'], _count: { _all: true } }),
        ]);
        const countMap = new Map(counts.map((c) => [c.category, c._count._all]));
        res.json(categories.map((c) => ({ ...c, caseCount: countMap.get(c.code) || 0 })));
    } catch (error) {
        console.error('Error listing categories:', error);
        res.status(500).json({ error: 'Unable to load categories.' });
    }
};

/**
 * PATCH /api/admin/categories/:code
 */
const updateCategory = async (req, res) => {
    try {
        const code = String(req.params.code || '').toUpperCase();
        if (!VALID_CATEGORIES.includes(code)) {
            return res.status(400).json({ error: `Invalid category. Valid values: ${VALID_CATEGORIES.join(', ')}` });
        }

        const { label, description, isActive } = req.body;
        const data = {};

        if (label !== undefined) {
            if (!label?.trim()) return res.status(400).json({ error: 'Category label cannot be empty.' });
            data.label = label.trim();
        }
        if (description !== undefined) data.description = description?.trim() || null;
        if (isActive !== undefined) {
            if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be true or false.' });
            data.isActive = isActive;
        }

        const category = await prisma.violationCategoryConfig.upsert({
            where: { code },
            update: data,
            create: { code, label: data.label || code.replace(/_/g, ' '), ...data },
        });
        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Unable to update category.' });
    }
};

/**
 * GET /api/categories (public)
 * Active categories only, for the reporting form.
 */
const listActiveCategories = async (req, res) => {
    try {
        const categories = await prisma.violationCategoryConfig.findMany({
            where: { isActive: true },
            select: { code: true, label: true, description: true },
            orderBy: { id: 'asc' },
        });
        res.json(categories);
    } catch (error) {
        console.error('Error listing active categories:', error);
        res.status(500).json({ error: 'Unable to load categories.' });
    }
};

module.exports = {
    getAdminStats,
    listOfficers,
    createOfficer,
    updateOfficer,
    listOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    listCategories,
    updateCategory,
    listActiveCategories,
};
