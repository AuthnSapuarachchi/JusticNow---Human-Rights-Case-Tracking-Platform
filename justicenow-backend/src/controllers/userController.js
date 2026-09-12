const prisma = require('../config/db');

const listOfficers = async (req, res) => {
    try {
        const officers = await prisma.user.findMany({
            where: { role: 'OFFICER' },
            select: { id: true, name: true, email: true, role: true },
            orderBy: { name: 'asc' },
        });
        res.json(officers);
    } catch (error) {
        console.error('Unable to list officers:', error);
        res.status(500).json({ error: 'Unable to load officers.' });
    }
};

module.exports = { listOfficers };
