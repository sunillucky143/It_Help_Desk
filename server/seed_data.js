// server/seed_data.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- RAW DATA (Same as before) ---
const RAW_DATA = {
    organizations: [
        { name: 'U Rack IT LLC', u_e_code: 9999, manager: 'Admin' },
        { name: 'CD Metropoulos', u_e_code: 9998, manager: 'Michael Engel' },
        { name: 'Summit Facility Solutions', u_e_code: 5555, manager: 'Christina Murdock' }
    ],
    assets: [
        {
            asset_name: 'Surface', status: 'OFFLINE', manufacturer: 'Microsoft Corporation', model: 'Surface Pro 9',
            os: 'Microsoft Windows 11 Home', client: 'CD Metropoulos', site: 'Headquarters',
            user: { name: 'Michael Engel', email: 'mengel@cdmetropoulos.com' }
        },
        {
            asset_name: 'DH-BUS-SERVICES', status: 'OFFLINE', manufacturer: 'LENOVO', model: 'ThinkPad P15v Gen 3',
            os: 'Microsoft Windows 11 Pro', client: 'U Rack IT LLC', site: 'Support',
            user: { name: 'Donna Healey', email: 'dhealey@urackit.com' }
        },
        {
            asset_name: 'Workstation-CM', status: 'ONLINE', manufacturer: 'Dell Inc.', model: 'OptiPlex 7070',
            os: 'Windows 10 Pro', client: 'Summit Facility Solutions', site: 'Headquarters',
            user: { name: 'Christina Murdock', email: 'cmurdock@summit.com' }
        },
        {
            asset_name: 'Batcave Nuc 4', status: 'ONLINE', manufacturer: 'Intel', model: 'NUC11PAHi5',
            os: 'Windows 11 Pro', client: 'U Rack IT LLC', site: 'Headquarters',
            user: { name: 'Server Admin', email: 'admin@urackit.com' }
        }
    ]
};

// --- HELPER: SAFE INSERT (Check if exists, then insert) ---
async function safeInsert(table, matchData, insertData) {
    // 1. Try to find existing
    let query = supabase.from(table).select('*');
    for (const [key, value] of Object.entries(matchData)) {
        query = query.eq(key, value);
    }
    const { data: existing } = await query.single();

    if (existing) return existing;

    // 2. If not found, insert
    const { data: newRec, error } = await supabase.from(table).insert(insertData).select().single();

    if (error) {
        // Ignore "duplicate key" race conditions, just return the existing one
        if (error.code === '23505') {
            const { data: retry } = await query.single();
            return retry;
        }
        console.error(`   ❌ Error inserting into ${table}:`, error.message);
        return null;
    }
    return newRec;
}

async function seed() {
    console.log('🌱 Starting Safe Seed...');

    try {
        // --- 1. REFERENCE DATA ---
        console.log('1. Seeding Reference Tables...');

        // Manufacturers
        const manufacturers = [...new Set(RAW_DATA.assets.map(a => a.manufacturer))];
        for (const m of manufacturers) {
            await safeInsert('device_manufacturers', { name: m }, { name: m });
        }

        // Models
        const { data: mfrDB } = await supabase.from('device_manufacturers').select('*');
        const models = [...new Set(RAW_DATA.assets.map(a => a.model))];
        for (const asset of RAW_DATA.assets) {
            const mfrId = mfrDB.find(m => m.name === asset.manufacturer)?.manufacturer_id;
            if (mfrId) {
                await safeInsert(
                    'device_models',
                    { name: asset.model, manufacturer_id: mfrId }, // Match criteria
                    { name: asset.model, manufacturer_id: mfrId }  // Insert data
                );
            }
        }

        // OS
        const osList = [...new Set(RAW_DATA.assets.map(a => a.os))];
        for (const os of osList) {
            await safeInsert('operating_systems', { name: os }, { name: os });
        }

        // --- 2. ORGANIZATIONS & LOCATIONS ---
        console.log('2. Seeding Organizations & Sites...');
        for (const org of RAW_DATA.organizations) {
            // Org
            const orgData = await safeInsert(
                'organizations',
                { u_e_code: org.u_e_code },
                { name: org.name, u_e_code: org.u_e_code }
            );

            // Sites
            if (orgData) {
                const sites = [...new Set(RAW_DATA.assets.filter(a => a.client === org.name).map(a => a.site))];
                for (const siteName of sites) {
                    await safeInsert(
                        'locations',
                        { name: siteName, organization_id: orgData.organization_id },
                        { name: siteName, organization_id: orgData.organization_id, location_type: 'Site' }
                    );
                }
            }
        }

        // --- 3. CONTACTS, DEVICES & TICKETS ---
        console.log('3. Seeding Contacts, Devices & Tickets...');

        // Refresh Lookups
        const { data: orgsDB } = await supabase.from('organizations').select('*');
        const { data: modelsDB } = await supabase.from('device_models').select('*');
        const { data: osDB } = await supabase.from('operating_systems').select('*');

        for (const asset of RAW_DATA.assets) {
            const orgId = orgsDB.find(o => o.name === asset.client)?.organization_id;
            const modelId = modelsDB.find(m => m.name === asset.model)?.model_id;
            const osId = osDB.find(o => o.name === asset.os)?.os_id;

            if (!orgId) { console.log(`   ⚠️ Skipping ${asset.asset_name}: Org not found`); continue; }

            // Get Location
            const { data: loc } = await supabase.from('locations')
                .select('location_id')
                .eq('organization_id', orgId)
                .eq('name', asset.site)
                .single();

            // Create Contact
            const contact = await safeInsert(
                'contacts',
                { email: asset.user.email },
                { full_name: asset.user.name, email: asset.user.email, organization_id: orgId }
            );

            // Create Device
            const device = await safeInsert(
                'devices',
                { asset_name: asset.asset_name },
                {
                    asset_name: asset.asset_name,
                    status: asset.status,
                    organization_id: orgId,
                    location_id: loc?.location_id,
                    manufacturer_id: mfrDB.find(m => m.name === asset.manufacturer)?.manufacturer_id,
                    model_id: modelId,
                    os_id: osId
                }
            );

            // Link Contact <-> Device
            if (device && contact) {
                // Check link existence
                const { data: link } = await supabase.from('contact_devices')
                    .select('*')
                    .eq('contact_id', contact.contact_id)
                    .eq('device_id', device.device_id)
                    .single();

                if (!link) {
                    await supabase.from('contact_devices').insert({
                        contact_id: contact.contact_id,
                        device_id: device.device_id,
                        assigned_at: new Date().toISOString()
                    });
                }
            }

            // Create Tickets (Condition: Contact exists)
            if (contact && device && asset.user.name === 'Michael Engel') {
                console.log('   -> Creating Ticket for Michael...');
                const ticket = await safeInsert(
                    'support_tickets',
                    { subject: 'Surface Battery Draining', contact_id: contact.contact_id }, // Simple duplicate check
                    {
                        organization_id: orgId,
                        contact_id: contact.contact_id,
                        device_id: device.device_id,
                        subject: 'Surface Battery Draining',
                        description: 'My Surface Pro dies after 1 hour of use.',
                        status_id: 1, // Open
                        priority_id: 2 // Medium
                    }
                );

                if (ticket) {
                    // Just insert messages (no need to check duplicates for chat logs generally)
                    await supabase.from('ticket_messages').insert([
                        { ticket_id: ticket.ticket_id, sender_contact_id: contact.contact_id, content: 'It happens mostly when I am on Zoom.' },
                        { ticket_id: ticket.ticket_id, sender_agent_id: 1, content: 'I see your device is currently OFFLINE. Can you plug it in?' }
                    ]);
                }
            }

            if (contact && device && asset.user.name === 'Christina Murdock') {
                console.log('   -> Creating Ticket for Christina...');
                await safeInsert(
                    'support_tickets',
                    { subject: 'Cannot access Shared Drive', contact_id: contact.contact_id },
                    {
                        organization_id: orgId,
                        contact_id: contact.contact_id,
                        device_id: device.device_id,
                        subject: 'Cannot access Shared Drive',
                        description: 'I get a permission denied error on the S: drive.',
                        status_id: 2, // In Progress
                        priority_id: 3 // High
                    }
                );
            }
        }

        console.log('✅ Seed Complete!');
        console.log('   Login Emails: mengel@cdmetropoulos.com, cmurdock@summit.com, dhealey@urackit.com');

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

seed();