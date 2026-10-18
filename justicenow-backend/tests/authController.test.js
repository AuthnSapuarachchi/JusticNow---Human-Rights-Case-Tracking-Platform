const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { fakePrisma, createReq, createRes, quietly } = require('./helpers');
const { registerUser, loginOfficer, refreshUserToken } = require('../src/controllers/authController');

before(() => {
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

const call = async (handler, reqOptions) => {
    const res = createRes();
    await handler(createReq(reqOptions), res);
    return res;
};

describe('registerUser', () => {
    beforeEach(() => {
        fakePrisma.user.findUnique = async () => null;
        fakePrisma.user.create = async ({ data }) => ({ id: 1, createdAt: new Date(), ...data });
    });

    it('requires a password of at least 8 characters', async () => {
        const res = await call(registerUser, { body: { name: 'Nimal', email: 'nimal@example.lk', password: 'short' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /at least 8 characters/);
    });

    it('refuses to create administrator accounts through public sign-up', async () => {
        const res = await call(registerUser, {
            body: { name: 'Eve', email: 'eve@example.lk', password: 'password123', role: 'ADMIN' },
        });

        assert.equal(res.statusCode, 403);
    });

    it('requires a contact number for officer registration', async () => {
        const res = await call(registerUser, {
            body: { name: 'Officer', email: 'off@example.lk', password: 'password123', role: 'OFFICER' },
        });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /contact number/);
    });

    it('requires two verification documents from officers', async () => {
        const res = await call(registerUser, {
            body: { name: 'Officer', email: 'off@example.lk', password: 'password123', role: 'OFFICER', contactNumber: '0771234567' },
            files: [{ originalname: 'id.pdf' }],
        });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /verification documents/);
    });

    it('rejects an email that is already registered', async () => {
        fakePrisma.user.findUnique = async () => ({ id: 5 });

        const res = await call(registerUser, { body: { name: 'Nimal', email: 'nimal@example.lk', password: 'password123' } });

        assert.equal(res.statusCode, 409);
    });

    it('creates a citizen with a normalised email, hashed password and tokens', async () => {
        let saved;
        fakePrisma.user.create = async ({ data }) => {
            saved = data;
            return { id: 11, createdAt: new Date(), ...data };
        };

        const res = await call(registerUser, {
            body: { name: '  Nimal Perera ', email: '  Nimal@Example.LK ', password: 'password123' },
        });

        assert.equal(res.statusCode, 201);
        assert.equal(saved.email, 'nimal@example.lk');
        assert.equal(saved.name, 'Nimal Perera');
        assert.equal(saved.role, 'CITIZEN');
        assert.equal(saved.verificationStatus, 'NOT_REQUIRED');
        assert.notEqual(saved.password, 'password123');
        assert.equal(await bcrypt.compare('password123', saved.password), true);
        assert.ok(res.body.accessToken);
        assert.ok(res.body.refreshToken);
    });
});

describe('loginOfficer', () => {
    let storedUser;

    before(async () => {
        storedUser = {
            id: 3,
            email: 'maya@example.lk',
            name: 'Maya Perera',
            role: 'OFFICER',
            isActive: true,
            verificationStatus: 'APPROVED',
            password: await bcrypt.hash('correct-password', 4),
        };
    });

    it('returns 404 for an unknown email', async () => {
        fakePrisma.user.findUnique = async () => null;

        const res = await call(loginOfficer, { body: { email: 'nobody@example.lk', password: 'x' } });

        assert.equal(res.statusCode, 404);
    });

    it('returns 401 for a wrong password', async () => {
        fakePrisma.user.findUnique = async () => storedUser;

        const res = await call(loginOfficer, { body: { email: storedUser.email, password: 'wrong-password' } });

        assert.equal(res.statusCode, 401);
    });

    it('blocks a deactivated account', async () => {
        fakePrisma.user.findUnique = async () => ({ ...storedUser, isActive: false });

        const res = await call(loginOfficer, { body: { email: storedUser.email, password: 'correct-password' } });

        assert.equal(res.statusCode, 403);
        assert.match(res.body.error, /deactivated/);
    });

    it('logs in with case-insensitive email and returns a token carrying the role', async () => {
        let lookedUp;
        fakePrisma.user.findUnique = async ({ where }) => {
            lookedUp = where.email;
            return storedUser;
        };

        const res = await call(loginOfficer, { body: { email: ' MAYA@example.lk ', password: 'correct-password' } });

        assert.equal(res.statusCode, 200);
        assert.equal(lookedUp, 'maya@example.lk');
        assert.equal(res.body.user.role, 'OFFICER');
        assert.equal(res.body.user.password, undefined);
        assert.equal(jwt.verify(res.body.accessToken, process.env.JWT_SECRET).role, 'OFFICER');
    });

    it('returns 503 when the database is unreachable', async () => {
        fakePrisma.user.findUnique = async () => {
            throw Object.assign(new Error('unreachable'), { code: 'P1001' });
        };

        const res = await quietly(() => call(loginOfficer, { body: { email: 'a@b.lk', password: 'x' } }));

        assert.equal(res.statusCode, 503);
    });
});

describe('refreshUserToken', () => {
    it('requires a refresh token', async () => {
        const res = await call(refreshUserToken, { body: {} });
        assert.equal(res.statusCode, 401);
    });

    it('rejects a token signed with the access secret instead of the refresh secret', async () => {
        const token = jwt.sign({ id: 3, role: 'OFFICER' }, process.env.JWT_SECRET);

        const res = await call(refreshUserToken, { body: { refreshToken: token } });

        assert.equal(res.statusCode, 403);
    });

    it('refuses to refresh a deactivated account', async () => {
        fakePrisma.user.findUnique = async () => ({ id: 3, role: 'OFFICER', isActive: false });
        const token = jwt.sign({ id: 3, role: 'OFFICER' }, process.env.JWT_REFRESH_SECRET);

        const res = await call(refreshUserToken, { body: { refreshToken: token } });

        assert.equal(res.statusCode, 403);
    });

    it('issues a new access token using the role stored in the database', async () => {
        // Role in the DB changed since the refresh token was issued
        fakePrisma.user.findUnique = async () => ({ id: 3, role: 'ADMIN', isActive: true });
        const token = jwt.sign({ id: 3, role: 'OFFICER' }, process.env.JWT_REFRESH_SECRET);

        const res = await call(refreshUserToken, { body: { refreshToken: token } });

        assert.equal(res.statusCode, 200);
        assert.equal(jwt.verify(res.body.accessToken, process.env.JWT_SECRET).role, 'ADMIN');
    });
});
