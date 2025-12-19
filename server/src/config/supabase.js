// src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// NOTE: Ideally, use the ANON KEY for frontend requests, but for this backend service 
// we will use the Service Key CAREFULLY.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Key in .env');
    process.exit(1);
}

// The "Admin" client - has full power. Use only when necessary.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabaseAdmin };