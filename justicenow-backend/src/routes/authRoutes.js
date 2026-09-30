const express = require('express');
const router = express.Router();
const { registerUser, loginOfficer, refreshUserToken } = require('../controllers/authController');
const { verificationUpload } = require('../middlewares/verificationUpload');

router.post('/register', verificationUpload.array('documents', 5), registerUser);
router.post('/login', loginOfficer);
router.post('/refresh', refreshUserToken);

module.exports = router;