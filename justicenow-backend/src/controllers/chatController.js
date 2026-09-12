const prisma = require('../config/db');

const caseWhere = (caseId) => {
    const numericId = Number(caseId);
    return Number.isInteger(numericId) && numericId > 0
        ? { id: numericId }
        : { trackingCode: { code: String(caseId) } };
};

const serializeMessage = (message) => ({
    id: String(message.id),
    caseId: String(message.caseId),
    senderId: message.senderId ? String(message.senderId) : message.officerId ? String(message.officerId) : 'system',
    senderName: message.sender?.name || message.officer?.name || (message.isFromUser ? 'Citizen' : 'Case Officer'),
    senderRole: message.sender?.role || (message.isFromUser ? 'CITIZEN' : 'OFFICER'),
    recipientId: message.recipientId ? String(message.recipientId) : null,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    isRead: true,
    attachment: message.attachmentUrl ? {
        url: message.attachmentUrl,
        name: message.attachmentName,
        type: message.attachmentType,
    } : null,
});

const findCase = (caseId) => {
    const numericId = Number(caseId);
    if (Number.isInteger(numericId) && numericId > 0) {
        return prisma.case.findUnique({ where: { id: numericId } });
    }
    return prisma.case.findFirst({ where: { trackingCode: { is: { code: String(caseId) } } } });
};

const listMessages = async (req, res) => {
    try {
        const foundCase = await findCase(req.params.caseId);
        if (!foundCase) return res.status(404).json({ error: 'Case not found.' });

        const messages = await prisma.message.findMany({
            where: { caseId: foundCase.id },
            include: { sender: true, officer: true },
            orderBy: { createdAt: 'asc' },
        });
        res.json(messages.map(serializeMessage));
    } catch (error) {
        console.error('Unable to list messages:', error);
        res.status(500).json({ error: 'Unable to load messages.' });
    }
};

const createMessage = (io) => async (req, res) => {
    try {
        const { content, attachment, recipientId } = req.body;
        const foundCase = await findCase(req.params.caseId);
        if (!foundCase) return res.status(404).json({ error: 'Case not found.' });
        if (!content?.trim() && !attachment?.url) return res.status(400).json({ error: 'Message content or an attachment is required.' });

        const message = await prisma.message.create({
            data: {
                content: content?.trim() || '',
                isFromUser: req.user.role === 'CITIZEN',
                caseId: foundCase.id,
                senderId: req.user.id,
                officerId: req.user.role === 'OFFICER' ? req.user.id : null,
                recipientId: recipientId ? Number(recipientId) : null,
                attachmentUrl: attachment?.url || null,
                attachmentName: attachment?.name || null,
                attachmentType: attachment?.type || null,
            },
            include: { sender: true, officer: true },
        });
        const serialized = serializeMessage(message);
        io.to(`case:${foundCase.id}`).emit('chat:message', serialized);
        res.status(201).json(serialized);
    } catch (error) {
        console.error('Unable to create message:', error);
        res.status(500).json({ error: 'Unable to send message.' });
    }
};

const uploadAttachment = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'A file is required.' });
    res.status(201).json({
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
    });
};

module.exports = { createMessage, listMessages, uploadAttachment };
