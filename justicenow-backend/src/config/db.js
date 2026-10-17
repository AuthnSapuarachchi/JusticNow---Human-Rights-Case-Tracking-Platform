const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to start the backend.');
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error('DATABASE_URL must use the PostgreSQL connection URL scheme.');
}

// Added the SSL object to allow remote cloud connections to Supabase
const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false } 
});

const adapter = new PrismaPg(pool);

// The remote Supabase database can take several seconds to open a fresh
// connection, which exceeds Prisma's 2s default for starting a transaction
// (error P2028) and made sign-ups fail after the server had been idle.
const prisma = new PrismaClient({
  adapter,
  transactionOptions: { maxWait: 15000, timeout: 20000 },
});

module.exports = prisma;