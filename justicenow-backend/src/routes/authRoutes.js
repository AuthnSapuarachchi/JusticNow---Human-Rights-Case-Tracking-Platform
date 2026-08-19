const express = require('express');
const router = express.Router();
const { registerOfficer, loginOfficer } = require('../controllers/authController');

router.post('/register', registerOfficer);
router.post('/login', loginOfficer);

module.exports = router;