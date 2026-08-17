const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// --- Prisma 7 Database Setup ---
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const mariadb = require('mariadb');

// Load environment variables from your .env file
dotenv.config();

// FIX: Dynamically convert the 'mysql://' URL to 'mariadb://' for the driver
const connectionString = process.env.DATABASE_URL.replace(/^mysql:\/\//, "mariadb://");

// Initialize the Database Connection Pool with the converted string
const pool = mariadb.createPool(connectionString);
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

// Initialize the Express application
const app = express();

// --- Global Middlewares ---
app.use(cors()); 
app.use(express.json()); 
app.use(morgan('dev')); 

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
    console.log(`🚀 JusticeNow Server is running on port ${PORT}`);
});