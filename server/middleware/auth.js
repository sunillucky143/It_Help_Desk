const { createClient } = require('@supabase/supabase-js');

// Initialize a separate client for auth verification if needed, 
// or reuse the one from app.js if exported. 
// For middleware, it's often cleaner to have its own or pass it in.
// We'll read env vars directly here for simplicity.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');

        // 1. Verify the JWT with Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // 2. Identity Mapping: Find the Contact based on Email
        console.log(`[AuthMiddleware] Verifying contact profile for email: ${user.email}`);

        const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('contact_id, organization_id, full_name, email')
            .eq('email', user.email)
            .single();

        if (contactError || !contact) {
            console.error(`[AuthMiddleware] Lookup failed for ${user.email}. Error:`, contactError);
            return res.status(403).json({
                error: 'Access Denied: No Contact Profile Found',
                details: `Email ${user.email} is not linked to a contact profile.`
            });
        }

        // 3. Attach mapped identity to the request
        req.user = {
            auth_id: user.id,
            email: user.email,
            id: contact.contact_id,          // Match 'id' from Login response
            org_id: contact.organization_id, // Match 'org_id' from Login response
            name: contact.full_name          // Match 'name' from Login response
        };

        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};

module.exports = authMiddleware;
