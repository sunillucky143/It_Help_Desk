const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function compareEmails() {
    console.log('Comparing Auth Users with Contacts...');

    const { data: contacts, error: contactError } = await supabase.from('contacts').select('email');
    if (contactError) {
        console.error('Error fetching contacts:', contactError);
        return;
    }
    const contactEmails = new Set(contacts.map(c => c.email.toLowerCase()));

    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Error fetching auth users:', authError);
        return;
    }

    let foundMismatch = false;

    let emailCounts = {};

    contacts.forEach(c => {
        const email = c.email.toLowerCase();
        emailCounts[email] = (emailCounts[email] || 0) + 1;
    });

    users.forEach(u => {
        const email = u.email.toLowerCase();
        if (contactEmails.has(email)) {
            console.log(`[MATCH] User ${email} found in contacts.`);
            if (emailCounts[email] > 1) {
                console.log(`[WARNING] User ${email} has ${emailCounts[email]} entries in contacts table! This will cause .single() to fail.`);
            }
        } else {
            console.log(`[MISMATCH] User ${email} NOT found in contacts!`);
            foundMismatch = true;
        }
    });

    if (!foundMismatch) {
        console.log('All auth users have corresponding contact profiles.');
    }
}

compareEmails();
