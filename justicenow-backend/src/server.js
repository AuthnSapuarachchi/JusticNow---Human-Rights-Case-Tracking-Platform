const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const caseRoutes = require('./routes/caseRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const rightsRoutes = require('./routes/rightsRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const officerRoutes = require('./routes/officerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./config/db');


// Load environment variables
dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
app.set('io', io); // lets controllers emit socket events (e.g. officer info requests)

// Middlewares
app.use(cors());
app.use(express.json()); // Parses incoming JSON payloads
app.use(morgan('dev')); // Logs API requests to the console
app.use('/uploads', express.static('uploads'));

// Basic Health Check Route (For Sprint 1 Demo)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'JusticeNow API is running' });
});

// We will mount our modular routes here later
app.use('/api/auth', authRoutes);
// c
app.use('/api/cases', caseRoutes);
app.use('/api', chatRoutes(io));
app.use('/api/users', userRoutes);
app.use('/api/rights', rightsRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/verifications', verificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        next(new Error('Not authorized'));
    }
});

io.on('connection', (socket) => {
    // Personal and role rooms used by utils/notify.js.
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);

    socket.on('chat:join', async (caseId) => {
        try {
            const numericCaseId = Number(caseId);
            const foundCase = Number.isInteger(numericCaseId) && numericCaseId > 0
                ? await prisma.case.findUnique({ where: { id: numericCaseId } })
                : await prisma.case.findFirst({ where: { trackingCode: { is: { code: String(caseId) } } } });
            const user = socket.user;
            const isParticipant = foundCase && (
                (user.role === 'CITIZEN' && foundCase.reporterId === user.id) ||
                (user.role === 'OFFICER' && foundCase.officerId === user.id)
            );
            if (isParticipant && foundCase.approvedAt) {
                socket.join(`case:${foundCase.id}`);
                // Lets the client confirm it is live (and resync anything it missed while offline).
                socket.emit('chat:joined', String(foundCase.id));
            }
        } catch (error) {
            console.error('Unable to join case chat:', error);
        }
    });
    socket.on('chat:leave', async (caseId) => {
        const numericCaseId = Number(caseId);
        if (Number.isInteger(numericCaseId) && numericCaseId > 0) return socket.leave(`case:${numericCaseId}`);
        // Tracking-code joins were stored under the numeric id, so resolve it before leaving.
        const foundCase = await prisma.case.findFirst({ where: { trackingCode: { is: { code: String(caseId) } } } }).catch(() => null);
        if (foundCase) socket.leave(`case:${foundCase.id}`);
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});