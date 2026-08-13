const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load environment variables from your .env file
dotenv.config();

// Initialize the Express application
const app = express();

// --- Global Middlewares ---
// Allows your React Native Expo app to communicate with this backend without CORS errors
app.use(cors()); 
// Parses incoming JSON payloads from the mobile app
app.use(express.json()); 
// Logs every API request to your terminal (super helpful for debugging)
app.use(morgan('dev')); 

// --- Health Check Route ---
// This is critical for your Sprint 1 Demo to prove the API is alive
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'JusticeNow API is running smoothly!' 
    });
});

// --- Feature Routes (To be added later) ---
// We will mount your modular routes here as you build them
// app.use('/api/auth', authRoutes);
// app.use('/api/cases', caseRoutes);

// --- Boot up the Server ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 JusticeNow Server is running on port ${PORT}`);
});