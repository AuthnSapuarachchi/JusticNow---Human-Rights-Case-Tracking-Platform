const express = require('express');
const router = express.Router();
const { listActiveCategories } = require('../controllers/adminController');

// Public: active violation categories for the reporting form
router.get('/', listActiveCategories);

module.exports = router;
