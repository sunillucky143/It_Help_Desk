const express = require("express");
const router = express.Router();

// GET /api/agents/me
router.get("/me", async (req, res) => {
  // withAgent middleware already populated req.agent (or 403’d)
  const a = req.agent;
  return res.json({
    support_agent_id: a.support_agent_id,
    full_name: a.full_name,
    email: a.email,
    agent_type: a.agent_type,
    specialization: a.specialization,
    is_available: a.is_available,
    updated_at: a.updated_at,
  });
});

// GET /api/agents (list for escalation dropdown)
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await req.db.query(
      `SELECT support_agent_id, full_name, email, agent_type, specialization, is_available
       FROM support_agents
       ORDER BY agent_type ASC, is_available DESC, full_name ASC NULLS LAST`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/agents/me/availability
router.patch("/me/availability", async (req, res, next) => {
  try {
    const { is_available } = req.body;

    const { rows } = await req.db.query(
      `UPDATE support_agents
       SET is_available = $1, updated_at = CURRENT_TIMESTAMP
       WHERE support_agent_id = $2
       RETURNING support_agent_id, is_available, updated_at`,
      [!!is_available, req.agent.support_agent_id]
    );

    const out = rows[0];
    req.app?.get("io")?.emit("agent:availability", out);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
