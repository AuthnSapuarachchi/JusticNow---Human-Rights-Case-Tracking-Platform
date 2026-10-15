const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const { verificationDirectory } = require('../middlewares/verificationUpload');

const parseId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const publicDocument = (document) => ({
    id: document.id,
    documentType: document.documentType,
    originalName: document.originalName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    status: document.status,
    createdAt: document.createdAt,
});

const profileSelect = {
    officerId: true,
    organization: true,
    department: true,
    designation: true,
    governmentId: true,
    lawyerNumber: true,
    firm: true,
    practiceArea: true,
    experienceYears: true,
    additionalDocuments: true,
};

const listVerifications = async (req, res) => {
    try {
        const allowedStatuses = ['PENDING_VERIFICATION', 'APPROVED', 'REJECTED'];
        const status = req.query.status ? String(req.query.status).toUpperCase() : null;
        const where = { role: { in: ['OFFICER', 'LAWYER'] } };
        if (status && status !== 'ALL') {
            if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid verification status.' });
            where.verificationStatus = status;
        }
        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, email: true, role: true, contactNumber: true,
                verificationStatus: true, rejectionReason: true, createdAt: true,
                verificationProfile: { select: profileSelect },
                verificationDocuments: { select: { id: true, documentType: true, originalName: true, mimeType: true, sizeBytes: true, status: true, createdAt: true } },
            },
        });
        res.json(users);
    } catch (error) {
        console.error('Error listing account verifications:', error);
        res.status(500).json({ error: 'Unable to load account verifications.' });
    }
};

const getVerification = async (req, res) => {
    const userId = parseId(req.params.id);
    if (!userId) return res.status(400).json({ error: 'Invalid user ID.' });
    const user = await prisma.user.findFirst({
        where: { id: userId, role: { in: ['OFFICER', 'LAWYER'] } },
        select: {
            id: true, name: true, email: true, role: true, contactNumber: true,
            verificationStatus: true, rejectionReason: true, createdAt: true,
            verificationProfile: { select: profileSelect },
            verificationDocuments: { select: { id: true, documentType: true, originalName: true, mimeType: true, sizeBytes: true, status: true, createdAt: true } },
        },
    });
    if (!user) return res.status(404).json({ error: 'Verification registration not found.' });
    res.json(user);
};

const updateVerification = async (req, res) => {
    const userId = parseId(req.params.id);
    const { action, reason } = req.body;
    if (!userId) return res.status(400).json({ error: 'Invalid user ID.' });
    if (!['approve', 'reject', 'request_documents'].includes(action)) return res.status(400).json({ error: 'Invalid verification action.' });
    if ((action === 'reject' || action === 'request_documents') && !reason?.trim()) return res.status(400).json({ error: 'A reason is required for this action.' });

    const existing = await prisma.user.findFirst({ where: { id: userId, role: { in: ['OFFICER', 'LAWYER'] } } });
    if (!existing) return res.status(404).json({ error: 'Verification registration not found.' });

    const status = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'PENDING_VERIFICATION';
    const updated = await prisma.$transaction(async (transaction) => {
        await transaction.user.update({
            where: { id: userId },
            data: { verificationStatus: status, rejectionReason: action === 'approve' ? null : reason.trim() },
        });
        await transaction.verificationDocument.updateMany({ where: { userId }, data: { status } });
        return transaction.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, verificationStatus: true, rejectionReason: true },
        });
    });
    res.json({ message: action === 'approve' ? 'Account approved.' : action === 'reject' ? 'Registration rejected.' : 'Additional documents requested.', user: updated });
};

const downloadDocument = async (req, res) => {
    const userId = parseId(req.params.id);
    const documentId = parseId(req.params.documentId);
    if (!userId || !documentId) return res.status(400).json({ error: 'Invalid document reference.' });
    const document = await prisma.verificationDocument.findFirst({ where: { id: documentId, userId } });
    if (!document) return res.status(404).json({ error: 'Document not found.' });
    const absolutePath = path.join(verificationDirectory, document.storageName);
    if (!absolutePath.startsWith(`${verificationDirectory}${path.sep}`) || !fs.existsSync(absolutePath)) return res.status(404).json({ error: 'Document file is unavailable.' });
    res.download(absolutePath, document.originalName);
};

module.exports = { listVerifications, getVerification, updateVerification, downloadDocument, publicDocument };