const express = require('express');
const router = express.Router();

// 1. Import Controllers
const { submitCase, trackCase } = require('../controllers/caseController');
// const { getOfficerCases } = require('../controllers/officerController'); // Example for your teammates

// 2. Import Middleware
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');


// 🌍 PUBLIC CITIZEN ROUTES (No Token Needed)
router.post('/', submitCase);
router.post('/track', trackCase);

// 🛡️ PROTECTED OFFICER ROUTES (Token Needed)

// router.get('/queue', protectRoute, authorizeRoles('OFFICER', 'ADMIN'), getOfficerCases);

module.exports = router;