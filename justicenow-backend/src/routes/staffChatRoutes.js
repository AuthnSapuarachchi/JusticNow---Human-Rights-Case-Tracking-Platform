const express = require('express');
const router = express.Router();
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const { requireVerifiedRole } = require('../middlewares/verifiedRoleMiddleware');
const { listThreads, getThreadMessages, postThreadMessage } = require('../controllers/conductController');

// Admin <-> officer channel. Officers may only open their own thread (`me` or their id).
router.use(protectRoute, authorizeRoles('ADMIN', 'OFFICER'), requireVerifiedRole);

router.get('/threads', listThreads);
router.get('/:officerId/messages', getThreadMessages);
router.post('/:officerId/messages', postThreadMessage);

module.exports = router;
