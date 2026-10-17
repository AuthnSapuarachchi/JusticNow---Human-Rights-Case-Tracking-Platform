const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const { authorizeCaseChat, createMessage, listMessages, uploadAttachment } = require('../controllers/chatController');

const uploadDirectory = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });
const ALLOWED_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/gif': '.gif', 'application/pdf': '.pdf' };

const upload = multer({
    // Keep a real extension so /uploads serves the file with an image content type.
    storage: multer.diskStorage({
        destination: uploadDirectory,
        filename: (req, file, callback) => {
            const extension = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase() || '';
            callback(null, `chat-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (ALLOWED_TYPES[file.mimetype]) return callback(null, true);
        const error = new Error('Only photos (JPG, PNG, WebP, HEIC, GIF) or PDF files can be shared.');
        error.status = 400;
        callback(error);
    },
});

// Turns multer errors (too large, wrong type) into a readable 400 instead of a 500.
const handleUpload = (req, res, next) => upload.single('file')(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Files must be 10 MB or smaller.' : error.message;
    res.status(400).json({ error: message || 'Unable to upload this file.' });
});

module.exports = (io) => {
    const router = express.Router();
    const chatAccess = [ 'CITIZEN', 'OFFICER', 'ADMIN' ];

    router.get('/cases/:caseId/messages', protectRoute, authorizeRoles(...chatAccess), listMessages);
    router.post('/cases/:caseId/messages', protectRoute, authorizeRoles(...chatAccess), createMessage(io));
    router.post('/cases/:caseId/messages/upload', protectRoute, authorizeRoles(...chatAccess), authorizeCaseChat, handleUpload, uploadAttachment);

    return router;
};
