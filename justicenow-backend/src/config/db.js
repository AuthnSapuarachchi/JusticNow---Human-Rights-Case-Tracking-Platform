const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

// Initialize the Postgres connection pool
const pool = new Pool({ connectionString });

// Pass the pool to the Prisma driver adapter
const adapter = new PrismaPg(pool);

// Instantiate Prisma with the new adapter
const prisma = new PrismaClient({ adapter });

module.exports = prisma;