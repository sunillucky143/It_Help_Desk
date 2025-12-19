let joseMod = null;

async function getJose() {
  if (!joseMod) joseMod = await import("jose");
  return joseMod;
}

function getSupabaseIssuer() {
  const url = process.env.SUPABASE_URL; // e.g. https://xxxx.supabase.co
  if (!url) return null;
  return `${url}/auth/v1`;
}

function getJwksUrl() {
  const issuer = getSupabaseIssuer();
  if (!issuer) return null;
  return `${issuer}/.well-known/jwks.json`;
}

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing bearer token" });

    const { jwtVerify, decodeJwt } = await getJose();

    const issuer = getSupabaseIssuer();
    if (!issuer) return res.status(500).json({ error: "SUPABASE_URL not configured" });

    // Decode token first to get payload
    const decoded = decodeJwt(token);
    
    // Verify issuer matches
    if (decoded.iss !== issuer) {
      console.log("Auth: Issuer mismatch", decoded.iss, "vs", issuer);
      return res.status(401).json({ error: "Invalid token issuer" });
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ error: "Token expired" });
    }

    // Token is valid (issuer matches, not expired)
    req.auth = {
      userId: decoded.sub,
      email: decoded.email,
    };
    next();
  } catch (e) {
    console.log("Auth error:", e.message);
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}

async function getOrCreateAgent(req) {
  const client = req.db;
  const userId = req.auth?.userId;
  const email = req.auth?.email;
  
  if (!userId && !email) throw new Error("No user ID or email in token");

  // First try to match by auth_user_id
  if (userId) {
    const { rows: byId } = await client.query(
      `SELECT * FROM support_agents WHERE auth_user_id = $1 LIMIT 1`,
      [userId]
    );
    if (byId[0]) return byId[0];
  }

  // Then try to match by email
  if (email) {
    const { rows: byEmail } = await client.query(
      `SELECT * FROM support_agents WHERE email = $1 LIMIT 1`,
      [email]
    );
    if (byEmail[0]) {
      // Update auth_user_id if not set
      if (userId && !byEmail[0].auth_user_id) {
        await client.query(
          `UPDATE support_agents SET auth_user_id = $1 WHERE support_agent_id = $2`,
          [userId, byEmail[0].support_agent_id]
        );
      }
      return byEmail[0];
    }
  }

  // Auto-provision if enabled
  if (String(process.env.AUTO_PROVISION_AGENT || "false") !== "true") {
    throw new Error("Agent not provisioned");
  }

  const ins = await client.query(
    `INSERT INTO support_agents (full_name, email, agent_type, is_available, auth_user_id)
     VALUES ($1, $2, 'Human', true, $3)
     RETURNING *`,
    [email ? email.split("@")[0] : 'Agent', email, userId]
  );

  return ins.rows[0];
}

async function withAgent(req, res, next) {
  try {
    req.agent = await getOrCreateAgent(req);
    next();
  } catch (e) {
    res.status(403).json({ error: e.message || "Agent not allowed" });
  }
}

// For Socket.io authentication
async function verifySupabaseToken(token) {
  const { decodeJwt } = await getJose();
  
  const issuer = getSupabaseIssuer();
  if (!issuer) throw new Error("SUPABASE_URL not configured");

  const decoded = decodeJwt(token);
  
  // Verify issuer
  if (decoded.iss !== issuer) {
    throw new Error("Invalid token issuer");
  }

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp && decoded.exp < now) {
    throw new Error("Token expired");
  }
  
  return {
    sub: decoded.sub,
    email: decoded.email,
  };
}

module.exports = { requireAuth, withAgent, verifySupabaseToken };
