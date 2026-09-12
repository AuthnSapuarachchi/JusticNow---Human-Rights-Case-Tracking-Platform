const express = require('express');
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const { listOfficers } = require('../controllers/userController');

const router = express.Router();

router.get('/officers', protectRoute, authorizeRoles('CITIZEN', 'OFFICER', 'ADMIN'), listOfficers);

module.exports = router;
