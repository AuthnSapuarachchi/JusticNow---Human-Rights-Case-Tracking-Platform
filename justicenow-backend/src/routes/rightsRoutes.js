const express = require('express');
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const {
    listCategories,
    getCategory,
    listCategoriesForAdmin,
    createCategory,
    updateCategory,
    deleteCategory,
    createProtection,
    updateProtection,
    deleteProtection,
    createFaq,
    updateFaq,
    deleteFaq,
} = require('../controllers/rightsController');

const router = express.Router();

// Every write is admin-only; applied per route below.
const adminOnly = [protectRoute, authorizeRoles('ADMIN')];

// Public reads - Know Your Rights is informational content, not gated behind
// login, matching the anonymity-friendly design of the rest of the app.
router.get('/', listCategories);

// Must be declared before '/:categoryId' or "admin" is read as a category id.
router.get('/admin', ...adminOnly, listCategoriesForAdmin);

router.get('/:categoryId', getCategory);

// Categories
router.post('/', ...adminOnly, createCategory);
router.put('/:id', ...adminOnly, updateCategory);
router.delete('/:id', ...adminOnly, deleteCategory);

// Protections - nested under their category on create, addressed directly after.
router.post('/:id/protections', ...adminOnly, createProtection);
router.put('/protections/:id', ...adminOnly, updateProtection);
router.delete('/protections/:id', ...adminOnly, deleteProtection);

// FAQs - same shape as protections.
router.post('/:id/faqs', ...adminOnly, createFaq);
router.put('/faqs/:id', ...adminOnly, updateFaq);
router.delete('/faqs/:id', ...adminOnly, deleteFaq);

module.exports = router;
