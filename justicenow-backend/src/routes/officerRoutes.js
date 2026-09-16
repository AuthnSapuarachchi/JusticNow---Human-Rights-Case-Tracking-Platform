const express = require('express');
const router = express.Router();
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const {
    getDashboardStats,
    getOfficerCases,
    getOfficerCaseDetail,
    assignCase,
    updateCaseStatus,
    addCaseNote,
    getCaseNotes,
    createInfoRequest,
    createReferral,
    createCaseAction,
    getCaseActions,
    closeCase,
    escalateCase,
    getOrganizations,
} = require('../controllers/officerController');

// All officer routes are guarded for OFFICER and ADMIN roles
router.use(protectRoute, authorizeRoles('OFFICER', 'ADMIN'));

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Organizations helper for referrals
router.get('/organizations', getOrganizations);

// Case queue & details
router.get('/cases', getOfficerCases);
router.get('/cases/:caseId', getOfficerCaseDetail);

// Case assignment & status transitions
router.patch('/cases/:caseId/assign', assignCase);
router.patch('/cases/:caseId/status', updateCaseStatus);

// Case notes
router.post('/cases/:caseId/notes', addCaseNote);
router.get('/cases/:caseId/notes', getCaseNotes);

// Info requests & referrals
router.post('/cases/:caseId/info-requests', createInfoRequest);
router.post('/cases/:caseId/referrals', createReferral);

// Case actions & history feed
router.post('/cases/:caseId/actions', createCaseAction);
router.get('/cases/:caseId/actions', getCaseActions);

// Close & escalate actions
router.post('/cases/:caseId/close', closeCase);
router.post('/cases/:caseId/escalate', escalateCase);

module.exports = router;
