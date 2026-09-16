const express = require('express');
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const { listCategories, getCategory, updateCategory } = require('../controllers/rightsController');

const router = express.Router();

// Public reads - Know Your Rights is informational content, not gated behind
// login, matching the anonymity-friendly design of the rest of the app.
router.get('/', listCategories);
router.get('/:categoryId', getCategory);

// Admin-only edit.
router.put('/:id', protectRoute, authorizeRoles('ADMIN'), updateCategory);

module.exports = router;
