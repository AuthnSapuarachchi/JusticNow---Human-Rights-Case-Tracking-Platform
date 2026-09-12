const prisma = require('../config/db');

// Public - no auth required. Every citizen (registered or not, in principle)
// should be able to read Know Your Rights content.
const listCategories = async (req, res) => {
    try {
        const locale = req.query.locale || 'en';
        const categories = await prisma.rightsCategory.findMany({
            where: { locale },
            select: { categoryId: true, icon: true, title: true, description: true },
            orderBy: { categoryId: 'asc' },
        });
        res.json(categories);
    } catch (error) {
        console.error('Unable to list rights categories:', error);
        res.status(500).json({ error: 'Unable to load rights categories.' });
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
        console.error('Unable to load rights category:', error);
        res.status(500).json({ error: 'Unable to load this rights category.' });
    }
};

// Admin-only - guarded by authorizeRoles('ADMIN') in the route.
const updateCategory = async (req, res) => {
    try {
        const { title, description, intro, sources, icon } = req.body;
        const category = await prisma.rightsCategory.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(intro !== undefined && { intro }),
                ...(sources !== undefined && { sources }),
                ...(icon !== undefined && { icon }),
                updatedBy: req.user?.id ?? null,
            },
        });
        res.json(category);
    } catch (error) {
        console.error('Unable to update rights category:', error);
        res.status(500).json({ error: 'Unable to update this rights category.' });
    }
};

module.exports = { listCategories, getCategory, updateCategory };
