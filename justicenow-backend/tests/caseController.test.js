const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const { fakePrisma, createReq, createRes } = require('./helpers');
const { submitCase, trackCase, getCase } = require('../src/controllers/caseController');

const call = async (handler, reqOptions) => {
    const res = createRes();
    await handler(createReq(reqOptions), res);
    return res;
};

const validReport = {
    description: 'My employer has not paid my wages for three months.',
    pin: '4821',
    category: 'WORKPLACE_DISCRIMINATION',
    officerId: '10',
};

describe('submitCase (citizen report)', () => {
    beforeEach(() => {
        fakePrisma.user.findFirst = async () => ({ id: 10 });
    });

    it('requires a description of at least 10 characters', async () => {
        const res = await call(submitCase, { body: { ...validReport, description: 'Too short' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /at least 10 characters/);
    });

    it('requires a numeric PIN of 4 to 12 digits', async () => {
        for (const pin of ['12', 'abcd', '1234567890123']) {
            const res = await call(submitCase, { body: { ...validReport, pin } });
            assert.equal(res.statusCode, 400, `PIN "${pin}" should be rejected`);
        }
    });

    it('rejects an invalid incident date', async () => {
        const res = await call(submitCase, { body: { ...validReport, incidentDate: 'not-a-date' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /valid incident date/);
    });

    it('requires an officer to be selected', async () => {
        const res = await call(submitCase, { body: { ...validReport, officerId: undefined } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /select an officer/);
    });

    it('rejects an officer who is not active', async () => {
        fakePrisma.user.findFirst = async () => null;

        const res = await call(submitCase, { body: validReport });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /not active or eligible/);
    });
});

describe('trackCase (anonymous tracking by code + PIN)', () => {
    let trackedCase;

    before(async () => {
        trackedCase = {
            id: 4,
            status: 'INVESTIGATING',
            description: 'Report',
            evidence: [],
            trackingCode: { code: 'JN-123456', pin: await bcrypt.hash('4821', 4) },
        };
    });

    it('requires both a tracking code and a PIN', async () => {
        const res = await call(trackCase, { body: { trackingCode: 'JN-123456' } });

        assert.equal(res.statusCode, 400);
    });

    it('returns the same 404 for a wrong PIN as for an unknown code', async () => {
        fakePrisma.case.findFirst = async () => trackedCase;
        const wrongPin = await call(trackCase, { body: { trackingCode: 'JN-123456', pin: '0000' } });

        fakePrisma.case.findFirst = async () => null;
        const unknownCode = await call(trackCase, { body: { trackingCode: 'JN-999999', pin: '4821' } });

        assert.equal(wrongPin.statusCode, 404);
        assert.equal(unknownCode.statusCode, 404);
        assert.equal(wrongPin.body.error, unknownCode.body.error);
    });

    it('returns case status without exposing the PIN hash', async () => {
        fakePrisma.case.findFirst = async () => trackedCase;

        const res = await call(trackCase, { body: { trackingCode: ' JN-123456 ', pin: '4821' } });

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.data.trackingCode, 'JN-123456');
        assert.equal(res.body.data.status, 'INVESTIGATING');
        assert.doesNotMatch(JSON.stringify(res.body), /\$2[aby]\$/);
    });
});

describe('getCase (who can view a case)', () => {
    beforeEach(() => {
        fakePrisma.case.findUnique = async () => ({
            id: 4,
            reporterId: 50,
            status: 'UNDER_REVIEW',
            category: 'OTHER',
            description: 'Report',
            evidence: [],
            trackingCode: { code: 'JN-123456' },
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    });

    it('rejects an invalid case ID', async () => {
        const res = await call(getCase, { params: { caseId: '0' }, user: { id: 50, role: 'CITIZEN' } });
        assert.equal(res.statusCode, 400);
    });

    it("hides another citizen's case behind a 404", async () => {
        const res = await call(getCase, { params: { caseId: '4' }, user: { id: 51, role: 'CITIZEN' } });

        assert.equal(res.statusCode, 404);
    });

    it('lets the reporting citizen view their own case', async () => {
        const res = await call(getCase, { params: { caseId: '4' }, user: { id: 50, role: 'CITIZEN' } });

        assert.equal(res.statusCode, 200);
    });

    it('lets an officer view the case', async () => {
        const res = await call(getCase, { params: { caseId: '4' }, user: { id: 10, role: 'OFFICER' } });

        assert.equal(res.statusCode, 200);
    });
});
