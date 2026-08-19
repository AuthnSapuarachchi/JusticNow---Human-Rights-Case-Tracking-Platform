const express = require('express');
const router = express.Router();
const { registerOfficer, loginOfficer, refreshUserToken } = require('../controllers/authController');

router.post('/register', registerOfficer);
router.post('/login', loginOfficer);
router.post('/refresh', refreshUserToken);

module.exports = router;