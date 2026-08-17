const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db'); // Import the DB connection

// --- Register Officer ---
const registerOfficer = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newOfficer = await prisma.user.create({
            data: { email, password: hashedPassword, name, role: 'OFFICER' }
        });

        res.status(201).json({ message: 'Officer registered successfully!', officerId: newOfficer.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error registering officer.' });
    }
};

// --- Login Officer ---
const loginOfficer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const officer = await prisma.user.findUnique({ where: { email } });

        if (!officer) return res.status(404).json({ error: 'Officer not found.' });

        const isMatch = await bcrypt.compare(password, officer.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

        const token = jwt.sign(
            { id: officer.id, role: officer.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.status(200).json({ message: 'Login successful!', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error logging in.' });
    }
};

module.exports = { registerOfficer, loginOfficer };