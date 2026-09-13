const express = require('express');
const multer = require('multer');
const router = express.Router();

// 1. Import Controllers
const { submitCase, trackCase, getMyCases, getCase, getCaseStatus } = require('../controllers/caseController');
// const { getOfficerCases } = require('../controllers/officerController'); // Example for your teammates

// 2. Import Middleware
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');

// 3. Configure Multer (Holds file in RAM temporarily before Supabase upload)
const upload = multer({ storage: multer.memoryStorage() });

// 🌍 PUBLIC CITIZEN ROUTES (No Token Needed)
// Added upload.single('evidenceFile') to intercept the incoming photo/document
router.post('/', protectRoute, upload.single('evidenceFile'), submitCase);
router.post('/track', trackCase);
router.get('/my', protectRoute, getMyCases);
router.get('/:caseId/status', protectRoute, getCaseStatus);
router.get('/:caseId', protectRoute, getCase);

// 🛡️ PROTECTED OFFICER ROUTES (Token Needed)

// router.get('/queue', protectRoute, authorizeRoles('OFFICER', 'ADMIN'), getOfficerCases);

module.exports = router;