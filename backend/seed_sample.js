const { Client } = require('pg');

function buildClientConfig() {
  return {
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: String(process.env.PGPASSWORD || ''),
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    database: process.env.PGDATABASE || 'IT_Ticket'
  };
}

async function seed() {
  const client = new Client(buildClientConfig());
  try {
    await client.connect();
    await client.query('BEGIN');

    // Ensure an organization
    const orgRes = await client.query(
      `INSERT INTO organizations (name, u_e_code, created_at, updated_at) VALUES ($1, $2, now(), now()) ON CONFLICT (u_e_code) DO UPDATE SET name = EXCLUDED.name RETURNING organization_id`,
      ['SeedOrg', 99999]
    );
    const orgId = orgRes.rows[0].organization_id;

    // Ensure a contact
    const contactRes = await client.query(
      `INSERT INTO contacts (organization_id, full_name, email, created_at, updated_at) VALUES ($1, $2, $3, now(), now()) ON CONFLICT (organization_id, email) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING contact_id`,
      [orgId, 'Seed User', 'seeduser@example.com']
    );
    const contactId = contactRes.rows[0].contact_id;

    // Ensure a location exists for this organization (devices.location_id is NOT NULL)
    const locRes = await client.query(`SELECT location_id FROM locations WHERE organization_id = $1 LIMIT 1`, [orgId]);
    let locationId;
    if (locRes.rowCount > 0) {
      locationId = locRes.rows[0].location_id;
    } else {
      const insLoc = await client.query(`INSERT INTO locations (organization_id, name, location_type, created_at, updated_at) VALUES ($1, $2, 'Other', now(), now()) RETURNING location_id`, [orgId, 'Default Location']);
      locationId = insLoc.rows[0].location_id;
    }

    // Create some lookup values and a richer device record
    await client.query(`INSERT INTO device_manufacturers (name) VALUES ('AcmeCorp') ON CONFLICT (name) DO NOTHING`);
    const manufacturerId = (await client.query(`SELECT manufacturer_id FROM device_manufacturers WHERE name='AcmeCorp'`)).rows[0].manufacturer_id;
    await client.query(`INSERT INTO device_models (manufacturer_id, name) VALUES ($1,$2) ON CONFLICT (manufacturer_id, name) DO NOTHING`, [manufacturerId, 'AcmeModelX']);
    const modelId = (await client.query(`SELECT model_id FROM device_models WHERE manufacturer_id=$1 AND name=$2`, [manufacturerId, 'AcmeModelX'])).rows[0].model_id;

    await client.query(`INSERT INTO operating_systems (name) VALUES ('AcmeOS 1.0') ON CONFLICT (name) DO NOTHING`);
    const osId = (await client.query(`SELECT os_id FROM operating_systems WHERE name='AcmeOS 1.0'`)).rows[0].os_id;

    await client.query(`INSERT INTO domains (name) VALUES ('corp.example.com') ON CONFLICT (name) DO NOTHING`);
    const domainId = (await client.query(`SELECT domain_id FROM domains WHERE name='corp.example.com'`)).rows[0].domain_id;

    await client.query(`INSERT INTO device_types (name) VALUES ('Workstation') ON CONFLICT (name) DO NOTHING`);
    const deviceTypeId = (await client.query(`SELECT device_type_id FROM device_types WHERE name='Workstation'`)).rows[0].device_type_id;

    await client.query(`INSERT INTO update_statuses (name) VALUES ('Up to date') ON CONFLICT (name) DO NOTHING`);
    const updateStatusId = (await client.query(`SELECT update_status_id FROM update_statuses WHERE name='Up to date'`)).rows[0].update_status_id;

    await client.query(`INSERT INTO processor_models (manufacturer, model) VALUES ('Intel','i9-9900K') ON CONFLICT (manufacturer, model) DO NOTHING`);
    const processorId = (await client.query(`SELECT processor_id FROM processor_models WHERE manufacturer='Intel' AND model='i9-9900K'`)).rows[0].processor_id;

    await client.query(`INSERT INTO processor_architectures (name) VALUES ('x86_64') ON CONFLICT (name) DO NOTHING`);
    const archId = (await client.query(`SELECT architecture_id FROM processor_architectures WHERE name='x86_64'`)).rows[0].architecture_id;

    // Insert a device with telemetry fields populated
    const deviceRes = await client.query(
      `INSERT INTO devices (organization_id, location_id, asset_name, status, manufacturer_id, model_id, host_name, public_ip, gateway, os_id, domain_id, os_version, system_uptime, last_logged_in_by, device_type_id, last_reported_time, update_status_id, processor_id, architecture_id, total_memory, created_at, updated_at)
       VALUES ($1,$2,$3,'ONLINE',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,now(),now()) RETURNING device_id`,
      [orgId, locationId, 'SeedDevice', manufacturerId, modelId, 'seed-host', '203.0.113.5', '203.0.113.1', osId, domainId, '1.0.7', '3 days', 'seeduser', deviceTypeId, new Date().toISOString(), updateStatusId, processorId, archId, 17179869184]
    );
    const deviceId = deviceRes.rows[0].device_id;

    // Insert a ticket status and priority if missing
    await client.query(`INSERT INTO ticket_statuses (name) VALUES ('Open') ON CONFLICT (name) DO NOTHING`);
    await client.query(`INSERT INTO ticket_priorities (name) VALUES ('Critical') ON CONFLICT (name) DO NOTHING`);

    // Insert a ticket
    const ticketRes = await client.query(
      `INSERT INTO support_tickets (organization_id, contact_id, device_id, subject, description, status_id, priority_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, (SELECT status_id FROM ticket_statuses WHERE name='Open' LIMIT 1), (SELECT priority_id FROM ticket_priorities WHERE name='Critical' LIMIT 1), now(), now()) RETURNING ticket_id`,
      [orgId, contactId, deviceId, 'Sample critical issue', 'This is a seeded ticket for UI testing.']
    );
    const ticketId = ticketRes.rows[0].ticket_id;

    // Ensure a support agent exists (create seed agent if missing)
    const agentRes = await client.query(`SELECT support_agent_id FROM support_agents WHERE email = $1 LIMIT 1`, ['seed.agent@example.com']);
    let agentId;
    if (agentRes.rowCount > 0) {
      agentId = agentRes.rows[0].support_agent_id;
    } else {
      const insAgent = await client.query(`INSERT INTO support_agents (full_name, email, agent_type, is_available, created_at, updated_at) VALUES ($1, $2, $3, true, now(), now()) RETURNING support_agent_id`, ['Seed Agent', 'seed.agent@example.com', 'Human']);
      agentId = insAgent.rows[0].support_agent_id;
    }

    // Assign to the seed agent as primary
    await client.query(
      `INSERT INTO ticket_assignments (ticket_id, support_agent_id, assignment_start, is_primary) VALUES ($1, $2, now(), true)`,
      [ticketId, agentId]
    );

    // Insert an initial message from the agent
    await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_agent_id, message_time, content, message_type, is_internal) VALUES ($1, $2, now(), $3, 'text', false)`,
      [ticketId, agentId, 'Seeded initial message from agent']
    );

    await client.query('COMMIT');
    console.log('Seed completed. Ticket id:', ticketId);
  } catch (err) {
    console.error('Seed failed:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (e) {}
  } finally {
    await client.end();
  }
}

seed();
