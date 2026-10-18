const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { fakePrisma, createReq, createRes } = require('./helpers');
const { authorizeCaseChat } = require('../src/controllers/chatController');

const approvedCase = { id: 4, reporterId: 50, officerId: 10, approvedAt: new Date() };

const run = async (user, caseId = '4') => {
    const req = createReq({ params: { caseId }, user });
    const res = createRes();
    let calledNext = false;
    await authorizeCaseChat(req, res, () => (calledNext = true));
    return { req, res, calledNext };
};

describe('authorizeCaseChat (secure case messaging)', () => {
    beforeEach(() => {
        fakePrisma.case.findUnique = async () => approvedCase;
        fakePrisma.case.findFirst = async () => approvedCase;
    });

    it('returns 404 for a case that does not exist', async () => {
        fakePrisma.case.findUnique = async () => null;

        const { res, calledNext } = await run({ id: 50, role: 'CITIZEN' });

        assert.equal(res.statusCode, 404);
        assert.equal(calledNext, false);
    });

    it('lets the reporting citizen into an approved case chat', async () => {
        const { req, calledNext } = await run({ id: 50, role: 'CITIZEN' });

        assert.equal(calledNext, true);
        assert.equal(req.caseRecord.id, 4);
    });

    it('lets the assigned officer into the chat', async () => {
        const { calledNext } = await run({ id: 10, role: 'OFFICER' });

        assert.equal(calledNext, true);
    });

    it('blocks messaging until the officer approves the case', async () => {
        fakePrisma.case.findUnique = async () => ({ ...approvedCase, approvedAt: null });

        const { res, calledNext } = await run({ id: 50, role: 'CITIZEN' });

        assert.equal(res.statusCode, 403);
        assert.equal(calledNext, false);
    });

    it('blocks a different citizen', async () => {
        const { res } = await run({ id: 51, role: 'CITIZEN' });
        assert.equal(res.statusCode, 403);
    });

    it('blocks an officer who is not assigned to the case', async () => {
        const { res } = await run({ id: 11, role: 'OFFICER' });
        assert.equal(res.statusCode, 403);
    });

    it('looks the case up by tracking code when the ID is not numeric', async () => {
        let lookedUpBy;
        fakePrisma.case.findFirst = async ({ where }) => {
            lookedUpBy = where;
            return approvedCase;
        };

        const { calledNext } = await run({ id: 50, role: 'CITIZEN' }, 'JN-123456');

        assert.equal(calledNext, true);
        assert.deepEqual(lookedUpBy, { trackingCode: { is: { code: 'JN-123456' } } });
    });
});
