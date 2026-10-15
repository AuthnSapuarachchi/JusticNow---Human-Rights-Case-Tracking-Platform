const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');

// Creates (or promotes/updates) a platform administrator.
// Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret123 ADMIN_NAME="Admin" npm run seed:admin
async function main() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME?.trim() || 'Platform Administrator';

    if (!email || !password || password.length < 8) {
        throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters) before running this script.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.upsert({
        where: { email },
        update: { role: 'ADMIN', password: hashedPassword, name, isActive: true, verificationStatus: 'NOT_REQUIRED' },
        create: { email, password: hashedPassword, name, role: 'ADMIN', verificationStatus: 'NOT_REQUIRED' },
    });

    console.log(`Admin account ready: ${admin.email} (id ${admin.id})`);
}

main()
    .catch((error) => {
        console.error(error.message || error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
