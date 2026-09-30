const prisma = require('../config/db');

const requireVerifiedRole = async (req, res, next) => {
    try {
        if (!req.user || !['OFFICER', 'ADMIN'].includes(req.user.role)) return next();
        const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { verificationStatus: true, isActive: true } });
        if (!user || user.isActive === false) return res.status(403).json({ error: 'This account is not active.' });
        const isProvisionedAdmin = req.user.role === 'ADMIN' && user.verificationStatus === 'NOT_REQUIRED';
        if (user.verificationStatus !== 'APPROVED' && !isProvisionedAdmin) return res.status(403).json({ error: `This account is ${user.verificationStatus.toLowerCase().replace('_', ' ')}. Protected functionality is unavailable until approval.` });
        next();
    } catch (error) {
        console.error('Unable to verify account status:', error);
        res.status(500).json({ error: 'Unable to verify account status.' });
    }
};

module.exports = { requireVerifiedRole };