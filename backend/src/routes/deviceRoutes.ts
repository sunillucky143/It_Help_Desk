import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Get all devices with joins for related data
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, organization_id } = req.query;

    let query = supabase
      .from('devices')
      .select(`
        *,
        organizations(name),
        locations(name, location_type),
        device_manufacturers(name),
        device_models(name),
        operating_systems(name)
      `)
      .order('device_id', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (organization_id) {
      query = query.eq('organization_id', parseInt(organization_id as string));
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform to match frontend expectations
    const transformedData = data?.map(device => ({
      id: device.device_id,
      device_name: device.asset_name,
      organization_id: device.organization_id,
      manufacturer: device.device_manufacturers?.name || 'Unknown',
      model: device.device_models?.name || 'Unknown',
      operating_system: device.operating_systems?.name || 'Unknown',
      processor_architecture: device.architecture_id || 'Unknown',
      status: device.status,
      public_ip: device.public_ip || '',
      gateway: device.gateway || '',
      last_seen: device.last_reported_time || device.created_at
    }));

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get device by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        organizations(name),
        locations(name, location_type),
        device_manufacturers(name),
        device_models(name),
        operating_systems(name)
      `)
      .eq('device_id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const transformedData = {
      id: data.device_id,
      device_name: data.asset_name,
      organization_id: data.organization_id,
      manufacturer: data.device_manufacturers?.name || 'Unknown',
      model: data.device_models?.name || 'Unknown',
      operating_system: data.operating_systems?.name || 'Unknown',
      processor_architecture: data.architecture_id || 'Unknown',
      status: data.status,
      public_ip: data.public_ip || '',
      gateway: data.gateway || '',
      last_seen: data.last_reported_time || data.created_at
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create device
router.post('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .insert([{
        organization_id: parseInt(req.body.organization_id),
        location_id: parseInt(req.body.location_id) || 1, // Default location if not provided
        asset_name: req.body.device_name,
        status: req.body.status,
        public_ip: req.body.public_ip,
        gateway: req.body.gateway,
        host_name: req.body.device_name
      }])
      .select()
      .single();

    if (error) throw error;

    const transformedData = {
      id: data.device_id,
      device_name: data.asset_name,
      organization_id: data.organization_id,
      manufacturer: req.body.manufacturer,
      model: req.body.model,
      operating_system: req.body.operating_system,
      processor_architecture: req.body.processor_architecture,
      status: data.status,
      public_ip: data.public_ip,
      gateway: data.gateway,
      last_seen: data.created_at
    };

    res.status(201).json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update device
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .update({
        asset_name: req.body.device_name,
        status: req.body.status,
        public_ip: req.body.public_ip,
        gateway: req.body.gateway
      })
      .eq('device_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const transformedData = {
      id: data.device_id,
      device_name: data.asset_name,
      organization_id: data.organization_id,
      manufacturer: req.body.manufacturer,
      model: req.body.model,
      operating_system: req.body.operating_system,
      processor_architecture: req.body.processor_architecture,
      status: data.status,
      public_ip: data.public_ip,
      gateway: data.gateway,
      last_seen: data.last_reported_time || data.updated_at
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete device
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('device_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Device deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
