const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

// --- Helper: Generate Tracking Code ---
const generateTrackingCode = () => 'JN-' + Math.floor(100000 + Math.random() * 900000);

// --- 1. Submit Case (Now fully secure) ---
const submitCase = async (req, res) => {
    try {
        const { description, pin } = req.body;
        const uniqueCode = generateTrackingCode();

        // Security: Hash the citizen's PIN so even database admins can't read it
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        const newCase = await prisma.case.create({
            data: {
                description: description,
                trackingCode: {
                    create: { code: uniqueCode, pin: hashedPin }
                }
            },
            include: { trackingCode: true }
        });

        res.status(201).json({
            status: 'success',
            message: 'Anonymous report submitted securely.',
            data: { trackingCode: newCase.trackingCode.code }
        });
    } catch (error) {
        console.error("Error creating case:", error);
        res.status(500).json({ error: 'Internal server error while submitting report.' });
    }
};

// --- 2. Track Case (The Citizen "Login") ---
const trackCase = async (req, res) => {
    try {
        const { code, pin } = req.body;

        // Find the tracking record and pull in the related Case, Evidence, and Messages
        const trackingRecord = await prisma.trackingCode.findUnique({
            where: { code: code },
            include: {
                case: {
                    include: { 
                        evidence: true, 
                        messages: true 
                    }
                }
            }
        });

        // If the JN code doesn't exist
        if (!trackingRecord) {
            return res.status(404).json({ error: 'Invalid tracking code.' });
        }

        // Verify the provided PIN against the hashed PIN in the database
        const isMatch = await bcrypt.compare(pin, trackingRecord.pin);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect PIN.' });
        }

        // If successful, return the case data anonymously!
        res.status(200).json({
            status: 'success',
            caseDetails: trackingRecord.case
        });

    } catch (error) {
        console.error("Error tracking case:", error);
        res.status(500).json({ error: 'Internal server error while tracking report.' });
    }
};

module.exports = { submitCase, trackCase };