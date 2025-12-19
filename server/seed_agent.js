const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function seedAgent() {
    console.log('--- Seeding Support Bot ---');

    // Check if exists first
    const { data: existing } = await supabase.from('support_agents').select('*').eq('full_name', 'Support Bot').single();
    if (existing) {
        console.log('Support Bot already exists:', existing);
        return;
    }

    const { data, error } = await supabase.from('support_agents').insert({
        full_name: 'Support Bot',
        email: 'bot@system.com',
        agent_type: 'Bot',
        is_available: true
    }).select().single();

    if (error) console.error('Error creating bot:', error);
    else console.log('✅ Created Support Bot:', data);
}

seedAgent();
