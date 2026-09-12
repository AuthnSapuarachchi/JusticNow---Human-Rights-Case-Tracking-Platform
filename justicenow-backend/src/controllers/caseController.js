require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../config/db');

let supabase;

const getSupabase = () => {
    if (supabase) return supabase;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        const error = new Error('Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
        error.code = 'SUPABASE_STORAGE_NOT_CONFIGURED';
        throw error;
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    return supabase;
};

const generateTrackingCode = () => 'JN-' + Math.floor(100000 + Math.random() * 900000);

const submitCase = async (req, res) => {
    try {
        const { description, pin, category, incidentDate, location, isAnonymous } = req.body;
        const file = req.file; // Captured by Multer in your router

        const normalizedDescription = description?.trim();
        const normalizedPin = String(pin || '').trim();
        const parsedIncidentDate = incidentDate ? new Date(incidentDate) : null;

        if (!normalizedDescription || normalizedDescription.length < 10) {
            return res.status(400).json({ error: 'A description of at least 10 characters is required.' });
        }
        if (!/^\d{4,12}$/.test(normalizedPin)) {
            return res.status(400).json({ error: 'A numeric PIN between 4 and 12 digits is required.' });
        }
        if (parsedIncidentDate && Number.isNaN(parsedIncidentDate.getTime())) {
            return res.status(400).json({ error: 'Please enter a valid incident date.' });
        }

        const uniqueCode = generateTrackingCode();
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(normalizedPin, salt);

        let evidenceUrl = null;

        // If the user attached a file, upload it to the Supabase bucket
        if (file) {
            const storage = getSupabase().storage;
            const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

            const { error } = await storage
                .from('evidence')
                .upload(`cases/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                });

            if (error) throw error;

            // Get the public URL to save in the database
            const { data: publicUrlData } = storage
                .from('evidence')
                .getPublicUrl(`cases/${fileName}`);

            evidenceUrl = publicUrlData.publicUrl;
        }

        // Save the case, tracking code, and evidence URL to PostgreSQL
        const newCase = await prisma.case.create({
            data: {
                description: normalizedDescription,
                incidentDate: parsedIncidentDate,
                isAnonymous: isAnonymous !== 'false',
                category: category || 'OTHER',
                location: location?.trim() || null,
                reporter: {
                    connect: { id: req.user.id }
                },
                trackingCode: {
                    create: { code: uniqueCode, pin: hashedPin }
                },
                // Updated to match your array relation and include fileType
                ...(evidenceUrl && {
                    evidence: {
                        create: {
                            fileUrl: evidenceUrl,
                            fileType: file.mimetype
                        }
                    }
                })
            },
            include: { trackingCode: true, evidence: true }
        });

        res.status(201).json({
            status: 'success',
            message: 'Anonymous report and evidence submitted securely.',
            data: {
                caseId: newCase.id,
                trackingCode: newCase.trackingCode.code,
                evidence: evidenceUrl
            }
        });
    } catch (error) {
        console.error('Error creating case:', error?.stack || error);
        if (error?.code === 'SUPABASE_STORAGE_NOT_CONFIGURED') {
            return res.status(503).json({ error: 'Evidence storage is not configured. Please contact support.' });
        }
        if (error?.code === 'P2002') {
            return res.status(409).json({ error: 'A duplicate case reference was generated. Please try again.' });
        }
        res.status(500).json({ error: 'Internal server error while submitting report.' });
    }
};

const serializeStatus = (status) => ({
    SUBMITTED: 'pending',
    UNDER_REVIEW: 'in-progress',
    ACTION_REQUIRED: 'in-progress',
    RESOLVED: 'resolved',
    CLOSED: 'resolved',
}[status] || 'pending');

const serializeCase = (caseRecord) => ({
    id: String(caseRecord.id),
    reference: caseRecord.trackingCode?.code || `CASE-${caseRecord.id}`,
    category: caseRecord.category.replace(/_/g, ' '),
    status: serializeStatus(caseRecord.status),
    lastUpdated: caseRecord.updatedAt,
    description: caseRecord.description,
    requiredAction: caseRecord.actionRequest || undefined,
    incidentDate: caseRecord.incidentDate,
    location: caseRecord.location,
    evidence: caseRecord.evidence,
});

const caseInclude = { trackingCode: true, evidence: true };

const canViewCase = (req, caseRecord) =>
    req.user.role === 'ADMIN' ||
    req.user.role === 'OFFICER' ||
    caseRecord.reporterId === req.user.id;

const getMyCases = async (req, res) => {
    try {
        const where = req.user.role === 'CITIZEN' ? { reporterId: req.user.id } : {};
        const cases = await prisma.case.findMany({
            where,
            include: caseInclude,
            orderBy: { updatedAt: 'desc' },
        });
        res.json(cases.map(serializeCase));
    } catch (error) {
        console.error('Error listing cases:', error);
        res.status(500).json({ error: 'Unable to load cases right now.' });
    }
};

const getCase = async (req, res) => {
    try {
        const caseId = Number(req.params.caseId);
        if (!Number.isInteger(caseId) || caseId < 1) return res.status(400).json({ error: 'Invalid case ID.' });

        const caseRecord = await prisma.case.findUnique({ where: { id: caseId }, include: caseInclude });
        if (!caseRecord || !canViewCase(req, caseRecord)) return res.status(404).json({ error: 'Case not found.' });
        res.json(serializeCase(caseRecord));
    } catch (error) {
        console.error('Error loading case:', error);
        res.status(500).json({ error: 'Unable to load case right now.' });
    }
};

const getCaseStatus = async (req, res) => {
    try {
        const caseId = Number(req.params.caseId);
        const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
        if (!caseRecord || !canViewCase(req, caseRecord)) return res.status(404).json({ error: 'Case not found.' });

        const status = serializeStatus(caseRecord.status);
        res.json([
            { id: `${caseRecord.id}-submitted`, status: 'pending', label: 'Case submitted', timestamp: caseRecord.createdAt, completed: true },
            { id: `${caseRecord.id}-review`, status: 'in-progress', label: 'Under review', timestamp: status === 'pending' ? '' : caseRecord.updatedAt, completed: status !== 'pending' },
            { id: `${caseRecord.id}-resolved`, status: 'resolved', label: 'Resolution', timestamp: status === 'resolved' ? caseRecord.updatedAt : '', completed: status === 'resolved' },
        ]);
    } catch (error) {
        console.error('Error loading case status:', error);
        res.status(500).json({ error: 'Unable to load case status right now.' });
    }
};

const trackCase = async (req, res) => {
    try {
        const { trackingCode, pin } = req.body;

        if (!trackingCode?.trim() || !pin) {
            return res.status(400).json({ error: 'Tracking code and PIN are required.' });
        }

        const trackedCase = await prisma.case.findFirst({
            where: { trackingCode: { code: trackingCode.trim() } },
            include: { trackingCode: true, evidence: true },
        });

        if (!trackedCase || !(await bcrypt.compare(String(pin), trackedCase.trackingCode.pin))) {
            return res.status(404).json({ error: 'Case not found or PIN is incorrect.' });
        }

        res.json({
            data: {
                id: trackedCase.id,
                trackingCode: trackedCase.trackingCode.code,
                status: trackedCase.status,
                description: trackedCase.description,
                incidentDate: trackedCase.incidentDate,
                evidence: trackedCase.evidence,
                createdAt: trackedCase.createdAt,
                updatedAt: trackedCase.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error tracking case:', error);
        res.status(500).json({ error: 'Unable to track case right now.' });
    }
};

module.exports = { submitCase, trackCase, getMyCases, getCase, getCaseStatus };