const prisma = require('../config/db');

// Prisma error codes we translate into proper HTTP statuses rather than a 500.
const NOT_FOUND = 'P2025';
const UNIQUE_CONFLICT = 'P2002';

// Shared error handler so every action reports failures the same way.
const fail = (res, error, message) => {
    console.error(`${message}:`, error);
    if (error?.code === NOT_FOUND) return res.status(404).json({ error: 'That record no longer exists.' });
    if (error?.code === UNIQUE_CONFLICT) return res.status(409).json({ error: 'A record with that id already exists.' });
    res.status(500).json({ error: message });
};

// Public - no auth required. Every citizen (registered or not, in principle)
// should be able to read Know Your Rights content.
const listCategories = async (req, res) => {
    try {
        const locale = req.query.locale || 'en';
        const categories = await prisma.rightsCategory.findMany({
            where: { locale },
            select: { categoryId: true, icon: true, title: true, description: true },
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
            where: { categoryId_locale: { categoryId: req.params.categoryId, locale } },
            include: {
                protections: { orderBy: { order: 'asc' } },
                faqs: { orderBy: { order: 'asc' } },
            },
        });
        if (!category) return res.status(404).json({ error: 'Rights category not found.' });
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
        const { categoryId, locale, icon, title, description, intro, sources, order } = req.body;
        if (!categoryId?.trim() || !title?.trim()) {
            return res.status(400).json({ error: 'A category id and title are required.' });
        }

        const category = await prisma.rightsCategory.create({
            data: {
                categoryId: categoryId.trim(),
                locale: locale?.trim() || 'en',
                icon: icon?.trim() || 'document-text',
                title: title.trim(),
                description: description ?? '',
                intro: intro ?? '',
                sources: sources ?? '',
                order: Number.isInteger(order) ? order : 0,
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
        const { title, description, intro, sources, icon, order } = req.body;
        const category = await prisma.rightsCategory.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(intro !== undefined && { intro }),
                ...(sources !== undefined && { sources }),
                ...(icon !== undefined && { icon }),
                ...(Number.isInteger(order) && { order }),
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
        await prisma.rightsCategory.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    } catch (error) {
        fail(res, error, 'Unable to delete this rights category.');
    }
};

const createProtection = async (req, res) => {
    try {
        const { protectionId, icon, title, body, order } = req.body;
        if (!protectionId?.trim() || !title?.trim()) {
            return res.status(400).json({ error: 'A protection id and title are required.' });
        }

        const protection = await prisma.rightsProtection.create({
            data: {
                protectionId: protectionId.trim(),
                icon: icon?.trim() || 'shield-checkmark',
                title: title.trim(),
                body: body ?? '',
                order: Number.isInteger(order) ? order : 0,
                categoryId: Number(req.params.id),
            },
        });
        res.status(201).json(protection);
    } catch (error) {
        fail(res, error, 'Unable to add this protection.');
    }
};

const updateProtection = async (req, res) => {
    try {
        const { icon, title, body, order } = req.body;
        const protection = await prisma.rightsProtection.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(icon !== undefined && { icon }),
                ...(title !== undefined && { title }),
                ...(body !== undefined && { body }),
                ...(Number.isInteger(order) && { order }),
            },
        });
        res.json(protection);
    } catch (error) {
        fail(res, error, 'Unable to update this protection.');
    }
};

const deleteProtection = async (req, res) => {
    try {
        await prisma.rightsProtection.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    } catch (error) {
        fail(res, error, 'Unable to delete this protection.');
    }
};

const createFaq = async (req, res) => {
    try {
        const { faqId, question, answer, order } = req.body;
        if (!faqId?.trim() || !question?.trim()) {
            return res.status(400).json({ error: 'A FAQ id and question are required.' });
        }

        const faq = await prisma.rightsFaq.create({
            data: {
                faqId: faqId.trim(),
                question: question.trim(),
                answer: answer ?? '',
                order: Number.isInteger(order) ? order : 0,
                categoryId: Number(req.params.id),
            },
        });
        res.status(201).json(faq);
    } catch (error) {
        fail(res, error, 'Unable to add this FAQ.');
    }
};

const updateFaq = async (req, res) => {
    try {
        const { question, answer, order } = req.body;
        const faq = await prisma.rightsFaq.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(question !== undefined && { question }),
                ...(answer !== undefined && { answer }),
                ...(Number.isInteger(order) && { order }),
            },
        });
        res.json(faq);
    } catch (error) {
        fail(res, error, 'Unable to update this FAQ.');
    }
};

const deleteFaq = async (req, res) => {
    try {
        await prisma.rightsFaq.delete({ where: { id: Number(req.params.id) } });
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
