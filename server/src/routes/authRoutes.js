const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase'); // Use the client we made in Phase 1

const authMiddleware = require('../../middleware/auth');
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email } = req.body;

    // 1. Find the contact by email
    const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !data) {
        return res.status(401).json({ error: 'User not found' });
    }

    // 2. Return the user profile
    res.json({
        user: {
            id: data.contact_id,
            name: data.full_name,
            email: data.email,
            org_id: data.organization_id
        }
    });
});

// GET /api/auth/me
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;