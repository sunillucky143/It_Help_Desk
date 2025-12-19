const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET /api/devices?email=alice@example.com
router.get('/', async (req, res) => {
    const email = req.query.email;
    const historyMode = req.query.history === 'true';

    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        // Step 1: Get the Contact ID from the email
        const { data: user, error: userError } = await supabaseAdmin
            .from('contacts')
            .select('contact_id')
            .eq('email', email)
            .single();

        if (userError || !user) {
            console.log("User not found for email:", email);
            return res.json([]); // Return empty list if user doesn't exist
        }

        // Step 2: Query 'contact_devices'
        let query = supabaseAdmin
            .from('contact_devices')
            .select(`
                devices (
                    device_id,
                    asset_name,
                    status,
                    system_uptime,
                    last_reported_time,
                    location_id,
                    device_manufacturers ( name ),
                    device_models ( name ),
                    operating_systems ( name )
                )
            `)
            .eq('contact_id', user.contact_id);

        // Only filter for active devices if NOT in history mode
        if (!historyMode) {
            query = query.is('unassigned_at', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase Join Error:', error);
            throw error;
        }

        // Step 3: Flatten the response for the Frontend
        const flatList = data.map(row => {
            const d = row.devices;
            return {
                device_id: d.device_id,
                asset_name: d.asset_name,
                status: d.status,
                manufacturer: d.device_manufacturers?.name || 'Unknown',
                model: d.device_models?.name || 'Unknown',
                os_name: d.operating_systems?.name || 'Unknown',
                system_uptime: d.system_uptime,
                last_reported_time: d.last_reported_time,
                location_id: d.location_id // New Field
            };
        });
        res.json(flatList);

    } catch (err) {
        console.error('Device Route Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;