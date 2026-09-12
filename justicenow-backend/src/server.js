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
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./config/db');


// Load environment variables
dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

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
    socket.on('chat:join', async (caseId) => {
        const numericCaseId = Number(caseId);
        const foundCase = Number.isInteger(numericCaseId) && numericCaseId > 0
            ? await prisma.case.findUnique({ where: { id: numericCaseId } })
            : await prisma.case.findFirst({ where: { trackingCode: { is: { code: String(caseId) } } } });
        if (foundCase) socket.join(`case:${foundCase.id}`);
    });
    socket.on('chat:leave', (caseId) => socket.leave(`case:${caseId}`));
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});