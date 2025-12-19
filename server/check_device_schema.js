const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: contacts, error: cErr } = await supabase.from('contacts').select('*').limit(1);
    const { data: messages, error: mErr } = await supabase.from('ticket_messages').select('*').limit(1);

    if (cErr || mErr) {
        console.error('Error:', cErr || mErr);
    } else {
        console.log('Contacts Columns:', JSON.stringify(contacts.length > 0 ? Object.keys(contacts[0]) : [], null, 2));
        console.log('Messages Columns:', JSON.stringify(messages.length > 0 ? Object.keys(messages[0]) : [], null, 2));
    }
}

checkSchema();
