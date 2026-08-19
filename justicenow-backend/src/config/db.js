const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const mariadb = require('mariadb');
const dotenv = require('dotenv');

dotenv.config();

// Dynamically convert the 'mysql://' URL to 'mariadb://'
const connectionString = process.env.DATABASE_URL.replace(/^mysql:\/\//, "mariadb://");

// Initialize the Database Connection Pool
const pool = mariadb.createPool(connectionString);
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;