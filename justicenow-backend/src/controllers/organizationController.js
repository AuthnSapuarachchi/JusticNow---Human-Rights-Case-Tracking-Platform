const prisma = require('../config/db');

const NOT_FOUND = 'P2025';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_LANGUAGES = new Set(['en', 'si', 'ta']);
const ALLOWED_CATEGORIES = new Set([
    'legalAid',
    'humanRights',
    'workplaceRights',
    'womensRights',
    'childRights',
    'counselling',
    'landRights',
]);
const parseRecordId = (value) => {
    if (!/^\d+$/.test(String(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const parseList = (value) => {
    if (Array.isArray(value) && value.every((item) => typeof item === 'string'))
        return value.map((item) => item.trim()).filter(Boolean);
    if (typeof value === 'string')
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    return null;
};

const validateOrganization = (body, creating = false) => {
    if (!body || typeof body !== 'object' || Array.isArray(body))
        return 'Organisation details must be submitted as an object.';
    if (creating || body.name !== undefined) {
        if (
            typeof body.name !== 'string' ||
            body.name.trim().length < 2 ||
            body.name.trim().length > 120
        ) {
            return 'Organisation name must be between 2 and 120 characters.';
        }
    }
    if (creating || body.contactEmail !== undefined) {
        if (
            typeof body.contactEmail !== 'string' ||
            body.contactEmail.trim().length > 254 ||
            !EMAIL_PATTERN.test(body.contactEmail.trim())
        ) {
            return 'Enter a valid contact email address.';
        }
    }
    if (creating || body.description !== undefined) {
        if (
            typeof body.description !== 'string' ||
            body.description.trim().length < 10 ||
            body.description.trim().length > 2000
        ) {
            return 'Description must be between 10 and 2000 characters.';
        }
    }
    if (creating || body.location !== undefined) {
        if (
            typeof body.location !== 'string' ||
            !body.location.trim() ||
            body.location.trim().length > 160
        ) {
            return 'A location of up to 160 characters is required.';
        }
    }
    if (creating || body.distanceKm !== undefined) {
        const rawDistance = body.distanceKm;
        const distance =
            typeof rawDistance === 'number'
                ? rawDistance
                : typeof rawDistance === 'string' && rawDistance.trim()
                  ? Number(rawDistance)
                  : NaN;
        if (!Number.isFinite(distance) || distance < 0 || distance > 10000) {
            return 'Distance must be a number from 0 to 10000 km.';
        }
    }
    if (creating || body.languages !== undefined) {
        const languages = parseList(body.languages);
        if (
            !languages?.length ||
            languages.some((item) => !ALLOWED_LANGUAGES.has(item)) ||
            new Set(languages).size !== languages.length
        ) {
            return 'Choose at least one supported language: en, si, or ta.';
        }
    }
    if (creating || body.categories !== undefined) {
        const categories = parseList(body.categories);
        if (
            !categories?.length ||
            categories.some((item) => !ALLOWED_CATEGORIES.has(item)) ||
            new Set(categories).size !== categories.length
        ) {
            return 'Choose at least one valid organisation category.';
        }
    }
    if (body.phone !== undefined && body.phone !== null && body.phone !== '') {
        if (typeof body.phone !== 'string') return 'Phone number must be text.';
        const compact = body.phone.trim().replace(/[\s().-]/g, '');
        if (!/^(?:0\d{9}|\+94\d{9})$/.test(compact)) {
            return 'Enter a valid Sri Lankan phone number, for example +94 11 234 5678.';
        }
    }
    for (const field of ['isFree', 'verified']) {
        if (body[field] !== undefined && typeof body[field] !== 'boolean') {
            return `${field} must be true or false.`;
        }
    }
    return null;
};

const fail = (res, error, message) => {
    console.error(`${message}:`, error);
    if (error?.code === NOT_FOUND)
        return res
            .status(404)
            .json({ error: 'That organisation no longer exists.' });
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
    contact: {
        phone: org.phone ?? undefined,
        email: org.contactEmail || undefined,
    },
});

// Accepts either an array or a comma-separated string, so the admin form and a
// raw API call can both post whichever is convenient.
const toStoredList = (value) => {
    if (Array.isArray(value)) return value.map((item) => item.trim()).join(',');
    if (typeof value === 'string')
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .join(',');
    return undefined;
};

// Public - the directory is browsable without an account, matching the
// anonymity-friendly design of the rest of the app.
const listOrganizations = async (req, res) => {
    try {
        const organizations = await prisma.legalOrganization.findMany({
            orderBy: [
                { verified: 'desc' },
                { distanceKm: 'asc' },
                { name: 'asc' },
            ],
        });
        res.json(organizations.map(toClient));
    } catch (error) {
        fail(res, error, 'Unable to load organisations.');
    }
};

const getOrganization = async (req, res) => {
    try {
        const id = parseRecordId(req.params.id);
        if (!id)
            return res
                .status(400)
                .json({
                    error: 'Organisation ID must be a positive whole number.',
                });
        const organization = await prisma.legalOrganization.findUnique({
            where: { id },
        });
        if (!organization)
            return res.status(404).json({ error: 'Organisation not found.' });
        res.json(toClient(organization));
    } catch (error) {
        fail(res, error, 'Unable to load this organisation.');
    }
};

// --- Admin-only below. Guarded by authorizeRoles('ADMIN') in the route. ---

const createOrganization = async (req, res) => {
    try {
        const validationError = validateOrganization(req.body, true);
        if (validationError)
            return res.status(400).json({ error: validationError });
        const {
            name,
            contactEmail,
            description,
            languages,
            categories,
            isFree,
            distanceKm,
            location,
            phone,
            verified,
        } = req.body;

        const organization = await prisma.legalOrganization.create({
            data: {
                name: name.trim(),
                contactEmail: contactEmail.trim().toLowerCase(),
                description: description.trim(),
                languages: toStoredList(languages) ?? '',
                categories: toStoredList(categories) ?? '',
                isFree: isFree !== undefined ? isFree : true,
                distanceKm: Number(distanceKm),
                location: location.trim(),
                phone: phone?.trim() || null,
                verified: verified ?? false,
            },
        });
        res.status(201).json(toClient(organization));
    } catch (error) {
        fail(res, error, 'Unable to create this organisation.');
    }
};

const updateOrganization = async (req, res) => {
    try {
        const id = parseRecordId(req.params.id);
        if (!id)
            return res
                .status(400)
                .json({
                    error: 'Organisation ID must be a positive whole number.',
                });
        const validationError = validateOrganization(req.body);
        if (validationError)
            return res.status(400).json({ error: validationError });
        const {
            name,
            contactEmail,
            description,
            languages,
            categories,
            isFree,
            distanceKm,
            location,
            phone,
            verified,
        } = req.body;
        const storedLanguages = toStoredList(languages);
        const storedCategories = toStoredList(categories);

        const organization = await prisma.legalOrganization.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(contactEmail !== undefined && {
                    contactEmail: contactEmail.trim().toLowerCase(),
                }),
                ...(description !== undefined && {
                    description: description.trim(),
                }),
                ...(storedLanguages !== undefined && {
                    languages: storedLanguages,
                }),
                ...(storedCategories !== undefined && {
                    categories: storedCategories,
                }),
                ...(distanceKm !== undefined && {
                    distanceKm: Number(distanceKm),
                }),
                ...(location !== undefined && { location: location.trim() }),
                ...(phone !== undefined && { phone: phone?.trim() || null }),
                ...(verified !== undefined && { verified }),
                ...(isFree !== undefined && { isFree }),
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
        const id = parseRecordId(req.params.id);
        if (!id)
            return res
                .status(400)
                .json({
                    error: 'Organisation ID must be a positive whole number.',
                });
        await prisma.legalOrganization.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error?.code === 'P2003') {
            return res
                .status(409)
                .json({
                    error: 'This organisation is linked to officers or case referrals and cannot be deleted.',
                });
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
