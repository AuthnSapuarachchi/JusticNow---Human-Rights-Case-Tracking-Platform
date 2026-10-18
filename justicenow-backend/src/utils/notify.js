/**
 * Real-time notifications over socket.io.
 *
 * Every authenticated socket joins `user:<id>` and `role:<ROLE>` (see server.js),
 * so a notification can target one person or a whole role. Notifications are
 * not stored: the list a user sees is rebuilt from live data by
 * GET /api/notifications, and these events only tell the app to refresh now.
 */

const emit = (io, room, notification) => {
    if (!io) return;
    io.to(room).emit('notification:new', {
        id: `${notification.type}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...notification,
    });
};

const notifyUser = (io, userId, notification) => {
    if (userId) emit(io, `user:${userId}`, notification);
};

const notifyAdmins = (io, notification) => emit(io, 'role:ADMIN', notification);

// What a citizen is told when an officer moves their case on. Plain language, no status codes.
const CITIZEN_STATUS_UPDATES = {
    SUBMITTED: ['Report received', 'Your report is waiting for an officer.'],
    NEW: ['Report received', 'Your report is waiting for an officer.'],
    UNDER_REVIEW: ['Case accepted', 'An officer accepted your case. You can now message them.'],
    INVESTIGATING: ['Case being investigated', 'Your officer is looking into what happened.'],
    WAITING_FOR_USER: ['Information needed', 'Your officer needs more information. Check your messages.'],
    ACTION_REQUIRED: ['Action needed', 'Your officer needs you to do something. Open your case for details.'],
    RESOLVED: ['Case resolved', 'Your case has been resolved.'],
    CLOSED: ['Case closed', 'Your case has been closed. Open it to see the outcome.'],
};

/** The citizen-facing notification for a case status change (live event and list share it). */
const citizenCaseUpdate = (caseId, caseRef, status) => {
    const [title, text] = CITIZEN_STATUS_UPDATES[status] || ['Case updated', 'There is an update on your case.'];
    return { type: 'CASE_UPDATED', title, body: `${caseRef} · ${text}`, href: `/cases/${caseId}` };
};

/** Live alert to the citizen who reported a case. Skips cases with no reporter account. */
const notifyReporter = (io, caseRecord, status) => {
    const caseRef = caseRecord.trackingCode?.code || `CASE-${caseRecord.id}`;
    notifyUser(io, caseRecord.reporterId, { ...citizenCaseUpdate(caseRecord.id, caseRef, status), caseId: String(caseRecord.id) });
};

module.exports = { notifyUser, notifyAdmins, notifyReporter, citizenCaseUpdate };
