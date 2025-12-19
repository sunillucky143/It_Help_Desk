const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkAgents() {
    console.log('--- Checking Support Agents ---');
    const { data, error } = await supabase.from('support_agents').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}

checkAgents();
