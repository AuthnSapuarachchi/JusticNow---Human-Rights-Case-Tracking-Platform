const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const verificationDirectory = path.resolve(__dirname, '../../private-verification');
fs.mkdirSync(verificationDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, verificationDirectory),
    filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

const allowedTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const verificationUpload = multer({
    storage,
    limits: { files: 5, fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) return callback(new Error('Only JPG, PNG, and PDF documents are supported.'));
        callback(null, true);
    },
});

module.exports = { verificationUpload, verificationDirectory };