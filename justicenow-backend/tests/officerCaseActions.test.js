const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { fakePrisma, createRes } = require('./helpers');
const { createCaseAction } = require('../src/controllers/officerController');

const OFFICER = { id: 10, role: 'OFFICER' };

const callCreateAction = async ({ caseId = '1', body = {}, user = OFFICER } = {}) => {
    const res = createRes();
    await createCaseAction({ params: { caseId }, body, user }, res);
    return res;
};

describe('POST /api/officer/cases/:caseId/actions (createCaseAction)', () => {
    let createdWith;

    beforeEach(() => {
        createdWith = null;
        fakePrisma.case.findUnique = async ({ where }) => ({ id: where.id, officerId: OFFICER.id });
        fakePrisma.case.update = async () => ({});
        fakePrisma.caseAction.create = async ({ data }) => {
            createdWith = data;
            return { id: 99, ...data, actor: { id: data.actorId, name: 'Officer A' } };
        };
    });

    it('rejects a non-numeric case ID', async () => {
        const res = await callCreateAction({ caseId: 'abc', body: { detail: 'Called the user' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /Invalid case ID/);
    });

    it('rejects details shorter than 3 characters', async () => {
        const res = await callCreateAction({ body: { actionType: 'FIELD_VISIT', detail: ' a ' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /at least 3 characters/);
        assert.equal(createdWith, null);
    });

    it('rejects an unknown action type', async () => {
        const res = await callCreateAction({ body: { actionType: 'HACKED', detail: 'Something happened' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /Invalid action type/);
        assert.equal(createdWith, null);
    });

    it('returns 404 when the case does not exist', async () => {
        fakePrisma.case.findUnique = async () => null;

        const res = await callCreateAction({ body: { actionType: 'FIELD_VISIT', detail: 'Visited the site' } });

        assert.equal(res.statusCode, 404);
    });

    it('stops an officer recording actions on a case assigned to someone else', async () => {
        fakePrisma.case.findUnique = async ({ where }) => ({ id: where.id, officerId: 999 });

        const res = await callCreateAction({ body: { actionType: 'FIELD_VISIT', detail: 'Visited the site' } });

        assert.equal(res.statusCode, 403);
        assert.match(res.body.error, /assigned to you/);
        assert.equal(createdWith, null);
    });

    it('records a manual action for the assigned officer with trimmed detail', async () => {
        const res = await callCreateAction({
            caseId: '5',
            body: { actionType: 'FIELD_VISIT', detail: '  Visited the workplace in Colombo  ' },
        });

        assert.equal(res.statusCode, 201);
        assert.deepEqual(createdWith, {
            caseId: 5,
            actorId: OFFICER.id,
            actionType: 'FIELD_VISIT',
            detail: 'Visited the workplace in Colombo',
        });
        assert.equal(res.body.actor.name, 'Officer A');
    });

    it('defaults to OTHER_ACTION when no action type is given', async () => {
        const res = await callCreateAction({ body: { detail: 'Followed up by phone' } });

        assert.equal(res.statusCode, 201);
        assert.equal(createdWith.actionType, 'OTHER_ACTION');
    });

    it('lets an admin record an action on any case', async () => {
        fakePrisma.case.findUnique = async ({ where }) => ({ id: where.id, officerId: 999 });

        const res = await callCreateAction({
            user: { id: 1, role: 'ADMIN' },
            body: { actionType: 'MEETING_HELD', detail: 'Supervisor review meeting' },
        });

        assert.equal(res.statusCode, 201);
        assert.equal(createdWith.actorId, 1);
    });
});
