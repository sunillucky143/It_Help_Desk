const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function resetAgent() {
    console.log('--- RESETTING Support Bot ---');

    // 1. Delete if exists
    const { error: delErr } = await supabase.from('support_agents').delete().eq('full_name', 'Support Bot');
    if (delErr) console.error('Delete error:', delErr);
    else console.log('Deleted existing bot (if any).');

    // 2. Insert new
    const { data, error } = await supabase.from('support_agents').insert({
        full_name: 'Support Bot',
        email: 'bot@system.com',
        agent_type: 'Bot',
        is_available: true
    }).select().single();

    if (error) console.error('Error creating bot:', error);
    else console.log('✅ Created Support Bot:', data);
}

resetAgent();
