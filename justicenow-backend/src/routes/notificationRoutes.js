const express = require('express');
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const { listNotifications } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protectRoute, authorizeRoles('ADMIN', 'OFFICER'), listNotifications);

module.exports = router;
