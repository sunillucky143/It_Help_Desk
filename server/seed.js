
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log('🌱 Starting seed...');

    try {
        // 1. Reference Data
        console.log('Inserting Reference Data...');

        // Manufacturers
        const manufacturers = ['Apple', 'Dell', 'Lenovo', 'Samsung'];
        for (const name of manufacturers) {
            await supabase.from('device_manufacturers').upsert({ name }, { onConflict: 'name' });
        }

        // OS
        const osList = ['macOS Sequoia', 'Windows 11', 'iOS 18', 'Ubuntu 24.04'];
        for (const name of osList) {
            await supabase.from('operating_systems').upsert({ name }, { onConflict: 'name' });
        }

        // Device Types
        const types = ['Laptop', 'Desktop', 'Smartphone', 'Tablet'];
        for (const name of types) {
            await supabase.from('device_types').upsert({ name }, { onConflict: 'name' });
        }

        // Fetch Manufacturer IDs
        const { data: mfrs, error: mfrErr } = await supabase.from('device_manufacturers').select('*');
        if (mfrErr) throw mfrErr;
        if (!mfrs) throw new Error("No manufacturers returned");

        const appleId = mfrs.find(m => m.name === 'Apple')?.manufacturer_id;
        const dellId = mfrs.find(m => m.name === 'Dell')?.manufacturer_id;

        if (!appleId || !dellId) throw new Error("Missing manufacturer IDs");

        // Insert Models
        const models = [
            { name: 'MacBook Pro 16"', manufacturer_id: appleId },
            { name: 'iPhone 15 Pro', manufacturer_id: appleId },
            { name: 'XPS 15', manufacturer_id: dellId }
        ];

        for (const model of models) {
            const { error } = await supabase.from('device_models').upsert(model, { onConflict: 'manufacturer_id,name' });
            if (error) console.error('Error inserting model:', error.message);
        }

        // Fetch IDs for Models and OS (Needed for Devices)
        const { data: mfrModels } = await supabase.from('device_models').select('model_id, name');
        const mbpId = mfrModels.find(m => m.name === 'MacBook Pro 16"').model_id;
        const iphoneId = mfrModels.find(m => m.name === 'iPhone 15 Pro').model_id;
        const xpsId = mfrModels.find(m => m.name === 'XPS 15').model_id;

        const { data: osData } = await supabase.from('operating_systems').select('os_id, name');
        const macOsId = osData.find(m => m.name === 'macOS Sequoia').os_id;
        const iosId = osData.find(m => m.name === 'iOS 18').os_id;

        // 2. Organization & Location
        console.log('Inserting Org & Location...');
        const { data: org, error: orgErr } = await supabase.from('organizations')
            .upsert({ name: 'Acme Corp', u_e_code: 1001 }, { onConflict: 'u_e_code' })
            .select().single();
        if (orgErr) throw orgErr;

        let locationId;
        const { data: existingLoc } = await supabase.from('locations').select('location_id').eq('name', 'Headquarters').eq('organization_id', org.organization_id).single();
        if (existingLoc) {
            locationId = existingLoc.location_id;
        } else {
            const { data: newLoc } = await supabase.from('locations').insert({ organization_id: org.organization_id, name: 'Headquarters', location_type: 'Headquarters' }).select().single();
            locationId = newLoc.location_id;
        }

        const password = 'password123';

        // 3. Users: Alice
        console.log('Creating User "alice@example.com" ...');
        const aliceEmail = 'alice@example.com';
        try {
            await supabase.auth.admin.createUser({ email: aliceEmail, password, email_confirm: true });
        } catch (e) { /* ignore existing */ }

        const { data: aliceContact } = await supabase.from('contacts').upsert({
            organization_id: org.organization_id, full_name: 'Alice User', email: aliceEmail, phone: '555-0100'
        }, { onConflict: 'organization_id,email' }).select().single();

        // 4. Users: Bob (Same Org)
        console.log('Creating User "bob@example.com" ...');
        const bobEmail = 'bob@example.com';
        try {
            await supabase.auth.admin.createUser({ email: bobEmail, password, email_confirm: true });
        } catch (e) { /* ignore existing */ }

        await supabase.from('contacts').upsert({
            organization_id: org.organization_id, full_name: 'Bob NoDevice', email: bobEmail
        }, { onConflict: 'organization_id,email' });

        // 5. Users: Charlie (Different Org)
        console.log('Creating User "charlie@other.com" ...');
        const { data: org2 } = await supabase.from('organizations').upsert({ name: 'Other Corp', u_e_code: 2002 }, { onConflict: 'u_e_code' }).select().single();
        const charlieEmail = 'charlie@other.com';
        try {
            await supabase.auth.admin.createUser({ email: charlieEmail, password, email_confirm: true });
        } catch (e) { /* ignore existing */ }

        const { data: charlieContact } = await supabase.from('contacts').upsert({
            organization_id: org2.organization_id, full_name: 'Charlie Outsider', email: charlieEmail
        }, { onConflict: 'organization_id,email' }).select().single();

        // 6. Devices
        console.log('Creating Devices...');

        // dev1: Alice MBP
        const { data: dev1 } = await supabase.from('devices').insert({
            organization_id: org.organization_id,
            location_id: locationId,
            asset_name: 'ALICE-MBP',
            status: 'ONLINE',
            manufacturer_id: appleId,
            model_id: mbpId,
            os_id: macOsId,
            os_version: '14.2',
            total_memory: 17179869184
        }).select().single();

        await supabase.from('contact_devices').insert({ contact_id: aliceContact.contact_id, device_id: dev1.device_id, assigned_at: new Date().toISOString() });

        // dev2: Alice Old Phone
        const { data: dev2 } = await supabase.from('devices').insert({
            organization_id: org.organization_id,
            location_id: locationId,
            asset_name: 'ALICE-IPHONE-OLD',
            status: 'OFFLINE',
            manufacturer_id: appleId,
            model_id: iphoneId,
            os_id: iosId,
            os_version: '17.0'
        }).select().single();

        await supabase.from('contact_devices').insert({
            contact_id: aliceContact.contact_id, device_id: dev2.device_id,
            assigned_at: new Date(Date.now() - 31536000000).toISOString(),
            unassigned_at: new Date(Date.now() - 2592000000).toISOString()
        });

        // dev3: Charlie Dell
        const { data: dev3 } = await supabase.from('devices').insert({
            organization_id: org2.organization_id,
            location_id: locationId,
            asset_name: 'CHARLIE-DELL',
            status: 'ONLINE',
            manufacturer_id: dellId,
            model_id: xpsId,
            os_id: macOsId,
            os_version: '12.0'
        }).select().single();

        await supabase.from('contact_devices').insert({ contact_id: charlieContact.contact_id, device_id: dev3.device_id });

        // 7. Agents
        console.log('Creating Agents...');
        const { data: botAgent } = await supabase.from('support_agents').insert({
            full_name: 'Support Bot', email: 'bot@system.com', agent_type: 'Bot', is_available: true
        }).select().single();

        const { data: humanAgent } = await supabase.from('support_agents').insert({
            full_name: 'Sarah Agent', email: 'sarah@support.com', agent_type: 'Human', specialization: 'Hardware', is_available: true
        }).select().single();

        // 8. Tickets
        console.log('Creating Tickets...');

        // Ticket 1: Closed (Alice)
        await supabase.from('support_tickets').insert({
            organization_id: org.organization_id, contact_id: aliceContact.contact_id, device_id: dev2.device_id, location_id: locationId,
            subject: 'Phone Battery Issue', description: 'Battery draining very fast.', status_id: 5, priority_id: 2,
            created_at: new Date(Date.now() - 3456000000).toISOString(), closed_at: new Date(Date.now() - 2592000000).toISOString()
        });

        // Ticket 2: Active (Alice)
        const { data: t2 } = await supabase.from('support_tickets').insert({
            organization_id: org.organization_id, contact_id: aliceContact.contact_id, device_id: dev1.device_id, location_id: locationId,
            subject: 'Screen Flickering', description: 'My screen flickers.', status_id: 2, priority_id: 2,
            created_at: new Date().toISOString()
        }).select().single();

        // Ticket 3: Charlie
        await supabase.from('support_tickets').insert({
            organization_id: org2.organization_id, contact_id: charlieContact.contact_id, device_id: dev3.device_id,
            subject: 'VPN Issues', description: 'Can only access internal sites.', status_id: 1, priority_id: 3
        });

        // Messages for T2
        await supabase.from('ticket_messages').insert([
            { ticket_id: t2.ticket_id, sender_contact_id: aliceContact.contact_id, content: 'Hi, facing this since yesterday.', message_time: new Date(Date.now() - 3600000).toISOString() },
            { ticket_id: t2.ticket_id, sender_agent_id: botAgent.support_agent_id, content: 'Ticket logged.', message_time: new Date(Date.now() - 3540000).toISOString() },
            { ticket_id: t2.ticket_id, sender_agent_id: humanAgent.support_agent_id, content: 'Hi Alice, try restarting?', message_time: new Date(Date.now() - 600000).toISOString() }
        ]);

        console.log('✅ Seed complete!');

    } catch (err) {
        console.error('Seed failed:', err);
    }
}

main();
