const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { notifyUser, notifyAdmins, notifyReporter, citizenCaseUpdate } = require('../src/utils/notify');

/** Socket.io double that records which room got which event. */
const createIo = () => {
    const sent = [];
    return {
        sent,
        to: (room) => ({ emit: (event, payload) => sent.push({ room, event, payload }) }),
    };
};

describe('citizenCaseUpdate', () => {
    it('describes a status change in plain language', () => {
        const update = citizenCaseUpdate(4, 'JN-123456', 'WAITING_FOR_USER');

        assert.equal(update.type, 'CASE_UPDATED');
        assert.equal(update.title, 'Information needed');
        assert.equal(update.body, 'JN-123456 · Your officer needs more information. Check your messages.');
        assert.equal(update.href, '/cases/4');
    });

    it('never shows raw status codes to citizens', () => {
        for (const status of ['UNDER_REVIEW', 'INVESTIGATING', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED']) {
            const { title, body } = citizenCaseUpdate(1, 'JN-1', status);
            assert.doesNotMatch(`${title} ${body}`, /[A-Z]+_[A-Z]+/, status);
        }
    });

    it('falls back to a generic message for an unknown status', () => {
        assert.equal(citizenCaseUpdate(1, 'JN-1', 'SOMETHING_NEW').title, 'Case updated');
    });
});

describe('notifyUser / notifyAdmins', () => {
    it('sends to the personal room of the user', () => {
        const io = createIo();

        notifyUser(io, 7, { type: 'CASE_ASSIGNED', title: 'New case' });

        assert.equal(io.sent.length, 1);
        assert.equal(io.sent[0].room, 'user:7');
        assert.equal(io.sent[0].event, 'notification:new');
        assert.equal(io.sent[0].payload.title, 'New case');
        assert.ok(io.sent[0].payload.id.startsWith('CASE_ASSIGNED-'));
        assert.ok(io.sent[0].payload.createdAt);
    });

    it('broadcasts admin notifications to the ADMIN role room', () => {
        const io = createIo();

        notifyAdmins(io, { type: 'OFFICER_PENDING' });

        assert.equal(io.sent[0].room, 'role:ADMIN');
    });

    it('does nothing when there is no user or no socket server', () => {
        const io = createIo();

        notifyUser(io, null, { type: 'X' });
        assert.doesNotThrow(() => notifyUser(null, 7, { type: 'X' }));

        assert.equal(io.sent.length, 0);
    });
});

describe('notifyReporter', () => {
    it('alerts the citizen who reported the case', () => {
        const io = createIo();

        notifyReporter(io, { id: 4, reporterId: 50, trackingCode: { code: 'JN-123456' } }, 'CLOSED');

        assert.equal(io.sent[0].room, 'user:50');
        assert.equal(io.sent[0].payload.caseId, '4');
        assert.match(io.sent[0].payload.body, /^JN-123456/);
    });

    it('skips anonymous reports that have no reporter account', () => {
        const io = createIo();

        notifyReporter(io, { id: 4, reporterId: null }, 'CLOSED');

        assert.equal(io.sent.length, 0);
    });
});
