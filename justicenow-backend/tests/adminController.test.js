const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const { fakePrisma, createReq, createRes } = require('./helpers');
const { createOfficer, updateOfficer, updateCategory } = require('../src/controllers/adminController');

const ADMIN = { id: 1, role: 'ADMIN' };

const call = async (handler, reqOptions) => {
    const res = createRes();
    await handler(createReq({ user: ADMIN, ...reqOptions }), res);
    return res;
};

describe('createOfficer (admin)', () => {
    let saved;

    beforeEach(() => {
        saved = null;
        fakePrisma.user.findUnique = async () => null;
        fakePrisma.legalOrganization.findUnique = async ({ where }) => ({ id: where.id });
        fakePrisma.user.create = async ({ data }) => {
            saved = data;
            return { id: 20, ...data };
        };
    });

    it('requires name, email and a temporary password of 8+ characters', async () => {
        const res = await call(createOfficer, { body: { name: 'Maya', email: 'maya@example.lk', password: '1234' } });

        assert.equal(res.statusCode, 400);
        assert.equal(saved, null);
    });

    it('rejects an invalid email address', async () => {
        const res = await call(createOfficer, { body: { name: 'Maya', email: 'not-an-email', password: 'password123' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /valid email/);
    });

    it('rejects a duplicate email', async () => {
        fakePrisma.user.findUnique = async () => ({ id: 2 });

        const res = await call(createOfficer, { body: { name: 'Maya', email: 'maya@example.lk', password: 'password123' } });

        assert.equal(res.statusCode, 409);
    });

    it('rejects an organization that does not exist', async () => {
        fakePrisma.legalOrganization.findUnique = async () => null;

        const res = await call(createOfficer, {
            body: { name: 'Maya', email: 'maya@example.lk', password: 'password123', organizationId: 404 },
        });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /Organization not found/);
    });

    it('creates a pre-approved OFFICER with a hashed password and zero open cases', async () => {
        const res = await call(createOfficer, {
            body: { name: ' Maya Perera ', email: 'Maya@Example.lk', password: 'password123', organizationId: 3 },
        });

        assert.equal(res.statusCode, 201);
        assert.equal(saved.role, 'OFFICER');
        assert.equal(saved.verificationStatus, 'APPROVED');
        assert.equal(saved.email, 'maya@example.lk');
        assert.equal(saved.name, 'Maya Perera');
        assert.equal(saved.organizationId, 3);
        assert.equal(await bcrypt.compare('password123', saved.password), true);
        assert.equal(res.body.openCases, 0);
    });
});

describe('updateOfficer (admin)', () => {
    beforeEach(() => {
        fakePrisma.user.findUnique = async () => ({ id: 20, role: 'OFFICER', email: 'maya@example.lk' });
        fakePrisma.user.update = async ({ data }) => ({ id: 20, ...data });
        fakePrisma.case.groupBy = async () => [];
        fakePrisma.case.count = async () => 0;
    });

    it('rejects an invalid officer ID', async () => {
        const res = await call(updateOfficer, { params: { id: 'abc' }, body: {} });
        assert.equal(res.statusCode, 400);
    });

    it('returns 404 when the user is not an officer', async () => {
        fakePrisma.user.findUnique = async () => ({ id: 20, role: 'CITIZEN' });

        const res = await call(updateOfficer, { params: { id: '20' }, body: { name: 'X' } });

        assert.equal(res.statusCode, 404);
    });

    it('requires isActive to be a boolean', async () => {
        const res = await call(updateOfficer, { params: { id: '20' }, body: { isActive: 'no' } });

        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /true or false/);
    });

    it('rejects a reset password shorter than 8 characters', async () => {
        const res = await call(updateOfficer, { params: { id: '20' }, body: { password: 'short' } });

        assert.equal(res.statusCode, 400);
    });

    it('rejects changing the email to one another account uses', async () => {
        fakePrisma.user.findUnique = async ({ where }) =>
            where.id ? { id: 20, role: 'OFFICER', email: 'maya@example.lk' } : { id: 99 };

        const res = await call(updateOfficer, { params: { id: '20' }, body: { email: 'taken@example.lk' } });

        assert.equal(res.statusCode, 409);
    });
});

describe('updateCategory (admin)', () => {
    let upserted;

    beforeEach(() => {
        upserted = null;
        fakePrisma.violationCategoryConfig.upsert = async (args) => {
            upserted = args;
            return { code: args.where.code, ...args.update };
        };
    });

    it('rejects an unknown category code', async () => {
        const res = await call(updateCategory, { params: { code: 'PARKING' }, body: { label: 'Parking' } });

        assert.equal(res.statusCode, 400);
        assert.equal(upserted, null);
    });

    it('rejects an empty label', async () => {
        const res = await call(updateCategory, { params: { code: 'DIGITAL_PRIVACY' }, body: { label: '   ' } });

        assert.equal(res.statusCode, 400);
    });

    it('accepts a lower-case code and can disable a category for new reports', async () => {
        const res = await call(updateCategory, {
            params: { code: 'workplace_discrimination' },
            body: { label: ' Workplace discrimination ', isActive: false },
        });

        assert.equal(res.statusCode, 200);
        assert.equal(upserted.where.code, 'WORKPLACE_DISCRIMINATION');
        assert.deepEqual(upserted.update, { label: 'Workplace discrimination', isActive: false });
    });
});
