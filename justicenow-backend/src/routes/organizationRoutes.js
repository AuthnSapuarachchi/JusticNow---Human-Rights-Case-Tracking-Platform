const express = require('express');
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const {
    listOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
} = require('../controllers/organizationController');

const router = express.Router();

const adminOnly = [protectRoute, authorizeRoles('ADMIN')];

// Public reads - browsing legal aid should not require an account.
router.get('/', listOrganizations);
router.get('/:id', getOrganization);

// Admin-only writes.
router.post('/', ...adminOnly, createOrganization);
router.put('/:id', ...adminOnly, updateOrganization);
router.delete('/:id', ...adminOnly, deleteOrganization);

module.exports = router;
