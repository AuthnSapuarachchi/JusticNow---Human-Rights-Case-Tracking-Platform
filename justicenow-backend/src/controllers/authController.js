const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// --- 1. Register Officer ---
const registerOfficer = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save to DB
        const newOfficer = await prisma.user.create({
            data: { email, password: hashedPassword, name, role: 'OFFICER' }
        });

        res.status(201).json({ 
            message: 'Officer registered successfully!', 
            officerId: newOfficer.id 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error registering officer.' });
    }
};

// --- 2. Login Officer (Returns Access & Refresh Tokens) ---
const loginOfficer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const officer = await prisma.user.findUnique({ where: { email } });

        if (!officer) return res.status(404).json({ error: 'Officer not found.' });

        const isMatch = await bcrypt.compare(password, officer.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

        // Access Token: Short lifespan (e.g., 15 minutes) for security
        const accessToken = jwt.sign(
            { id: officer.id, role: officer.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '15m' }
        );

        // Refresh Token: Long lifespan (e.g., 7 days) to keep user logged in
        const refreshToken = jwt.sign(
            { id: officer.id, role: officer.role }, 
            process.env.JWT_REFRESH_SECRET, 
            { expiresIn: '7d' }
        );

        res.status(200).json({ 
            message: 'Login successful!', 
            accessToken,
            refreshToken 
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