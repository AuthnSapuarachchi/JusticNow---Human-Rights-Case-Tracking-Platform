const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Initialize the Express application
const app = express();

// --- Global Middlewares ---
app.use(cors()); 
app.use(express.json()); 
app.use(morgan('dev')); 

// --- Import Routes ---
const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');

// --- Mount Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);

// --- Health Check Route ---
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'JusticeNow API is running smoothly!' 
    });
});

// --- Boot up the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 JusticeNow Server is running cleanly on port ${PORT}`);
});