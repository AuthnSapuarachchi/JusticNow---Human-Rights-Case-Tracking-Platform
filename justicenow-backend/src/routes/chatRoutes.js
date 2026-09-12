const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protectRoute, authorizeRoles } = require('../middlewares/authMiddleware');
const { createMessage, listMessages, uploadAttachment } = require('../controllers/chatController');

const uploadDirectory = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({
    dest: uploadDirectory,
    limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = (io) => {
    const router = express.Router();
    const chatAccess = [ 'CITIZEN', 'OFFICER', 'ADMIN' ];

    router.get('/cases/:caseId/messages', protectRoute, authorizeRoles(...chatAccess), listMessages);
    router.post('/cases/:caseId/messages', protectRoute, authorizeRoles(...chatAccess), createMessage(io));
    router.post('/messages/upload', protectRoute, authorizeRoles(...chatAccess), upload.single('file'), uploadAttachment);

    return router;
};
