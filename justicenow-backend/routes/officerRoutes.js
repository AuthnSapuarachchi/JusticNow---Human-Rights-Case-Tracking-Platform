const express = require('express');

const router = express.Router();


// Import controller functions
const {

    getOfficerDashboard,
    getAssignedCases,
    getCaseDetails,
    updateCaseStatus,
    addCaseNote,
    requestInformation,
    referCase,
    closeCase

} = require('../controllers/officerController');


// Import authentication middleware
const { 
    protectRoute, 
    authorizeRoles 
} = require('../middlewares/authMiddleware');





// ==========================================
// OFFICER DASHBOARD
// ==========================================


// Dashboard statistics
router.get(
    '/dashboard',
    protectRoute,
    authorizeRoles('OFFICER', 'ADMIN'),
    getOfficerDashboard
);



// Get all assigned cases
router.get(
    '/cases',
    protectRoute,
    authorizeRoles('OFFICER', 'ADMIN'),
    getAssignedCases
);




// Open single case
router.get(
    '/cases/:id',
    protectRoute,
    authorizeRoles('OFFICER', 'ADMIN'),
    getCaseDetails
);




// Update case status
router.put(
    '/cases/:id/status',
    protectRoute,
    authorizeRoles('OFFICER', 'ADMIN'),
    updateCaseStatus
);




// Add internal officer note
router.post(
    '/cases/:id/notes',
    protectRoute,
    authorizeRoles('OFFICER', 'ADMIN'),
    addCaseNote
);




// Request additional information from citizen
router.post(
    '/cases/:id/request-info',
    protectRoute,
    authorizeRoles('OFFICER', 'ADMIN'),
    requestInformation
);




// Refer case for legal support
router.put(
    '/cases/:id/refer',
    protectRoute,
    authorizeRoles('OFFICER', 'ADMIN'),
    referCase
);




// Close case
router.put(
    '/cases/:id/close',
    protectRoute,
    authorizeRoles('OFFICER', 'ADMIN'),
    closeCase
);



module.exports = router;