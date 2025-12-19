const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkContacts() {
    console.log('--- Checking Contacts Table ---');
    const { data: contacts, error } = await supabase.from('contacts').select('*');
    if (error) {
        console.error('Error fetching contacts:', error);
    } else {
        console.log(JSON.stringify(contacts, null, 2));
    }

    console.log('--- Checking Auth Users (if possible) ---');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Error fetching auth users:', authError);
    } else {
        console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email })), null, 2));
    }
}

checkContacts();
