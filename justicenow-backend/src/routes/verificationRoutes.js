const express = require('express');
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const { requireVerifiedRole } = require('../middlewares/verifiedRoleMiddleware');
const { verificationUpload } = require('../middlewares/verificationUpload');
const { listVerifications, getVerification, updateVerification, downloadDocument } = require('../controllers/verificationController');

const router = express.Router();
router.use(protectRoute, authorizeRoles('ADMIN'), requireVerifiedRole);
router.get('/', listVerifications);
router.get('/:id', getVerification);
router.patch('/:id', updateVerification);
router.get('/:id/documents/:documentId', downloadDocument);

module.exports = router;