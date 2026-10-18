const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { createRes } = require('./helpers');
const { protectRoute, authorizeRoles } = require('../src/middlewares/authMiddleware');

const SECRET = 'test-secret';

describe('protectRoute', () => {
    before(() => {
        process.env.JWT_SECRET = SECRET;
    });

    it('rejects a request with no Authorization header', () => {
        const res = createRes();
        let calledNext = false;

        protectRoute({ headers: {} }, res, () => (calledNext = true));

        assert.equal(res.statusCode, 401);
        assert.match(res.body.error, /no token/);
        assert.equal(calledNext, false);
    });

    it('rejects an invalid token', () => {
        const res = createRes();
        let calledNext = false;

        protectRoute({ headers: { authorization: 'Bearer not-a-real-token' } }, res, () => (calledNext = true));

        assert.equal(res.statusCode, 401);
        assert.match(res.body.error, /token failed/);
        assert.equal(calledNext, false);
    });

    it('rejects a token signed with a different secret', () => {
        const token = jwt.sign({ id: 1, role: 'OFFICER' }, 'some-other-secret');
        const res = createRes();

        protectRoute({ headers: { authorization: `Bearer ${token}` } }, res, () => {});

        assert.equal(res.statusCode, 401);
    });

    it('attaches the decoded user and calls next for a valid token', () => {
        const token = jwt.sign({ id: 7, role: 'OFFICER' }, SECRET);
        const req = { headers: { authorization: `Bearer ${token}` } };
        let calledNext = false;

        protectRoute(req, createRes(), () => (calledNext = true));

        assert.equal(calledNext, true);
        assert.equal(req.user.id, 7);
        assert.equal(req.user.role, 'OFFICER');
    });
});

describe('authorizeRoles', () => {
    it('allows a user whose role is in the allowed list', () => {
        let calledNext = false;
        authorizeRoles('OFFICER', 'ADMIN')({ user: { role: 'ADMIN' } }, createRes(), () => (calledNext = true));
        assert.equal(calledNext, true);
    });

    it('blocks a citizen from officer routes with 403', () => {
        const res = createRes();
        let calledNext = false;

        authorizeRoles('OFFICER', 'ADMIN')({ user: { role: 'USER' } }, res, () => (calledNext = true));

        assert.equal(res.statusCode, 403);
        assert.match(res.body.error, /OFFICER, ADMIN/);
        assert.equal(calledNext, false);
    });

    it('blocks a request with no authenticated user', () => {
        const res = createRes();
        authorizeRoles('ADMIN')({}, res, () => {});
        assert.equal(res.statusCode, 403);
    });
});
