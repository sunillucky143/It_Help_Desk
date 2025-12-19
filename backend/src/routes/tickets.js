const express = require("express");
const router = express.Router();

function getAuthSub(req) {
  return req.auth?.userId || req.user?.sub || req.auth?.sub || req.jwt?.sub || req.user?.id || null;
}

// Resolve current agent_id from auth_user_id
async function getMyAgentId(db, authSub) {
  const { rows } = await db.query(
    `SELECT support_agent_id FROM support_agents WHERE auth_user_id = $1 LIMIT 1`,
    [authSub]
  );
  return rows[0]?.support_agent_id || null;
}

// Check if agent is primary on a ticket
async function isPrimaryOnTicket(db, ticketId, agentId) {
  const { rows } = await db.query(
    `SELECT is_primary FROM ticket_assignments 
     WHERE ticket_id = $1 AND support_agent_id = $2 AND assignment_end IS NULL`,
    [ticketId, agentId]
  );
  return rows[0]?.is_primary === true;
}

// GET /api/tickets/meta/statuses
router.get("/meta/statuses", async (req, res, next) => {
  try {
    const { rows } = await req.db.query(
      `SELECT status_id, name FROM ticket_statuses ORDER BY status_id ASC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /api/tickets/meta/priorities
router.get("/meta/priorities", async (req, res, next) => {
  try {
    const { rows } = await req.db.query(
      `SELECT priority_id, name FROM ticket_priorities ORDER BY priority_id ASC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /api/tickets/inbox
router.get("/inbox", async (req, res, next) => {
  const sub = getAuthSub(req);
  if (!sub) return res.status(401).json({ error: "Missing/invalid token" });

  const client = req.db;
  try {
    const myAgentId = await getMyAgentId(client, sub);
    if (!myAgentId) return res.status(404).json({ error: "No agent profile found" });

    const q = `
      SELECT st.ticket_id, st.subject, st.created_at, st.updated_at, st.requires_human_agent,
        tp.name AS priority_name, tp.priority_id, ts.name AS status_name, ts.status_id,
        ta.is_primary,
        d.device_id, d.host_name, d.public_ip,
        l.requires_human_agent AS location_requires_human
      FROM support_tickets st
      JOIN ticket_assignments ta ON ta.ticket_id = st.ticket_id
      LEFT JOIN ticket_priorities tp ON tp.priority_id = st.priority_id
      LEFT JOIN ticket_statuses ts ON ts.status_id = st.status_id
      LEFT JOIN devices d ON d.device_id = st.device_id
      LEFT JOIN locations l ON l.location_id = st.location_id
      WHERE ta.support_agent_id = $1 AND ta.assignment_end IS NULL
      ORDER BY array_position(ARRAY['Critical','High','Medium','Low'], tp.name) ASC NULLS LAST,
               st.created_at ASC
      LIMIT 200
    `;
    const { rows } = await client.query(q, [myAgentId]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/:id
router.get("/:id", async (req, res, next) => {
  const sub = getAuthSub(req);
  const ticketId = req.params.id;
  try {
    const myAgentId = await getMyAgentId(req.db, sub);
    
    const ticketQ = `
      SELECT st.*, tp.name AS priority_name, ts.name AS status_name,
        d.device_id, d.host_name, d.public_ip, d.gateway, d.system_uptime,
        d.last_reported_time, d.os_version, d.total_memory, d.processor_id, d.update_status_id,
        d.status AS device_status,
        us.name AS update_status_name,
        pm.manufacturer AS processor_manufacturer, pm.model AS processor_model,
        os.name AS os_name,
        l.requires_human_agent AS location_requires_human
      FROM support_tickets st
      LEFT JOIN ticket_priorities tp ON tp.priority_id = st.priority_id
      LEFT JOIN ticket_statuses ts ON ts.status_id = st.status_id
      LEFT JOIN devices d ON d.device_id = st.device_id
      LEFT JOIN update_statuses us ON us.update_status_id = d.update_status_id
      LEFT JOIN processor_models pm ON pm.processor_id = d.processor_id
      LEFT JOIN operating_systems os ON os.os_id = d.os_id
      LEFT JOIN locations l ON l.location_id = st.location_id
      WHERE st.ticket_id = $1
    `;
    const { rows: trows } = await req.db.query(ticketQ, [ticketId]);
    if (!trows.length) return res.status(404).json({ error: "Ticket not found" });
    const ticket = trows[0];

    // Get assignment info for current agent
    const { rows: assignmentRows } = await req.db.query(
      `SELECT is_primary FROM ticket_assignments 
       WHERE ticket_id = $1 AND support_agent_id = $2 AND assignment_end IS NULL`,
      [ticketId, myAgentId]
    );
    ticket.is_primary = assignmentRows[0]?.is_primary === true;

    const { rows: messages } = await req.db.query(
      `SELECT tm.message_id, tm.sender_agent_id, tm.sender_contact_id, tm.message_time, 
              tm.content, tm.message_type, tm.is_internal,
              sa.full_name AS sender_agent_name, sa.agent_type,
              c.full_name AS sender_contact_name
       FROM ticket_messages tm
       LEFT JOIN support_agents sa ON sa.support_agent_id = tm.sender_agent_id
       LEFT JOIN contacts c ON c.contact_id = tm.sender_contact_id
       WHERE tm.ticket_id = $1
       ORDER BY tm.message_time ASC
       LIMIT 1000`,
      [ticketId]
    );

    res.json({ ticket, messages });
  } catch (e) {
    next(e);
  }
});

// POST /api/tickets/:id/messages
router.post("/:id/messages", async (req, res, next) => {
  const sub = getAuthSub(req);
  if (!sub) return res.status(401).json({ error: "Missing/invalid token" });

  const ticketId = req.params.id;
  const { content, message_type = "text", is_internal = false } = req.body;

  try {
    const myAgentId = await getMyAgentId(req.db, sub);
    if (!myAgentId) return res.status(404).json({ error: "No agent profile found" });

    const { rows } = await req.db.query(
      `INSERT INTO ticket_messages (ticket_id, sender_agent_id, message_time, content, message_type, is_internal)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)
       RETURNING message_id, ticket_id, sender_agent_id, message_time, content, message_type, is_internal`,
      [ticketId, myAgentId, content, message_type, !!is_internal]
    );

    const message = rows[0];
    req.app?.get("io")?.to(`ticket_${ticketId}`)?.emit("message", message);
    res.status(201).json(message);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/tickets/:id - Update ticket status/priority
router.patch("/:id", async (req, res, next) => {
  const sub = getAuthSub(req);
  if (!sub) return res.status(401).json({ error: "Missing/invalid token" });

  const ticketId = req.params.id;
  const { status_id, priority_id } = req.body;

  try {
    const myAgentId = await getMyAgentId(req.db, sub);
    if (!myAgentId) return res.status(404).json({ error: "No agent profile found" });

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (status_id !== undefined) {
      updates.push(`status_id = $${paramIndex++}`);
      values.push(status_id);
    }
    if (priority_id !== undefined) {
      updates.push(`priority_id = $${paramIndex++}`);
      values.push(priority_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(ticketId);

    const { rows } = await req.db.query(
      `UPDATE support_tickets SET ${updates.join(", ")} WHERE ticket_id = $${paramIndex}
       RETURNING ticket_id, status_id, priority_id, updated_at`,
      values
    );

    if (!rows.length) return res.status(404).json({ error: "Ticket not found" });

    const updated = rows[0];
    req.app?.get("io")?.to(`ticket_${ticketId}`)?.emit("ticket:updated", updated);
    req.app?.get("io")?.emit("inbox:refresh");
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// POST /api/tickets/:id/close - Close a ticket
router.post("/:id/close", async (req, res, next) => {
  const sub = getAuthSub(req);
  if (!sub) return res.status(401).json({ error: "Missing/invalid token" });

  const ticketId = req.params.id;

  try {
    const myAgentId = await getMyAgentId(req.db, sub);
    if (!myAgentId) return res.status(404).json({ error: "No agent profile found" });

    // Check if agent is primary on this ticket (only primary can close)
    const isPrimary = await isPrimaryOnTicket(req.db, ticketId, myAgentId);
    if (!isPrimary) {
      return res.status(403).json({ error: "Only the primary agent can close this ticket" });
    }

    // Get 'Closed' status id
    const { rows: statusRows } = await req.db.query(
      `SELECT status_id FROM ticket_statuses WHERE name = 'Closed' LIMIT 1`
    );
    const closedStatusId = statusRows[0]?.status_id;

    const { rows } = await req.db.query(
      `UPDATE support_tickets 
       SET status_id = $1, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE ticket_id = $2
       RETURNING ticket_id, status_id, closed_at, updated_at`,
      [closedStatusId, ticketId]
    );

    if (!rows.length) return res.status(404).json({ error: "Ticket not found" });

    // End all active assignments
    await req.db.query(
      `UPDATE ticket_assignments SET assignment_end = CURRENT_TIMESTAMP 
       WHERE ticket_id = $1 AND assignment_end IS NULL`,
      [ticketId]
    );

    const closed = rows[0];
    req.app?.get("io")?.to(`ticket_${ticketId}`)?.emit("ticket:closed", closed);
    req.app?.get("io")?.emit("inbox:refresh");
    res.json(closed);
  } catch (e) {
    next(e);
  }
});

// POST /api/tickets/:id/escalate - Escalate a ticket
router.post("/:id/escalate", async (req, res, next) => {
  const sub = getAuthSub(req);
  if (!sub) return res.status(401).json({ error: "Missing/invalid token" });

  const ticketId = req.params.id;
  const { to_agent_id, reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "Reason is required for escalation" });
  }

  try {
    const myAgentId = await getMyAgentId(req.db, sub);
    if (!myAgentId) return res.status(404).json({ error: "No agent profile found" });

    // Create escalation record
    const { rows: escRows } = await req.db.query(
      `INSERT INTO ticket_escalations (ticket_id, from_agent_id, to_agent_id, escalation_time, reason)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
       RETURNING escalation_id, ticket_id, from_agent_id, to_agent_id, escalation_time, reason`,
      [ticketId, myAgentId, to_agent_id || null, reason.trim()]
    );

    // Update ticket status to 'Escalated'
    const { rows: statusRows } = await req.db.query(
      `SELECT status_id FROM ticket_statuses WHERE name = 'Escalated' LIMIT 1`
    );
    const escalatedStatusId = statusRows[0]?.status_id;

    if (escalatedStatusId) {
      await req.db.query(
        `UPDATE support_tickets SET status_id = $1, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = $2`,
        [escalatedStatusId, ticketId]
      );
    }

    // If to_agent_id is provided, create new assignment
    if (to_agent_id) {
      // End current agent's assignment
      await req.db.query(
        `UPDATE ticket_assignments SET assignment_end = CURRENT_TIMESTAMP 
         WHERE ticket_id = $1 AND support_agent_id = $2 AND assignment_end IS NULL`,
        [ticketId, myAgentId]
      );

      // Create new assignment for target agent
      await req.db.query(
        `INSERT INTO ticket_assignments (ticket_id, support_agent_id, assignment_start, is_primary)
         VALUES ($1, $2, CURRENT_TIMESTAMP, TRUE)
         ON CONFLICT DO NOTHING`,
        [ticketId, to_agent_id]
      );
    }

    const escalation = escRows[0];
    req.app?.get("io")?.emit("ticket:escalated", escalation);
    req.app?.get("io")?.emit("inbox:refresh");
    res.status(201).json(escalation);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
