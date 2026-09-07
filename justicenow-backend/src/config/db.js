const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
require('dotenv').config();

const dbUrl = new URL(process.env.DATABASE_URL);

// 🚨 THE REAL V7 FIX: Pass config DIRECTLY to the adapter.
// Do NOT use mariadb.createPool() - that causes the 10s deadlock!
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.substring(1),
  connectionLimit: 10,
  multipleStatements: true 
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;