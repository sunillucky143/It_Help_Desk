const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getData() {
    // Get a contact
    const { data: contact } = await supabase.from('contacts').select('*').limit(1).single();
    // Get a device
    const { data: device } = await supabase.from('devices').select('*').limit(1).single();

    console.log("TEST_DATA=" + JSON.stringify({
        contact_id: contact?.contact_id,
        organization_id: contact?.organization_id,
        device_id: device?.device_id
    }));
}

getData();
