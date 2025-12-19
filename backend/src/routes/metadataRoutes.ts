import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Device Manufacturers
router.get('/manufacturers', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('device_manufacturers')
      .select('*')
      .order('manufacturer_id', { ascending: true });

    if (error) throw error;

    const transformedData = data?.map(m => ({
      id: m.manufacturer_id,
      name: m.name,
      country: 'N/A' // Schema doesn't have country field
    }));

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/manufacturers', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('device_manufacturers')
      .insert([{ name: req.body.name }])
      .select()
      .single();

    if (error) throw error;

    const transformedData = {
      id: data.manufacturer_id,
      name: data.name,
      country: req.body.country || 'N/A'
    };

    res.status(201).json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/manufacturers/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('device_manufacturers')
      .update({ name: req.body.name })
      .eq('manufacturer_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Manufacturer not found' });
    }

    const transformedData = {
      id: data.manufacturer_id,
      name: data.name,
      country: req.body.country || 'N/A'
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/manufacturers/:id', async (req: Request, res: Response) => {
  try {
    // Check if manufacturer has associated models
    const { data: models, error: modelsError } = await supabase
      .from('device_models')
      .select('model_id')
      .eq('manufacturer_id', req.params.id);

    if (modelsError) throw modelsError;

    if (models && models.length > 0) {
      return res.status(400).json({
        message: 'Dependency Error: Cannot delete manufacturer with existing models',
        type: 'dependency_error'
      });
    }

    const { error } = await supabase
      .from('device_manufacturers')
      .delete()
      .eq('manufacturer_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Manufacturer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Device Models
router.get('/models', async (req: Request, res: Response) => {
  try {
    const { manufacturer_id } = req.query;

    let query = supabase
      .from('device_models')
      .select('*')
      .order('model_id', { ascending: true });

    if (manufacturer_id) {
      query = query.eq('manufacturer_id', parseInt(manufacturer_id as string));
    }

    const { data, error } = await query;

    if (error) throw error;

    const transformedData = data?.map(m => ({
      id: m.model_id,
      manufacturer_id: m.manufacturer_id,
      model_name: m.name
    }));

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/models', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('device_models')
      .insert([{
        manufacturer_id: parseInt(req.body.manufacturer_id),
        name: req.body.model_name
      }])
      .select()
      .single();

    if (error) throw error;

    const transformedData = {
      id: data.model_id,
      manufacturer_id: data.manufacturer_id,
      model_name: data.name
    };

    res.status(201).json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/models/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('device_models')
      .update({
        manufacturer_id: parseInt(req.body.manufacturer_id),
        name: req.body.model_name
      })
      .eq('model_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Model not found' });
    }

    const transformedData = {
      id: data.model_id,
      manufacturer_id: data.manufacturer_id,
      model_name: data.name
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/models/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('device_models')
      .delete()
      .eq('model_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Model deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Operating Systems
router.get('/operating-systems', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('operating_systems')
      .select('*')
      .order('os_id', { ascending: true });

    if (error) throw error;

    const transformedData = data?.map(os => ({
      id: os.os_id,
      os_name: os.name,
      version: 'N/A' // Schema doesn't have version field
    }));

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/operating-systems', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('operating_systems')
      .insert([{ name: req.body.os_name }])
      .select()
      .single();

    if (error) throw error;

    const transformedData = {
      id: data.os_id,
      os_name: data.name,
      version: req.body.version || 'N/A'
    };

    res.status(201).json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/operating-systems/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('operating_systems')
      .update({ name: req.body.os_name })
      .eq('os_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Operating system not found' });
    }

    const transformedData = {
      id: data.os_id,
      os_name: data.name,
      version: req.body.version || 'N/A'
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/operating-systems/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('operating_systems')
      .delete()
      .eq('os_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Operating system deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Processor Architectures
router.get('/processor-architectures', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('processor_architectures')
      .select('*')
      .order('architecture_id', { ascending: true });

    if (error) throw error;

    const transformedData = data?.map(arch => ({
      id: arch.architecture_id,
      architecture: arch.name,
      description: arch.name
    }));

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/processor-architectures', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('processor_architectures')
      .insert([{ name: req.body.architecture }])
      .select()
      .single();

    if (error) throw error;

    const transformedData = {
      id: data.architecture_id,
      architecture: data.name,
      description: req.body.description || data.name
    };

    res.status(201).json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/processor-architectures/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('processor_architectures')
      .update({ name: req.body.architecture })
      .eq('architecture_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Processor architecture not found' });
    }

    const transformedData = {
      id: data.architecture_id,
      architecture: data.name,
      description: req.body.description || data.name
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/processor-architectures/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('processor_architectures')
      .delete()
      .eq('architecture_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Processor architecture deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Ticket Statuses
router.get('/ticket-statuses', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ticket_statuses')
      .select('*')
      .order('status_id', { ascending: true });

    if (error) throw error;

    const transformedData = data?.map(status => ({
      id: status.status_id,
      status_name: status.name,
      color: '#3b82f6' // Default color
    }));

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/ticket-statuses', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ticket_statuses')
      .insert([{
        name: req.body.status_name,
        description: req.body.description || null
      }])
      .select()
      .single();

    if (error) throw error;

    const transformedData = {
      id: data.status_id,
      status_name: data.name,
      color: req.body.color || '#3b82f6'
    };

    res.status(201).json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/ticket-statuses/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ticket_statuses')
      .update({
        name: req.body.status_name,
        description: req.body.description || null
      })
      .eq('status_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Ticket status not found' });
    }

    const transformedData = {
      id: data.status_id,
      status_name: data.name,
      color: req.body.color || '#3b82f6'
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/ticket-statuses/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('ticket_statuses')
      .delete()
      .eq('status_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Ticket status deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Ticket Priorities
router.get('/ticket-priorities', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ticket_priorities')
      .select('*')
      .order('priority_id', { ascending: true });

    if (error) throw error;

    const transformedData = data?.map(priority => ({
      id: priority.priority_id,
      priority_name: priority.name,
      rank: priority.priority_id,
      sla_hours: 24 // Default SLA
    }));

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/ticket-priorities', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ticket_priorities')
      .insert([{
        name: req.body.priority_name,
        description: req.body.description || null
      }])
      .select()
      .single();

    if (error) throw error;

    const transformedData = {
      id: data.priority_id,
      priority_name: data.name,
      rank: req.body.rank || data.priority_id,
      sla_hours: req.body.sla_hours || 24
    };

    res.status(201).json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/ticket-priorities/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ticket_priorities')
      .update({
        name: req.body.priority_name,
        description: req.body.description || null
      })
      .eq('priority_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Ticket priority not found' });
    }

    const transformedData = {
      id: data.priority_id,
      priority_name: data.name,
      rank: req.body.rank || data.priority_id,
      sla_hours: req.body.sla_hours || 24
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/ticket-priorities/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('ticket_priorities')
      .delete()
      .eq('priority_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Ticket priority deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
