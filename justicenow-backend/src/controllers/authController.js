const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const createTokens = (user) => ({
    accessToken: jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    ),
    refreshToken: jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    )
});

const isDatabaseUnavailable = (error) =>
    error?.code === 'P1001' ||
    error?.cause?.name === 'DatabaseNotReachable' ||
    ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error?.cause?.code);

// --- 1. Register user ---
const registerUser = async (req, res) => {
    try {
        const { email, password, name, role = 'CITIZEN', contactNumber } = req.body;

        if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
            return res.status(400).json({ error: 'Name, email, and a password of at least 8 characters are required.' });
        }
        if (!['CITIZEN', 'OFFICER'].includes(role)) {
            return res.status(403).json({ error: 'Administrator accounts are provisioned by the platform and cannot be created through public registration.' });
        }
        if (role !== 'CITIZEN' && !contactNumber?.trim()) {
            return res.status(400).json({ error: 'A contact number is required for professional accounts.' });
        }

        const files = Array.isArray(req.files) ? req.files : [];
        let documentTypes = [];
        try {
            documentTypes = Array.isArray(req.body.documentTypes)
                ? req.body.documentTypes
                : JSON.parse(req.body.documentTypes || '[]');
        } catch {
            return res.status(400).json({ error: 'Invalid document metadata.' });
        }
        if (role === 'OFFICER' && files.length < 2) {
            return res.status(400).json({ error: 'All required verification documents must be uploaded.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save to DB
        const isCitizen = role === 'CITIZEN';
        const profileData = {
            officerId: req.body.officerId?.trim() || null,
            organization: req.body.organization?.trim() || null,
            department: req.body.department?.trim() || null,
            designation: req.body.designation?.trim() || null,
            governmentId: req.body.governmentId?.trim() || null,
            lawyerNumber: req.body.lawyerNumber?.trim() || null,
            firm: req.body.firm?.trim() || null,
            practiceArea: req.body.practice?.trim() || null,
            experienceYears: req.body.experience ? Number(req.body.experience) : null,
        };
        const newUser = await prisma.$transaction(async (transaction) => {
            const user = await transaction.user.create({
                data: {
                    email: normalizedEmail,
                    password: hashedPassword,
                    name: name.trim(),
                    role,
                    contactNumber: contactNumber?.trim() || null,
                    verificationStatus: isCitizen ? 'NOT_REQUIRED' : 'PENDING_VERIFICATION',
                    ...(isCitizen ? {} : {
                        verificationProfile: { create: profileData },
                        ...(role === 'OFFICER' ? { verificationDocuments: {
                            create: files.map((file, index) => ({
                                documentType: String(documentTypes[index] || `Verification document ${index + 1}`),
                                originalName: file.originalname,
                                storageName: file.filename,
                                mimeType: file.mimetype,
                                sizeBytes: file.size,
                            })),
                        } } : {}),
                    }),
                },
            });
            return user;
        });

        const tokens = createTokens(newUser);

        res.status(201).json({ 
            message: isCitizen ? 'Account created successfully.' : 'Registration submitted successfully. Your account is pending verification.',
            verificationStatus: newUser.verificationStatus,
            user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, verificationStatus: newUser.verificationStatus },
            ...tokens
        });
    } catch (error) {
        console.error('Registration failed:', error);
        const status = isDatabaseUnavailable(error) ? 503 : 500;
        const message = isDatabaseUnavailable(error)
            ? 'The account service is temporarily unavailable. Please try again later.'
            : 'Unable to create your account right now.';
        res.status(status).json({ error: message });
    }
};

// --- 2. Login (Returns Access & Refresh Tokens) ---
const loginOfficer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const officer = await prisma.user.findUnique({ where: { email: email?.trim().toLowerCase() } });

        if (!officer) return res.status(404).json({ error: 'Officer not found.' });

        const isMatch = await bcrypt.compare(password, officer.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

        //johan-dev
        if (officer.isActive === false) {
            return res.status(403).json({ error: 'This account has been deactivated. Please contact an administrator.' });
        }

        // Access Token: Short lifespan (e.g., 15 minutes) for security
        const tokens = createTokens(officer);

        res.status(200).json({ 
            message: 'Login successful!', 
            user: { id: officer.id, email: officer.email, name: officer.name, role: officer.role, verificationStatus: officer.verificationStatus, rejectionReason: officer.rejectionReason },
            ...tokens
        });
    } catch (error) {
        console.error('Login failed:', error);
        const status = isDatabaseUnavailable(error) ? 503 : 500;
        const message = isDatabaseUnavailable(error)
            ? 'The account service is temporarily unavailable. Please try again later.'
            : 'Error logging in.';
        res.status(status).json({ error: message });
    }
};

// --- 3. Refresh Token ---
const refreshUserToken = async (req, res) => {
    try {
        // The frontend will send the refresh token in the request body
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token is required.' });
        }

        // Verify the refresh token against the REFRESH secret
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch {
            return res.status(403).json({ error: 'Invalid or expired refresh token. Please log in again.' });
        }

        // Deactivated or deleted accounts cannot refresh their session
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true, isActive: true, verificationStatus: true },
        });
        if (!user || user.isActive === false) {
            return res.status(403).json({ error: 'This account is no longer active. Please log in again.' });
        }

        // If valid, issue a brand new Access Token for another 15 minutes
        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.status(200).json({
            message: 'Token refreshed successfully!',
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error refreshing token.' });
    }
};

module.exports = { registerUser, registerOfficer: registerUser, loginOfficer, refreshUserToken };