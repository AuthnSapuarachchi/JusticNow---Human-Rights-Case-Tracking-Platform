const prisma = require('../config/db');

const generateTrackingCode = () => 'JN-' + Math.floor(100000 + Math.random() * 900000);

const submitCase = async (req, res) => {
    try {
        const { description, pin } = req.body;
        const uniqueCode = generateTrackingCode();

        const newCase = await prisma.case.create({
            data: {
                description: description,
                trackingCode: {
                    create: { code: uniqueCode, pin: pin }
                }
            },
            include: { trackingCode: true }
        });

        res.status(201).json({
            status: 'success',
            message: 'Anonymous report submitted successfully.',
            data: { trackingCode: newCase.trackingCode.code, caseId: newCase.id }
        });
    } catch (error) {
        console.error("Error creating case:", error);
        res.status(500).json({ error: 'Internal server error while submitting report.' });
    }
};

module.exports = { submitCase };