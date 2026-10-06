const prisma = require('../config/db');

// Prisma error codes we translate into proper HTTP statuses rather than a 500.
const NOT_FOUND = 'P2025';
const UNIQUE_CONFLICT = 'P2002';
const STABLE_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const ICON_PATTERN = /^[A-Za-z0-9-]{1,64}$/;
const isText = (value, min, max) =>
    typeof value === 'string' &&
    value.trim().length >= min &&
    value.trim().length <= max;
const parseRecordId = (value) => {
    if (!/^\d+$/.test(String(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};
const isValidOrder = (value) => Number.isSafeInteger(value) && value >= 0;

// Shared error handler so every action reports failures the same way.
const fail = (res, error, message) => {
    console.error(`${message}:`, error);
    if (error?.code === NOT_FOUND)
        return res.status(404).json({ error: 'That record no longer exists.' });
    if (error?.code === UNIQUE_CONFLICT)
        return res
            .status(409)
            .json({ error: 'A record with that id already exists.' });
    res.status(500).json({ error: message });
};

// Public - no auth required. Every citizen (registered or not, in principle)
// should be able to read Know Your Rights content.
const listCategories = async (req, res) => {
    try {
        const locale = req.query.locale || 'en';
        const categories = await prisma.rightsCategory.findMany({
            where: { locale },
            select: {
                categoryId: true,
                icon: true,
                title: true,
                description: true,
            },
            // Figma order, not alphabetical. categoryId ties are ordered stably
            // so a category added without an explicit order still lands somewhere
            // predictable rather than shuffling between requests.
            orderBy: [{ order: 'asc' }, { categoryId: 'asc' }],
        });
        res.json(categories);
    } catch (error) {
        fail(res, error, 'Unable to load rights categories.');
    }
};

const getCategory = async (req, res) => {
    try {
        const locale = req.query.locale || 'en';
        const category = await prisma.rightsCategory.findUnique({
            where: {
                categoryId_locale: {
                    categoryId: req.params.categoryId,
                    locale,
                },
            },
            include: {
                protections: { orderBy: { order: 'asc' } },
                faqs: { orderBy: { order: 'asc' } },
            },
        });
        if (!category)
            return res
                .status(404)
                .json({ error: 'Rights category not found.' });
        res.json(category);
    } catch (error) {
        fail(res, error, 'Unable to load this rights category.');
    }
};

// --- Admin-only below. All guarded by authorizeRoles('ADMIN') in the route. ---

// The public list deliberately omits `id` and the long-form fields; the admin
// screen needs both to edit and delete.
const listCategoriesForManagement = async (req, res) => {
    try {
        const locale = req.query.locale || 'en';
        const categories = await prisma.rightsCategory.findMany({
            where: { locale },
            include: {
                protections: { orderBy: { order: 'asc' } },
                faqs: { orderBy: { order: 'asc' } },
            },
            orderBy: [{ order: 'asc' }, { categoryId: 'asc' }],
        });
        res.json(categories);
    } catch (error) {
        fail(res, error, 'Unable to load rights categories.');
    }
};

const createCategory = async (req, res) => {
    try {
        if (
            !req.body ||
            typeof req.body !== 'object' ||
            Array.isArray(req.body)
        )
            return res
                .status(400)
                .json({
                    error: 'Rights category must be submitted as an object.',
                });
        const {
            categoryId,
            locale,
            icon,
            title,
            description,
            intro,
            sources,
            order,
        } = req.body;
        if (
            typeof categoryId !== 'string' ||
            !STABLE_ID_PATTERN.test(categoryId.trim())
        )
            return res
                .status(400)
                .json({
                    error: 'Category ID must start with a letter and contain only letters, numbers, _ or - (up to 64 characters).',
                });
        if (!isText(title, 2, 160))
            return res
                .status(400)
                .json({ error: 'Title must be between 2 and 160 characters.' });
        if (!isText(description, 1, 1000))
            return res
                .status(400)
                .json({
                    error: 'A plain-language description of up to 1000 characters is required.',
                });
        if (!isText(intro, 1, 5000))
            return res
                .status(400)
                .json({
                    error: 'An introduction of up to 5000 characters is required.',
                });
        if (!isText(sources, 1, 5000))
            return res
                .status(400)
                .json({
                    error: 'At least one legal source, up to 5000 characters, is required.',
                });
        if (locale !== undefined && !['en', 'si', 'ta'].includes(locale))
            return res
                .status(400)
                .json({ error: 'Locale must be en, si, or ta.' });
        if (
            icon !== undefined &&
            (typeof icon !== 'string' || !ICON_PATTERN.test(icon.trim()))
        )
            return res
                .status(400)
                .json({ error: 'Icon must be a valid icon name.' });
        if (order !== undefined && !isValidOrder(order))
            return res
                .status(400)
                .json({
                    error: 'Display order must be a non-negative whole number.',
                });

        const category = await prisma.rightsCategory.create({
            data: {
                categoryId: categoryId.trim(),
                locale: locale?.trim() || 'en',
                icon: icon?.trim() || 'document-text',
                title: title.trim(),
                description: description.trim(),
                intro: intro.trim(),
                sources: sources.trim(),
                order: order ?? 0,
                updatedBy: req.user?.id ?? null,
            },
        });
        res.status(201).json(category);
    } catch (error) {
        fail(res, error, 'Unable to create this rights category.');
    }
};

const updateCategory = async (req, res) => {
    try {
        if (
            !req.body ||
            typeof req.body !== 'object' ||
            Array.isArray(req.body)
        )
            return res
                .status(400)
                .json({
                    error: 'Rights category updates must be submitted as an object.',
                });
        const { title, description, intro, sources, icon, order } = req.body;
        const id = parseRecordId(req.params.id);
        if (!id)
            return res
                .status(400)
                .json({
                    error: 'Category record ID must be a positive whole number.',
                });
        if (req.body.categoryId !== undefined || req.body.locale !== undefined)
            return res
                .status(400)
                .json({
                    error: 'Category ID and locale are stable and cannot be changed here.',
                });
        if (title !== undefined && !isText(title, 2, 160))
            return res
                .status(400)
                .json({ error: 'Title must be between 2 and 160 characters.' });
        if (description !== undefined && !isText(description, 1, 1000))
            return res
                .status(400)
                .json({
                    error: 'Description must contain up to 1000 characters.',
                });
        if (intro !== undefined && !isText(intro, 1, 5000))
            return res
                .status(400)
                .json({
                    error: 'Introduction must contain up to 5000 characters.',
                });
        if (sources !== undefined && !isText(sources, 1, 5000))
            return res
                .status(400)
                .json({ error: 'Sources must contain up to 5000 characters.' });
        if (
            icon !== undefined &&
            (typeof icon !== 'string' || !ICON_PATTERN.test(icon.trim()))
        )
            return res
                .status(400)
                .json({ error: 'Icon must be a valid icon name.' });
        if (order !== undefined && !isValidOrder(order))
            return res
                .status(400)
                .json({
                    error: 'Display order must be a non-negative whole number.',
                });
        const category = await prisma.rightsCategory.update({
            where: { id },
            data: {
                ...(title !== undefined && { title: title.trim() }),
                ...(description !== undefined && {
                    description: description.trim(),
                }),
                ...(intro !== undefined && { intro: intro.trim() }),
                ...(sources !== undefined && { sources: sources.trim() }),
                ...(icon !== undefined && { icon: icon.trim() }),
                ...(order !== undefined && { order }),
                updatedBy: req.user?.id ?? null,
            },
        });
        res.json(category);
    } catch (error) {
        fail(res, error, 'Unable to update this rights category.');
    }
};

// Protections and FAQs cascade on delete, so removing a category takes its
// children with it - see the onDelete: Cascade relations in schema.prisma.
const deleteCategory = async (req, res) => {
    try {
        const id = parseRecordId(req.params.id);
        if (!id)
            return res
                .status(400)
                .json({
                    error: 'Category record ID must be a positive whole number.',
                });
        await prisma.rightsCategory.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        fail(res, error, 'Unable to delete this rights category.');
    }
};

const createProtection = async (req, res) => {
    try {
        if (
            !req.body ||
            typeof req.body !== 'object' ||
            Array.isArray(req.body)
        )
            return res
                .status(400)
                .json({ error: 'Protection must be submitted as an object.' });
        const { protectionId, icon, title, body, order } = req.body;
        const categoryId = parseRecordId(req.params.id);
        if (!categoryId)
            return res
                .status(400)
                .json({
                    error: 'Category record ID must be a positive whole number.',
                });
        if (
            typeof protectionId !== 'string' ||
            !STABLE_ID_PATTERN.test(protectionId.trim())
        )
            return res
                .status(400)
                .json({
                    error: 'Protection ID must start with a letter and contain only letters, numbers, _ or - (up to 64 characters).',
                });
        if (!isText(title, 2, 160))
            return res
                .status(400)
                .json({
                    error: 'Protection title must be between 2 and 160 characters.',
                });
        if (!isText(body, 10, 5000))
            return res
                .status(400)
                .json({
                    error: 'Protection details must be between 10 and 5000 characters.',
                });
        if (
            icon !== undefined &&
            (typeof icon !== 'string' || !ICON_PATTERN.test(icon.trim()))
        )
            return res
                .status(400)
                .json({ error: 'Icon must be a valid icon name.' });
        if (order !== undefined && !isValidOrder(order))
            return res
                .status(400)
                .json({
                    error: 'Display order must be a non-negative whole number.',
                });

        const protection = await prisma.rightsProtection.create({
            data: {
                protectionId: protectionId.trim(),
                icon: icon?.trim() || 'shield-checkmark',
                title: title.trim(),
                body: body.trim(),
                order: order ?? 0,
                categoryId,
            },
        });
        res.status(201).json(protection);
    } catch (error) {
        fail(res, error, 'Unable to add this protection.');
    }
};

const updateProtection = async (req, res) => {
    try {
        if (
            !req.body ||
            typeof req.body !== 'object' ||
            Array.isArray(req.body)
        )
            return res
                .status(400)
                .json({
                    error: 'Protection updates must be submitted as an object.',
                });
        const { icon, title, body, order } = req.body;
        const id = parseRecordId(req.params.id);
        if (!id)
            return res
                .status(400)
                .json({
                    error: 'Protection record ID must be a positive whole number.',
                });
        if (title !== undefined && !isText(title, 2, 160))
            return res
                .status(400)
                .json({
                    error: 'Protection title must be between 2 and 160 characters.',
                });
        if (body !== undefined && !isText(body, 10, 5000))
            return res
                .status(400)
                .json({
                    error: 'Protection details must be between 10 and 5000 characters.',
                });
        if (
            icon !== undefined &&
            (typeof icon !== 'string' || !ICON_PATTERN.test(icon.trim()))
        )
            return res
                .status(400)
                .json({ error: 'Icon must be a valid icon name.' });
        if (order !== undefined && !isValidOrder(order))
            return res
                .status(400)
                .json({
                    error: 'Display order must be a non-negative whole number.',
                });
        const protection = await prisma.rightsProtection.update({
            where: { id },
            data: {
                ...(icon !== undefined && { icon: icon.trim() }),
                ...(title !== undefined && { title: title.trim() }),
                ...(body !== undefined && { body: body.trim() }),
                ...(order !== undefined && { order }),
            },
        });
        res.json(protection);
    } catch (error) {
        fail(res, error, 'Unable to update this protection.');
    }
};

const deleteProtection = async (req, res) => {
    try {
        const id = parseRecordId(req.params.id);
        if (!id)
            return res
                .status(400)
                .json({
                    error: 'Protection record ID must be a positive whole number.',
                });
        await prisma.rightsProtection.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        fail(res, error, 'Unable to delete this protection.');
    }
};

const createFaq = async (req, res) => {
    try {
        if (
            !req.body ||
            typeof req.body !== 'object' ||
            Array.isArray(req.body)
        )
            return res
                .status(400)
                .json({ error: 'FAQ must be submitted as an object.' });
        const { faqId, question, answer, order } = req.body;
        const categoryId = parseRecordId(req.params.id);
        if (!categoryId)
            return res
                .status(400)
                .json({
                    error: 'Category record ID must be a positive whole number.',
                });
        if (typeof faqId !== 'string' || !STABLE_ID_PATTERN.test(faqId.trim()))
            return res
                .status(400)
                .json({
                    error: 'FAQ ID must start with a letter and contain only letters, numbers, _ or - (up to 64 characters).',
                });
        if (!isText(question, 5, 300))
            return res
                .status(400)
                .json({
                    error: 'FAQ question must be between 5 and 300 characters.',
                });
        if (!isText(answer, 10, 5000))
            return res
                .status(400)
                .json({
                    error: 'FAQ answer must be between 10 and 5000 characters.',
                });
        if (order !== undefined && !isValidOrder(order))
            return res
                .status(400)
                .json({
                    error: 'Display order must be a non-negative whole number.',
                });

        const faq = await prisma.rightsFaq.create({
            data: {
                faqId: faqId.trim(),
                question: question.trim(),
                answer: answer.trim(),
                order: order ?? 0,
                categoryId,
            },
        });
        res.status(201).json(faq);
    } catch (error) {
        fail(res, error, 'Unable to add this FAQ.');
    }
};

const updateFaq = async (req, res) => {
    try {
        if (
            !req.body ||
            typeof req.body !== 'object' ||
            Array.isArray(req.body)
        )
            return res
                .status(400)
                .json({ error: 'FAQ updates must be submitted as an object.' });
        const { question, answer, order } = req.body;
        const id = parseRecordId(req.params.id);
        if (!id)
            return res
                .status(400)
                .json({
                    error: 'FAQ record ID must be a positive whole number.',
                });
        if (question !== undefined && !isText(question, 5, 300))
            return res
                .status(400)
                .json({
                    error: 'FAQ question must be between 5 and 300 characters.',
                });
        if (answer !== undefined && !isText(answer, 10, 5000))
            return res
                .status(400)
                .json({
                    error: 'FAQ answer must be between 10 and 5000 characters.',
                });
        if (order !== undefined && !isValidOrder(order))
            return res
                .status(400)
                .json({
                    error: 'Display order must be a non-negative whole number.',
                });
        const faq = await prisma.rightsFaq.update({
            where: { id },
            data: {
                ...(question !== undefined && { question: question.trim() }),
                ...(answer !== undefined && { answer: answer.trim() }),
                ...(order !== undefined && { order }),
            },
        });
        res.json(faq);
    } catch (error) {
        fail(res, error, 'Unable to update this FAQ.');
    }
};

const deleteFaq = async (req, res) => {
    try {
        const id = parseRecordId(req.params.id);
        if (!id)
            return res
                .status(400)
                .json({
                    error: 'FAQ record ID must be a positive whole number.',
                });
        await prisma.rightsFaq.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        fail(res, error, 'Unable to delete this FAQ.');
    }
};

module.exports = {
    listCategories,
    getCategory,
    listCategoriesForManagement,
    createCategory,
    updateCategory,
    deleteCategory,
    createProtection,
    updateProtection,
    deleteProtection,
    createFaq,
    updateFaq,
    deleteFaq,
};
