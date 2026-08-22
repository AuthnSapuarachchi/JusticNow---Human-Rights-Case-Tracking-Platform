const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const caseRoutes = require('./routes/caseRoutes');
const authRoutes = require('./routes/authRoutes');


// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Parses incoming JSON payloads
app.use(morgan('dev')); // Logs API requests to the console

// Basic Health Check Route (For Sprint 1 Demo)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'JusticeNow API is running' });
});

// We will mount our modular routes here later
app.use('/api/auth', authRoutes);
// c
app.use('/api/cases', caseRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});