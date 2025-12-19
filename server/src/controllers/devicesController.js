const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.getMyDevices = async (req, res) => {
    try {
        const { contactId } = req.user;

        // Join contact_devices -> devices -> device_models
        const { data, error } = await supabase
            .from('contact_devices')
            .select(`
        assigned_at,
        unassigned_at,
        device:devices (
          device_id,
          asset_name,
          status,
          os_version,
          model:device_models (
            name,
            manufacturer:device_manufacturers (name)
          )
        )
      `)
            .eq('contact_id', contactId);
        // .is('unassigned_at', null); // Removed to allow history fetching. Frontend can filter.

        if (error) throw error;

        // Flatten structure
        const devices = data.map(item => ({
            device_id: item.device.device_id,
            name: item.device.asset_name,
            status: item.device.status,
            os_version: item.device.os_version,
            model_name: item.device.model?.name || 'Unknown Model',
            manufacturer: item.device.model?.manufacturer?.name || 'Unknown Manufacturer',
            assigned_at: item.assigned_at,
            unassigned_at: item.unassigned_at,
            is_active: !item.unassigned_at
        }));

        res.json(devices);
    } catch (err) {
        console.error('Error fetching devices:', err);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
};
