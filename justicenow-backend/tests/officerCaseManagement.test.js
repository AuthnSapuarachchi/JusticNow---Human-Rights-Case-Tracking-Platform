const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { fakePrisma, createReq, createRes } = require('./helpers');
const {
    assignCase,
    updateCaseStatus,
    addCaseNote,
    createInfoRequest,
    closeCase,
    escalateCase,
} = require('../src/controllers/officerController');

const OFFICER = { id: 10, role: 'OFFICER' };

const call = async (handler, { caseId = '1', body = {}, user = OFFICER } = {}) => {
    const res = createRes();
    await handler(createReq({ params: { caseId }, body, user }), res);
    return res;
};

// Records every write so tests can assert what would have hit the database
let writes;
const givenCase = (overrides = {}) => {
    fakePrisma.case.findUnique = async ({ where }) => ({
        id: where.id,
        officerId: OFFICER.id,
        status: 'UNDER_REVIEW',
        reporterId: 50,
        ...overrides,
    });
};

beforeEach(() => {
    writes = [];
    const record = (model) => async ({ data }) => {
        writes.push({ model, data });
        return { id: writes.length, ...data };
    };
    fakePrisma.case.update = record('case');
    fakePrisma.caseAction.create = record('caseAction');
    fakePrisma.caseStatusHistory.create = record('caseStatusHistory');
    fakePrisma.caseNote.create = record('caseNote');
    givenCase();
});

describe('assignCase', () => {
    it('stops an officer assigning a case to someone else', async () => {
        const res = await call(assignCase, { body: { officerId: 77 } });

        assert.equal(res.statusCode, 403);
        assert.match(res.body.error, /only assign cases to themselves/);
    });

    it('refuses to assign to a deactivated officer', async () => {
        fakePrisma.user.findUnique = async () => ({ id: 77, role: 'OFFICER', isActive: false });

        const res = await call(assignCase, { user: { id: 1, role: 'ADMIN' }, body: { officerId: 77 } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /deactivated/);
    });

    it('refuses to assign to a citizen account', async () => {
        fakePrisma.user.findUnique = async () => ({ id: 77, role: 'CITIZEN', isActive: true });

        const res = await call(assignCase, { user: { id: 1, role: 'ADMIN' }, body: { officerId: 77 } });

        assert.equal(res.statusCode, 400);
    });

    it('stops an officer claiming a case that is already taken', async () => {
        fakePrisma.user.findUnique = async () => ({ id: OFFICER.id, role: 'OFFICER', isActive: true });
        givenCase({ officerId: 99 });

        const res = await call(assignCase);

        assert.equal(res.statusCode, 403);
        assert.match(res.body.error, /another officer/);
    });

    it('lets an admin assign a case to an active officer and logs an ASSIGNED action', async () => {
        fakePrisma.user.findUnique = async () => ({ id: 77, name: 'Maya Perera', role: 'OFFICER', isActive: true });

        const res = await call(assignCase, { user: { id: 1, role: 'ADMIN' }, body: { officerId: 77 } });

        assert.equal(res.statusCode, 200);
        assert.match(res.body.message, /Maya Perera/);
        assert.deepEqual(writes[0], { model: 'case', data: { officerId: 77 } });
        assert.equal(writes[1].data.actionType, 'ASSIGNED');
    });
});

describe('updateCaseStatus', () => {
    it('rejects a status that does not exist', async () => {
        const res = await call(updateCaseStatus, { body: { status: 'DONE' } });

        assert.equal(res.statusCode, 400);
        assert.equal(writes.length, 0);
    });

    it('rejects setting the status the case already has', async () => {
        const res = await call(updateCaseStatus, { body: { status: 'UNDER_REVIEW' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /already in this status/);
    });

    it('stops an officer updating a case assigned to someone else', async () => {
        givenCase({ officerId: 99 });

        const res = await call(updateCaseStatus, { body: { status: 'INVESTIGATING' } });

        assert.equal(res.statusCode, 403);
        assert.equal(writes.length, 0);
    });

    it('updates the status and writes both history and a timeline action', async () => {
        const res = await call(updateCaseStatus, { body: { status: 'INVESTIGATING', note: ' Visiting site ' } });

        assert.equal(res.statusCode, 200);
        assert.equal(writes.find((w) => w.model === 'case').data.status, 'INVESTIGATING');

        const history = writes.find((w) => w.model === 'caseStatusHistory').data;
        assert.equal(history.fromStatus, 'UNDER_REVIEW');
        assert.equal(history.toStatus, 'INVESTIGATING');
        assert.equal(history.note, 'Visiting site');

        const action = writes.find((w) => w.model === 'caseAction').data;
        assert.equal(action.actionType, 'STATUS_CHANGED');
        assert.deepEqual(JSON.parse(action.detail), { from: 'UNDER_REVIEW', to: 'INVESTIGATING', note: 'Visiting site' });
    });
});

describe('addCaseNote', () => {
    it('rejects an empty note', async () => {
        const res = await call(addCaseNote, { body: { content: ' ' } });

        assert.equal(res.statusCode, 400);
        assert.equal(writes.length, 0);
    });

    it('stops an officer adding notes to a case assigned to someone else', async () => {
        givenCase({ officerId: 99 });

        const res = await call(addCaseNote, { body: { content: 'Internal note' } });

        assert.equal(res.statusCode, 403);
    });
});

describe('createInfoRequest', () => {
    it('rejects a message shorter than 3 characters', async () => {
        const res = await call(createInfoRequest, { body: { message: 'hi' } });

        assert.equal(res.statusCode, 400);
    });

    it('refuses to request information on a closed case', async () => {
        givenCase({ status: 'CLOSED' });

        const res = await call(createInfoRequest, { body: { message: 'Please upload the letter.' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /closed case/);
    });
});

describe('closeCase', () => {
    it('requires a closing reason', async () => {
        const res = await call(closeCase, { body: { reason: '' } });

        assert.equal(res.statusCode, 400);
    });

    it('rejects an unknown outcome', async () => {
        const res = await call(closeCase, { body: { reason: 'Resolved', outcome: 'WON' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /Invalid outcome/);
    });

    it('refuses to close a case that is already closed', async () => {
        givenCase({ status: 'CLOSED' });

        const res = await call(closeCase, { body: { reason: 'Done here' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /already closed/);
    });

    it('closes the case and stores the outcome with the reason', async () => {
        const res = await call(closeCase, { body: { reason: 'Employer paid wages', outcome: 'RESOLVED_FOR_USER' } });

        assert.equal(res.statusCode, 200);
        assert.equal(writes.find((w) => w.model === 'case').data.status, 'CLOSED');
        assert.equal(writes.find((w) => w.model === 'caseStatusHistory').data.note, '[RESOLVED_FOR_USER] Employer paid wages');

        const action = writes.find((w) => w.model === 'caseAction').data;
        assert.equal(action.actionType, 'CLOSED');
        assert.deepEqual(JSON.parse(action.detail), { outcome: 'RESOLVED_FOR_USER', reason: 'Employer paid wages' });
    });

    it('defaults the outcome to OTHER', async () => {
        await call(closeCase, { body: { reason: 'No further contact' } });

        assert.match(writes.find((w) => w.model === 'caseStatusHistory').data.note, /^\[OTHER\]/);
    });
});

describe('escalateCase', () => {
    it('marks the case escalated and URGENT with a default reason', async () => {
        const res = await call(escalateCase);

        assert.equal(res.statusCode, 200);
        const update = writes.find((w) => w.model === 'case').data;
        assert.equal(update.escalated, true);
        assert.equal(update.priority, 'URGENT');
        assert.ok(update.escalatedAt instanceof Date);

        const action = writes.find((w) => w.model === 'caseAction').data;
        assert.equal(action.actionType, 'ESCALATED');
        assert.match(action.detail, /escalated to urgent/);
    });

    it('stops an officer escalating a case assigned to someone else', async () => {
        givenCase({ officerId: 99 });

        const res = await call(escalateCase, { body: { reason: 'Urgent' } });

        assert.equal(res.statusCode, 403);
        assert.equal(writes.length, 0);
    });
});
