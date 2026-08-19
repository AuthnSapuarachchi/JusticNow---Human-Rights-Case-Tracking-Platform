const express = require('express');
const router = express.Router();
const { submitCase } = require('../controllers/caseController');

// Because we mount this on '/api/cases' in server.js, the root '/' means the full URL is '/api/cases'
router.post('/', submitCase);

module.exports = router;