const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');

const CHAT_CASE_CODE = 'JN-2026-0412';
const CHAT_CASE_PIN = '123456';

async function main() {
    const pin = await bcrypt.hash(CHAT_CASE_PIN, 10);
    const trackingCode = await prisma.trackingCode.upsert({
        where: { code: CHAT_CASE_CODE },
        update: {},
        create: { code: CHAT_CASE_CODE, pin },
    });
    const officer = await prisma.user.findFirst({
        where: { role: 'OFFICER' },
        orderBy: { id: 'asc' },
    });
    const caseRecord = await prisma.case.upsert({
        where: { trackingCodeId: trackingCode.id },
        update: { officerId: officer?.id ?? null },
        create: {
            description: 'Local chat test case. This record is for development testing only.',
            trackingCodeId: trackingCode.id,
            officerId: officer?.id ?? null,
        },
    });

    if (officer) {
        const existingWelcome = await prisma.message.findFirst({
            where: { caseId: caseRecord.id, senderId: officer.id },
        });
        if (!existingWelcome) {
            await prisma.message.create({
                data: {
                    caseId: caseRecord.id,
                    content: 'Hello, this is a local chat test. How can I help you?',
                    isFromUser: false,
                    officerId: officer.id,
                    senderId: officer.id,
                },
            });
        }
    }

    console.log(`Chat test case ready: ${CHAT_CASE_CODE}`);
    console.log(`Test PIN: ${CHAT_CASE_PIN}`);
    console.log(`Assigned officer: ${officer?.name || 'No officer registered yet'}`);
}

main()
    .catch((error) => {
        console.error('Unable to seed chat test case:', error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
