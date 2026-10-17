const express = require('express');
const router = express.Router();
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const { requireVerifiedRole } = require('../middlewares/verifiedRoleMiddleware');
const {
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
} = require('../controllers/adminController');
const { listComplaints, getComplaint, updateComplaint } = require('../controllers/conductController');

// All admin routes are guarded for the ADMIN role only.
// Case listing, detail and assignment reuse /api/officer/* (which also allows ADMIN).
router.use(protectRoute, authorizeRoles('ADMIN'), requireVerifiedRole);

// Anonymized statistics
router.get('/stats', getAdminStats);

// Officer accounts
router.get('/officers', listOfficers);
router.post('/officers', createOfficer);
router.patch('/officers/:id', updateOfficer);

// Legal-support organizations
router.get('/organizations', listOrganizations);
router.post('/organizations', createOrganization);
router.patch('/organizations/:id', updateOrganization);
router.delete('/organizations/:id', deleteOrganization);

// Violation categories
router.get('/categories', listCategories);
router.patch('/categories/:code', updateCategory);

// Citizen reports about officer conduct
router.get('/complaints', listComplaints);
router.get('/complaints/:id', getComplaint);
router.patch('/complaints/:id', updateComplaint);

module.exports = router;
