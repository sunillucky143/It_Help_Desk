/**
 * Comprehensive Test Data Seeder for IT Help Desk
 * 
 * IMPORTANT: Before running, update AUTH_USER_ID below with your Supabase user ID.
 * You can find this in Supabase Dashboard > Authentication > Users
 * 
 * Run with: node seed_test_data.js
 */

require('dotenv').config();
const { Client } = require('pg');

// ⚠️ UPDATE THIS with your Supabase auth user ID (from Authentication > Users in Supabase dashboard)
const AUTH_USER_ID = 'ee819720-d56e-45fc-a317-94a5c4d4f4b9';

async function seed() {
  // Uses DATABASE_URL from .env automatically, or falls back to individual PG* variables
  const client = new Client(process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
  } : undefined);
  
  try {
    await client.connect();
    console.log('✓ Connected to database\n');
    
    await client.query('BEGIN');

    // ============================================
    // 1. Create Lookup Data
    // ============================================
    console.log('Creating lookup data...');

    // Device Manufacturers
    const manufacturers = ['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft'];
    for (const name of manufacturers) {
      await client.query(`INSERT INTO device_manufacturers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
    }

    // Device Models
    const models = [
      { manufacturer: 'Dell', name: 'OptiPlex 7090' },
      { manufacturer: 'Dell', name: 'Latitude 5520' },
      { manufacturer: 'HP', name: 'EliteDesk 800 G6' },
      { manufacturer: 'Lenovo', name: 'ThinkPad X1 Carbon' },
      { manufacturer: 'Apple', name: 'MacBook Pro 14"' },
      { manufacturer: 'Microsoft', name: 'Surface Pro 9' },
    ];
    for (const m of models) {
      const mfr = await client.query(`SELECT manufacturer_id FROM device_manufacturers WHERE name = $1`, [m.manufacturer]);
      if (mfr.rows[0]) {
        await client.query(`INSERT INTO device_models (manufacturer_id, name) VALUES ($1, $2) ON CONFLICT (manufacturer_id, name) DO NOTHING`, [mfr.rows[0].manufacturer_id, m.name]);
      }
    }

    // Operating Systems
    const osList = ['Windows 11 Pro', 'Windows 10 Enterprise', 'macOS Sonoma', 'Ubuntu 22.04 LTS'];
    for (const name of osList) {
      await client.query(`INSERT INTO operating_systems (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
    }

    // Domains
    const domains = ['corp.techflow.com', 'hq.techflow.com', 'dev.techflow.com'];
    for (const name of domains) {
      await client.query(`INSERT INTO domains (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
    }

    // Device Types
    const deviceTypes = ['Desktop', 'Laptop', 'Workstation', 'Server', 'Tablet'];
    for (const name of deviceTypes) {
      await client.query(`INSERT INTO device_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
    }

    // Update Statuses
    const updateStatuses = ['Up to date', 'Updates available', 'Update failed', 'Pending restart'];
    for (const name of updateStatuses) {
      await client.query(`INSERT INTO update_statuses (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
    }

    // Processors
    const processors = [
      { manufacturer: 'Intel', model: 'Core i7-12700' },
      { manufacturer: 'Intel', model: 'Core i9-13900K' },
      { manufacturer: 'AMD', model: 'Ryzen 7 5800X' },
      { manufacturer: 'Apple', model: 'M2 Pro' },
    ];
    for (const p of processors) {
      await client.query(`INSERT INTO processor_models (manufacturer, model) VALUES ($1, $2) ON CONFLICT (manufacturer, model) DO NOTHING`, [p.manufacturer, p.model]);
    }

    // Processor Architectures
    await client.query(`INSERT INTO processor_architectures (name) VALUES ('x86_64') ON CONFLICT (name) DO NOTHING`);
    await client.query(`INSERT INTO processor_architectures (name) VALUES ('ARM64') ON CONFLICT (name) DO NOTHING`);

    console.log('✓ Lookup data created\n');

    // ============================================
    // 2. Create Organizations
    // ============================================
    console.log('Creating organizations...');

    const orgs = [
      { name: 'TechFlow Industries', code: 10001 },
      { name: 'DataCore Solutions', code: 10002 },
      { name: 'CloudNine Systems', code: 10003 },
    ];

    const orgIds = {};
    for (const org of orgs) {
      const res = await client.query(
        `INSERT INTO organizations (name, u_e_code, created_at, updated_at) 
         VALUES ($1, $2, now(), now()) 
         ON CONFLICT (u_e_code) DO UPDATE SET name = EXCLUDED.name 
         RETURNING organization_id`,
        [org.name, org.code]
      );
      orgIds[org.name] = res.rows[0].organization_id;
    }
    console.log('✓ Organizations created\n');

    // ============================================
    // 3. Create Locations
    // ============================================
    console.log('Creating locations...');

    const locations = [
      { org: 'TechFlow Industries', name: 'HQ - San Francisco', type: 'Headquarters', requiresHuman: false },
      { org: 'TechFlow Industries', name: 'Data Center - Phoenix', type: 'Data Center', requiresHuman: true },
      { org: 'TechFlow Industries', name: 'Remote Workers', type: 'Remote', requiresHuman: false },
      { org: 'DataCore Solutions', name: 'Main Office - Austin', type: 'Headquarters', requiresHuman: false },
      { org: 'CloudNine Systems', name: 'Cloud Ops Center', type: 'Support', requiresHuman: true },
    ];

    const locationIds = {};
    for (const loc of locations) {
      const res = await client.query(
        `INSERT INTO locations (organization_id, name, location_type, requires_human_agent, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         ON CONFLICT DO NOTHING
         RETURNING location_id`,
        [orgIds[loc.org], loc.name, loc.type, loc.requiresHuman]
      );
      if (res.rows[0]) {
        locationIds[loc.name] = res.rows[0].location_id;
      } else {
        const existing = await client.query(`SELECT location_id FROM locations WHERE name = $1`, [loc.name]);
        locationIds[loc.name] = existing.rows[0]?.location_id;
      }
    }
    console.log('✓ Locations created\n');

    // ============================================
    // 4. Create Contacts
    // ============================================
    console.log('Creating contacts...');

    const contacts = [
      { org: 'TechFlow Industries', name: 'Sarah Chen', email: 'sarah.chen@techflow.com', phone: '+1-415-555-0101' },
      { org: 'TechFlow Industries', name: 'Mike Rodriguez', email: 'mike.r@techflow.com', phone: '+1-415-555-0102' },
      { org: 'TechFlow Industries', name: 'Emily Watson', email: 'emily.w@techflow.com', phone: '+1-602-555-0103' },
      { org: 'DataCore Solutions', name: 'James Park', email: 'james.park@datacore.io', phone: '+1-512-555-0201' },
      { org: 'CloudNine Systems', name: 'Lisa Thompson', email: 'lisa.t@cloudnine.net', phone: '+1-206-555-0301' },
    ];

    const contactIds = {};
    for (const c of contacts) {
      const res = await client.query(
        `INSERT INTO contacts (organization_id, full_name, email, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         ON CONFLICT (organization_id, email) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING contact_id`,
        [orgIds[c.org], c.name, c.email, c.phone]
      );
      contactIds[c.email] = res.rows[0].contact_id;
    }
    console.log('✓ Contacts created\n');

    // ============================================
    // 5. Create Devices
    // ============================================
    console.log('Creating devices...');

    // Helper function to get random ID
    const getIdByName = async (table, column, name) => {
      const res = await client.query(`SELECT * FROM ${table} WHERE ${column} = $1 LIMIT 1`, [name]);
      return res.rows[0];
    };

    const devices = [
      {
        org: 'TechFlow Industries', location: 'HQ - San Francisco', asset: 'TF-WS-001',
        status: 'ONLINE', manufacturer: 'Dell', model: 'OptiPlex 7090', hostname: 'TF-SARAH-PC',
        publicIp: '203.0.113.10', gateway: '203.0.113.1', os: 'Windows 11 Pro', osVersion: '23H2',
        domain: 'corp.techflow.com', uptime: '5 days 3:24:00', lastUser: 'sarah.chen',
        deviceType: 'Desktop', lastReport: new Date(), updateStatus: 'Up to date',
        processor: 'Core i7-12700', memory: 34359738368 // 32GB
      },
      {
        org: 'TechFlow Industries', location: 'HQ - San Francisco', asset: 'TF-LT-042',
        status: 'ONLINE', manufacturer: 'Lenovo', model: 'ThinkPad X1 Carbon', hostname: 'TF-MIKE-LT',
        publicIp: '203.0.113.11', gateway: '203.0.113.1', os: 'Windows 10 Enterprise', osVersion: '22H2',
        domain: 'corp.techflow.com', uptime: '2 days 14:45:00', lastUser: 'mike.rodriguez',
        deviceType: 'Laptop', lastReport: new Date(Date.now() - 2 * 60 * 60 * 1000), updateStatus: 'Updates available',
        processor: 'Core i7-12700', memory: 17179869184 // 16GB
      },
      {
        org: 'TechFlow Industries', location: 'Data Center - Phoenix', asset: 'TF-DC-SRV-01',
        status: 'ONLINE', manufacturer: 'Dell', model: 'OptiPlex 7090', hostname: 'TF-DC-PRIMARY',
        publicIp: '198.51.100.50', gateway: '198.51.100.1', os: 'Windows 11 Pro', osVersion: '23H2',
        domain: 'hq.techflow.com', uptime: '45 days 12:00:00', lastUser: 'admin',
        deviceType: 'Server', lastReport: new Date(), updateStatus: 'Pending restart',
        processor: 'Core i9-13900K', memory: 68719476736 // 64GB
      },
      {
        org: 'TechFlow Industries', location: 'Remote Workers', asset: 'TF-RMT-089',
        status: 'OFFLINE', manufacturer: 'Apple', model: 'MacBook Pro 14"', hostname: 'TF-EMILY-MAC',
        publicIp: '192.0.2.100', gateway: '192.0.2.1', os: 'macOS Sonoma', osVersion: '14.2',
        domain: null, uptime: '0 days 0:00:00', lastUser: 'emily.watson',
        deviceType: 'Laptop', lastReport: new Date(Date.now() - 48 * 60 * 60 * 1000), updateStatus: 'Update failed', // 48 hours ago - STALE
        processor: 'M2 Pro', memory: 17179869184 // 16GB
      },
      {
        org: 'DataCore Solutions', location: 'Main Office - Austin', asset: 'DC-WS-007',
        status: 'ONLINE', manufacturer: 'HP', model: 'EliteDesk 800 G6', hostname: 'DC-JAMES-PC',
        publicIp: '203.0.113.50', gateway: '203.0.113.1', os: 'Windows 11 Pro', osVersion: '23H2',
        domain: 'corp.techflow.com', uptime: '12 days 8:30:00', lastUser: 'james.park',
        deviceType: 'Desktop', lastReport: new Date(), updateStatus: 'Up to date',
        processor: 'Ryzen 7 5800X', memory: 34359738368 // 32GB
      },
    ];

    const deviceIds = {};
    for (const d of devices) {
      const mfr = await getIdByName('device_manufacturers', 'name', d.manufacturer);
      const model = await client.query(`SELECT model_id FROM device_models WHERE manufacturer_id = $1 AND name = $2`, [mfr?.manufacturer_id, d.model]);
      const os = await getIdByName('operating_systems', 'name', d.os);
      const domain = d.domain ? await getIdByName('domains', 'name', d.domain) : null;
      const deviceType = await getIdByName('device_types', 'name', d.deviceType);
      const updateStatus = await getIdByName('update_statuses', 'name', d.updateStatus);
      const processor = await client.query(`SELECT processor_id FROM processor_models WHERE model = $1`, [d.processor]);
      const arch = d.processor === 'M2 Pro' 
        ? await getIdByName('processor_architectures', 'name', 'ARM64')
        : await getIdByName('processor_architectures', 'name', 'x86_64');

      const res = await client.query(
        `INSERT INTO devices (organization_id, location_id, asset_name, status, manufacturer_id, model_id, 
         host_name, public_ip, gateway, os_id, domain_id, os_version, system_uptime, last_logged_in_by,
         device_type_id, last_reported_time, update_status_id, processor_id, architecture_id, total_memory,
         created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, now(), now())
         RETURNING device_id`,
        [
          orgIds[d.org], locationIds[d.location], d.asset, d.status,
          mfr?.manufacturer_id, model.rows[0]?.model_id, d.hostname, d.publicIp, d.gateway,
          os?.os_id, domain?.domain_id, d.osVersion, d.uptime, d.lastUser,
          deviceType?.device_type_id, d.lastReport, updateStatus?.update_status_id,
          processor.rows[0]?.processor_id, arch?.architecture_id, d.memory
        ]
      );
      deviceIds[d.asset] = res.rows[0].device_id;
    }
    console.log('✓ Devices created\n');

    // ============================================
    // 6. Create Support Agents
    // ============================================
    console.log('Creating support agents...');

    // Bot agent
    await client.query(
      `INSERT INTO support_agents (full_name, email, agent_type, specialization, is_available, created_at, updated_at)
       VALUES ('IT Support Bot', 'bot@techflow.com', 'Bot', 'General Support', true, now(), now())
       ON CONFLICT DO NOTHING`
    );
    const botAgent = await client.query(`SELECT support_agent_id FROM support_agents WHERE agent_type = 'Bot' LIMIT 1`);
    const botAgentId = botAgent.rows[0]?.support_agent_id;

    // Human agents - The primary agent linked to your Supabase user
    let primaryAgentId;
    
    // First check if an agent with this auth_user_id already exists
    const agentByAuth = await client.query(
      `SELECT support_agent_id FROM support_agents WHERE auth_user_id = $1`,
      [AUTH_USER_ID]
    );

    if (agentByAuth.rows[0]) {
      // Use existing agent linked to this auth user
      primaryAgentId = agentByAuth.rows[0].support_agent_id;
      console.log(`  Found existing agent by auth_user_id: ${primaryAgentId}`);
    } else {
      // Check if agent exists by email
      const agentByEmail = await client.query(
        `SELECT support_agent_id FROM support_agents WHERE email = $1`,
        ['alex.johnson@techflow.com']
      );

      if (agentByEmail.rows[0]) {
        primaryAgentId = agentByEmail.rows[0].support_agent_id;
        // Update with auth_user_id
        await client.query(
          `UPDATE support_agents SET auth_user_id = $1 WHERE support_agent_id = $2`,
          [AUTH_USER_ID, primaryAgentId]
        );
        console.log(`  Updated existing agent with auth_user_id: ${primaryAgentId}`);
      } else {
        // Create new agent
        const agentRes = await client.query(
          `INSERT INTO support_agents (full_name, email, phone, agent_type, specialization, is_available, auth_user_id, created_at, updated_at)
           VALUES ($1, $2, $3, 'Human', $4, true, $5, now(), now()) RETURNING support_agent_id`,
          ['Alex Johnson', 'alex.johnson@techflow.com', '+1-415-555-9001', 'Windows & Network', AUTH_USER_ID]
        );
        primaryAgentId = agentRes.rows[0].support_agent_id;
        console.log(`  Created new agent: ${primaryAgentId}`);
      }
    }

    if (!primaryAgentId) {
      throw new Error('Failed to create or find primary agent');
    }

    // Additional human agents for escalation
    const otherAgents = [
      { name: 'Maria Garcia', email: 'maria.garcia@techflow.com', specialization: 'macOS & Apple' },
      { name: 'David Kim', email: 'david.kim@techflow.com', specialization: 'Server & Infrastructure' },
      { name: 'Rachel Green', email: 'rachel.green@techflow.com', specialization: 'Security & Compliance' },
    ];

    for (const a of otherAgents) {
      await client.query(
        `INSERT INTO support_agents (full_name, email, agent_type, specialization, is_available, created_at, updated_at)
         VALUES ($1, $2, 'Human', $3, true, now(), now())
         ON CONFLICT DO NOTHING`,
        [a.name, a.email, a.specialization]
      );
    }
    console.log('✓ Support agents created\n');

    // ============================================
    // 7. Create Support Tickets
    // ============================================
    console.log('Creating support tickets...');

    const tickets = [
      {
        org: 'TechFlow Industries', contact: 'sarah.chen@techflow.com', device: 'TF-WS-001',
        location: 'HQ - San Francisco', subject: 'Cannot connect to VPN',
        description: 'Getting error "Connection timed out" when trying to connect to corporate VPN from home.',
        status: 'In Progress', priority: 'High', requiresHuman: false,
        isPrimary: true
      },
      {
        org: 'TechFlow Industries', contact: 'mike.r@techflow.com', device: 'TF-LT-042',
        location: 'HQ - San Francisco', subject: 'Outlook keeps crashing',
        description: 'Microsoft Outlook crashes every time I try to open attachments larger than 5MB.',
        status: 'Open', priority: 'Medium', requiresHuman: false,
        isPrimary: true
      },
      {
        org: 'TechFlow Industries', contact: 'emily.w@techflow.com', device: 'TF-RMT-089',
        location: 'Remote Workers', subject: 'MacBook not receiving updates',
        description: 'System updates have been failing for the past week. Error: "An error occurred while installing updates"',
        status: 'Escalated', priority: 'High', requiresHuman: false,
        isPrimary: false // Secondary assignment
      },
      {
        org: 'TechFlow Industries', contact: 'emily.w@techflow.com', device: 'TF-DC-SRV-01',
        location: 'Data Center - Phoenix', subject: 'Critical: Server pending restart for 45 days',
        description: 'Production server has pending security updates requiring restart. Need to schedule maintenance window.',
        status: 'Open', priority: 'Critical', requiresHuman: true, // High compliance
        isPrimary: true
      },
      {
        org: 'DataCore Solutions', contact: 'james.park@datacore.io', device: 'DC-WS-007',
        location: 'Main Office - Austin', subject: 'Request for additional monitor',
        description: 'Requesting a second monitor for my workstation for improved productivity.',
        status: 'Awaiting Customer', priority: 'Low', requiresHuman: false,
        isPrimary: true
      },
    ];

    const ticketIds = [];
    for (const t of tickets) {
      const statusRes = await client.query(`SELECT status_id FROM ticket_statuses WHERE name = $1`, [t.status]);
      const priorityRes = await client.query(`SELECT priority_id FROM ticket_priorities WHERE name = $1`, [t.priority]);

      const res = await client.query(
        `INSERT INTO support_tickets (organization_id, contact_id, device_id, location_id, subject, description,
         status_id, priority_id, requires_human_agent, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now() - interval '${Math.floor(Math.random() * 48)} hours', now())
         RETURNING ticket_id`,
        [
          orgIds[t.org], contactIds[t.contact], deviceIds[t.device], locationIds[t.location],
          t.subject, t.description, statusRes.rows[0]?.status_id, priorityRes.rows[0]?.priority_id,
          t.requiresHuman
        ]
      );
      
      const ticketId = res.rows[0].ticket_id;
      ticketIds.push({ id: ticketId, ...t });

      // Create assignment
      await client.query(
        `INSERT INTO ticket_assignments (ticket_id, support_agent_id, assignment_start, is_primary)
         VALUES ($1, $2, now(), $3)`,
        [ticketId, primaryAgentId, t.isPrimary]
      );
    }
    console.log('✓ Support tickets created\n');

    // ============================================
    // 8. Create Messages (including bot handoff scenario)
    // ============================================
    console.log('Creating ticket messages...');

    // Ticket 1: VPN issue - bot tried first, then human
    const vpnTicket = ticketIds.find(t => t.subject.includes('VPN'));
    if (vpnTicket && botAgentId) {
      // Bot messages
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_agent_id, message_time, content, message_type, is_internal)
         VALUES ($1, $2, now() - interval '2 hours', $3, 'text', false)`,
        [vpnTicket.id, botAgentId, 'Hello! I\'m the IT Support Bot. I understand you\'re having VPN connection issues. Let me help you troubleshoot.']
      );
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_contact_id, message_time, content, message_type, is_internal)
         VALUES ($1, $2, now() - interval '1 hour 55 minutes', $3, 'text', false)`,
        [vpnTicket.id, contactIds['sarah.chen@techflow.com'], 'Yes, I keep getting "Connection timed out" error']
      );
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_agent_id, message_time, content, message_type, is_internal)
         VALUES ($1, $2, now() - interval '1 hour 50 minutes', $3, 'text', false)`,
        [vpnTicket.id, botAgentId, 'I\'ve checked your connection logs. It seems your VPN client may need to be updated. Have you tried: 1) Restarting the VPN client 2) Checking your internet connection 3) Disabling any firewall temporarily?']
      );
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_contact_id, message_time, content, message_type, is_internal)
         VALUES ($1, $2, now() - interval '1 hour 45 minutes', $3, 'text', false)`,
        [vpnTicket.id, contactIds['sarah.chen@techflow.com'], 'I tried all of those but still no luck. Can I speak to a human agent?']
      );
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_agent_id, message_time, content, message_type, is_internal)
         VALUES ($1, $2, now() - interval '1 hour 40 minutes', $3, 'text', false)`,
        [vpnTicket.id, botAgentId, 'Of course! I\'m transferring you to a human agent who can help further. Please hold.']
      );
      // Human agent takes over
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_agent_id, message_time, content, message_type, is_internal)
         VALUES ($1, $2, now() - interval '1 hour', $3, 'text', false)`,
        [vpnTicket.id, primaryAgentId, 'Hi Sarah, this is Alex from IT Support. I\'ve reviewed the bot\'s troubleshooting steps. Let me check your VPN configuration on our end.']
      );
      // Internal note
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_agent_id, message_time, content, message_type, is_internal)
         VALUES ($1, $2, now() - interval '55 minutes', $3, 'text', true)`,
        [vpnTicket.id, primaryAgentId, 'Checked VPN server logs - user\'s certificate expired yesterday. Need to issue new certificate.']
      );
    }

    // Ticket 4: Critical server issue
    const serverTicket = ticketIds.find(t => t.subject.includes('Critical'));
    if (serverTicket) {
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_contact_id, message_time, content, message_type, is_internal)
         VALUES ($1, $2, now() - interval '3 hours', $3, 'text', false)`,
        [serverTicket.id, contactIds['emily.w@techflow.com'], 'This server has been pending restart for security updates for 45 days now. We need to schedule a maintenance window ASAP.']
      );
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_agent_id, message_time, content, message_type, is_internal)
         VALUES ($1, $2, now() - interval '2 hours 30 minutes', $3, 'text', true)`,
        [serverTicket.id, primaryAgentId, 'HIGH COMPLIANCE ALERT: This is a data center device requiring special handling. Need manager approval for maintenance window.']
      );
    }

    // Add some messages to other tickets
    const outlookTicket = ticketIds.find(t => t.subject.includes('Outlook'));
    if (outlookTicket && botAgentId) {
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_agent_id, message_time, content, message_type, is_internal)
         VALUES ($1, $2, now() - interval '30 minutes', $3, 'text', false)`,
        [outlookTicket.id, botAgentId, 'Hello! I see you\'re having issues with Outlook crashing. This is often related to add-ins or corrupted cache. Would you like me to guide you through some troubleshooting steps?']
      );
    }

    console.log('✓ Messages created\n');

    await client.query('COMMIT');
    
    console.log('═══════════════════════════════════════════');
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════\n');
    console.log('Created:');
    console.log(`  • ${orgs.length} organizations`);
    console.log(`  • ${locations.length} locations`);
    console.log(`  • ${contacts.length} contacts`);
    console.log(`  • ${devices.length} devices`);
    console.log(`  • ${ticketIds.length} tickets`);
    console.log(`  • Multiple messages with bot handoff scenarios\n`);
    
    if (AUTH_USER_ID === 'YOUR_SUPABASE_USER_ID_HERE') {
      console.log('⚠️  WARNING: You need to update AUTH_USER_ID in this script!');
      console.log('   Get your user ID from Supabase Dashboard > Authentication > Users');
      console.log('   Then run this script again.\n');
    } else {
      console.log(`✓ Agent "Alex Johnson" linked to auth user: ${AUTH_USER_ID}`);
      console.log('  You should now see tickets in your inbox after signing in.\n');
    }

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message || err);
    console.error(err.stack);
    try { await client.query('ROLLBACK'); } catch (e) {}
  } finally {
    await client.end();
  }
}

seed();

