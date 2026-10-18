const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fakePrisma, createRes } = require('./helpers');
const { requireVerifiedRole } = require('../src/middlewares/verifiedRoleMiddleware');

const withUser = (record) => {
    fakePrisma.user.findUnique = async () => record;
};

const run = async (user) => {
    const res = createRes();
    let calledNext = false;
    await requireVerifiedRole({ user }, res, () => (calledNext = true));
    return { res, calledNext };
};

describe('requireVerifiedRole', () => {
    it('lets citizens through without a database lookup', async () => {
        fakePrisma.user.findUnique = async () => {
            throw new Error('should not query the database for citizens');
        };

        const { calledNext } = await run({ id: 1, role: 'USER' });

        assert.equal(calledNext, true);
    });

    it('allows an approved, active officer', async () => {
        withUser({ verificationStatus: 'APPROVED', isActive: true });

        const { calledNext } = await run({ id: 2, role: 'OFFICER' });

        assert.equal(calledNext, true);
    });

    it('blocks an officer whose verification is still pending', async () => {
        withUser({ verificationStatus: 'PENDING', isActive: true });

        const { res, calledNext } = await run({ id: 3, role: 'OFFICER' });

        assert.equal(calledNext, false);
        assert.equal(res.statusCode, 403);
        assert.match(res.body.error, /pending/);
    });

    it('blocks a deactivated officer account', async () => {
        withUser({ verificationStatus: 'APPROVED', isActive: false });

        const { res, calledNext } = await run({ id: 4, role: 'OFFICER' });

        assert.equal(calledNext, false);
        assert.equal(res.statusCode, 403);
        assert.match(res.body.error, /not active/);
    });

    it('allows a provisioned admin that does not need verification', async () => {
        withUser({ verificationStatus: 'NOT_REQUIRED', isActive: true });

        const { calledNext } = await run({ id: 5, role: 'ADMIN' });

        assert.equal(calledNext, true);
    });

    it('returns 500 when the account lookup fails', async () => {
        fakePrisma.user.findUnique = async () => {
            throw new Error('database unavailable');
        };
        const originalError = console.error;
        console.error = () => {};

        try {
            const { res, calledNext } = await run({ id: 6, role: 'OFFICER' });
            assert.equal(calledNext, false);
            assert.equal(res.statusCode, 500);
        } finally {
            console.error = originalError;
        }
    });
});
