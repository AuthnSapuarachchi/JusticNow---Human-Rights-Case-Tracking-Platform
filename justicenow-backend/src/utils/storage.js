const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase Storage for user files (case evidence and chat photos).
 *
 * Files go to the shared bucket rather than this server's disk, because every
 * teammate's backend talks to the same database: a file saved on one laptop's
 * disk would be listed for everyone but load for no one else.
 */

const BUCKET = 'evidence';

// File types users may share, with the extension used for the stored object.
const ALLOWED_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
};

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

/** Uploads a file to the public bucket and returns its public https URL. */
const uploadPublicFile = async (objectPath, buffer, contentType) => {
    const storage = getSupabase().storage.from(BUCKET);
    const { error } = await storage.upload(objectPath, buffer, { contentType });
    if (error) throw error;
    return storage.getPublicUrl(objectPath).data.publicUrl;
};

module.exports = { ALLOWED_TYPES, getSupabase, uploadPublicFile };
