const prisma = require('../config/db');

const NOT_FOUND = 'P2025';

const fail = (res, error, message) => {
    console.error(`${message}:`, error);
    if (error?.code === NOT_FOUND) return res.status(404).json({ error: 'That organisation no longer exists.' });
    res.status(500).json({ error: message });
};

// The directory renders languages and categories as chips, so they go over the
// wire as arrays even though they are stored comma-separated.
const toClient = (org) => ({
    id: String(org.id),
    name: org.name,
    description: org.description ?? '',
    verified: org.verified,
    languages: org.languages ? org.languages.split(',').filter(Boolean) : [],
    categories: org.categories ? org.categories.split(',').filter(Boolean) : [],
    isFree: org.isFree,
    distanceKm: org.distanceKm ?? 0,
    location: org.location ?? '',
    contact: { phone: org.phone ?? undefined, email: org.contactEmail || undefined },
});

// Accepts either an array or a comma-separated string, so the admin form and a
// raw API call can both post whichever is convenient.
const toStoredList = (value) => {
    if (Array.isArray(value)) return value.join(',');
    if (typeof value === 'string') return value;
    return undefined;
};

// Public - the directory is browsable without an account, matching the
// anonymity-friendly design of the rest of the app.
const listOrganizations = async (req, res) => {
    try {
        const organizations = await prisma.legalOrganization.findMany({
            orderBy: [{ verified: 'desc' }, { distanceKm: 'asc' }, { name: 'asc' }],
        });
        res.json(organizations.map(toClient));
    } catch (error) {
        fail(res, error, 'Unable to load organisations.');
    }
};

const getOrganization = async (req, res) => {
    try {
        const organization = await prisma.legalOrganization.findUnique({
            where: { id: Number(req.params.id) },
        });
        if (!organization) return res.status(404).json({ error: 'Organisation not found.' });
        res.json(toClient(organization));
    } catch (error) {
        fail(res, error, 'Unable to load this organisation.');
    }
};

// --- Admin-only below. Guarded by authorizeRoles('ADMIN') in the route. ---

const createOrganization = async (req, res) => {
    try {
        const { name, contactEmail, description, languages, categories, isFree, distanceKm, location, phone, verified } = req.body;
        if (!name?.trim() || !contactEmail?.trim()) {
            return res.status(400).json({ error: 'A name and contact email are required.' });
        }

        const organization = await prisma.legalOrganization.create({
            data: {
                name: name.trim(),
                contactEmail: contactEmail.trim(),
                description: description ?? null,
                languages: toStoredList(languages) ?? '',
                categories: toStoredList(categories) ?? '',
                isFree: isFree !== undefined ? Boolean(isFree) : true,
                distanceKm: distanceKm !== undefined ? Number(distanceKm) : null,
                location: location ?? null,
                phone: phone ?? null,
                verified: Boolean(verified),
            },
        });
        res.status(201).json(toClient(organization));
    } catch (error) {
        fail(res, error, 'Unable to create this organisation.');
    }
};

const updateOrganization = async (req, res) => {
    try {
        const { name, contactEmail, description, languages, categories, isFree, distanceKm, location, phone, verified } = req.body;
        const storedLanguages = toStoredList(languages);
        const storedCategories = toStoredList(categories);

        const organization = await prisma.legalOrganization.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(name !== undefined && { name }),
                ...(contactEmail !== undefined && { contactEmail }),
                ...(description !== undefined && { description }),
                ...(storedLanguages !== undefined && { languages: storedLanguages }),
                ...(storedCategories !== undefined && { categories: storedCategories }),
                ...(isFree !== undefined && { isFree: Boolean(isFree) }),
                ...(distanceKm !== undefined && { distanceKm: Number(distanceKm) }),
                ...(location !== undefined && { location }),
                ...(phone !== undefined && { phone }),
                ...(verified !== undefined && { verified: Boolean(verified) }),
            },
        });
        res.json(toClient(organization));
    } catch (error) {
        fail(res, error, 'Unable to update this organisation.');
    }
};

// Officers and case referrals point at organisations. Prisma will reject the
// delete rather than orphan those rows, so report it as a conflict instead of
// a generic failure.
const deleteOrganization = async (req, res) => {
    try {
        await prisma.legalOrganization.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    } catch (error) {
        if (error?.code === 'P2003') {
            return res.status(409).json({ error: 'This organisation is linked to officers or case referrals and cannot be deleted.' });
        }
        fail(res, error, 'Unable to delete this organisation.');
    }
};

module.exports = {
    listOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
};
