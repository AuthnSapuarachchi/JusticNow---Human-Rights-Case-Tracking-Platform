const express = require('express');
const router = express.Router();
const { submitCase, trackCase } = require('../controllers/caseController');

// Because we mount this on '/api/cases' in server.js, the root '/' means the full URL is '/api/cases'
router.post('/', submitCase);
router.post('/track', trackCase);

module.exports = router;