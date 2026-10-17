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

module.exports = { notifyUser, notifyAdmins };
