const path = require('node:path');

/**
 * Swaps the real Prisma client (src/config/db.js) for an in-memory fake so tests
 * never connect to the shared Supabase database. Must run before any module
 * that requires '../config/db' is loaded.
 *
 * Any model (fakePrisma.user, fakePrisma.case, ...) exists on first access;
 * tests assign the methods they need, e.g. `fakePrisma.case.findUnique = async () => ...`.
 */
const models = {};
const fakePrisma = new Proxy(
    {
        // Supports both the array form and the interactive (callback) form
        $transaction: (operations) =>
            typeof operations === 'function' ? operations(fakePrisma) : Promise.all(operations),
    },
    {
        get(target, prop) {
            if (prop in target) return target[prop];
            if (typeof prop !== 'string') return undefined;
            if (!models[prop]) models[prop] = {};
            return models[prop];
        },
    }
);

const dbPath = path.resolve(__dirname, '../src/config/db.js');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fakePrisma };

/** Minimal Express response double that records status and JSON body. */
const createRes = () => {
    const res = { statusCode: 200, body: undefined };
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (body) => {
        res.body = body;
        return res;
    };
    return res;
};

/** Express request double. `app.get('io')` returns null, so socket notifications are skipped. */
const createReq = ({ params = {}, body = {}, user, files } = {}) => ({
    params,
    body,
    user,
    files,
    headers: {},
    app: { get: () => null },
});

/** Runs fn with console.error silenced (handlers log expected failures). */
const quietly = async (fn) => {
    const originalError = console.error;
    console.error = () => {};
    try {
        return await fn();
    } finally {
        console.error = originalError;
    }
};

module.exports = { fakePrisma, createReq, createRes, quietly };
