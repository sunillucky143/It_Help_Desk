const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function reproduceAuth() {
    // Hardcode the email we know exists from previous checks
    const testEmail = "alice@example.com";
    console.log(`Testing auth query for: ${testEmail}`);

    const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('contact_id, organization_id, full_name, email')
        .eq('email', testEmail)
        .eq('email', testEmail) // Keeping the double eq to match source exactly
        .single();

    if (contactError) {
        console.error('Auth Query FAILED:', contactError);
    } else {
        console.log('Auth Query SUCCESS:', contact);
    }
}

reproduceAuth();
