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

const allowedRoles = ['CITIZEN', 'OFFICER', 'ADMIN'];

// --- 1. Register user ---
const registerOfficer = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!name?.trim() || !email?.trim() || !password || password.length < 8 || !allowedRoles.includes(role)) {
            return res.status(400).json({ error: 'Name, email, password of at least 8 characters, and a valid role are required.' });
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
        const newUser = await prisma.user.create({
            data: { email: normalizedEmail, password: hashedPassword, name: name.trim(), role }
        });

        const tokens = createTokens(newUser);

        res.status(201).json({ 
            message: 'Account created successfully.',
            user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
            ...tokens
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to create your account right now.' });
    }
};

// --- 2. Login Officer (Returns Access & Refresh Tokens) ---
const loginOfficer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const officer = await prisma.user.findUnique({ where: { email: email?.trim().toLowerCase() } });

        if (!officer) return res.status(404).json({ error: 'Officer not found.' });

        const isMatch = await bcrypt.compare(password, officer.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

        // Access Token: Short lifespan (e.g., 15 minutes) for security
        const tokens = createTokens(officer);

        res.status(200).json({ 
            message: 'Login successful!', 
            user: { id: officer.id, email: officer.email, name: officer.name, role: officer.role },
            ...tokens
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error logging in.' });
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
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired refresh token. Please log in again.' });
            }

            // If valid, issue a brand new Access Token for another 15 minutes
            const newAccessToken = jwt.sign(
                { id: decoded.id, role: decoded.role },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            res.status(200).json({ 
                message: 'Token refreshed successfully!',
                accessToken: newAccessToken 
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error refreshing token.' });
    }
};

module.exports = { registerOfficer, loginOfficer, refreshUserToken };