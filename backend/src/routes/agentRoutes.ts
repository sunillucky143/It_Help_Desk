import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Get all agents
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('support_agents')
      .select('*')
      .order('support_agent_id', { ascending: true });

    if (error) throw error;

    // Transform to match frontend expectations
    const transformedData = data?.map(agent => ({
      id: agent.support_agent_id,
      agent_name: agent.full_name,
      agent_type: agent.agent_type,
      specializations: agent.specialization ? agent.specialization.split(',').map((s: string) => s.trim()) : [],
      is_available: agent.is_available,
      created_at: agent.created_at
    }));

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get agent by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('support_agents')
      .select('*')
      .eq('support_agent_id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const transformedData = {
      id: data.support_agent_id,
      agent_name: data.full_name,
      agent_type: data.agent_type,
      specializations: data.specialization ? data.specialization.split(',').map((s: string) => s.trim()) : [],
      is_available: data.is_available,
      created_at: data.created_at
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get available agents
router.get('/status/available', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('support_agents')
      .select('*')
      .eq('is_available', true)
      .order('support_agent_id', { ascending: true });

    if (error) throw error;

    const transformedData = data?.map(agent => ({
      id: agent.support_agent_id,
      agent_name: agent.full_name,
      agent_type: agent.agent_type,
      specializations: agent.specialization ? agent.specialization.split(',').map((s: string) => s.trim()) : [],
      is_available: agent.is_available,
      created_at: agent.created_at
    }));

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create agent
router.post('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('support_agents')
      .insert([{
        full_name: req.body.agent_name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        agent_type: req.body.agent_type,
        specialization: Array.isArray(req.body.specializations)
          ? req.body.specializations.join(', ')
          : req.body.specializations,
        is_available: req.body.is_available
      }])
      .select()
      .single();

    if (error) throw error;

    const transformedData = {
      id: data.support_agent_id,
      agent_name: data.full_name,
      agent_type: data.agent_type,
      specializations: data.specialization ? data.specialization.split(',').map((s: string) => s.trim()) : [],
      is_available: data.is_available,
      created_at: data.created_at
    };

    res.status(201).json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update agent
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('support_agents')
      .update({
        full_name: req.body.agent_name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        agent_type: req.body.agent_type,
        specialization: Array.isArray(req.body.specializations)
          ? req.body.specializations.join(', ')
          : req.body.specializations,
        is_available: req.body.is_available
      })
      .eq('support_agent_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const transformedData = {
      id: data.support_agent_id,
      agent_name: data.full_name,
      agent_type: data.agent_type,
      specializations: data.specialization ? data.specialization.split(',').map((s: string) => s.trim()) : [],
      is_available: data.is_available,
      created_at: data.created_at
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle agent availability
router.patch('/:id/availability', async (req: Request, res: Response) => {
  try {
    // First get current availability
    const { data: currentData, error: fetchError } = await supabase
      .from('support_agents')
      .select('is_available')
      .eq('support_agent_id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!currentData) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Toggle availability
    const { data, error } = await supabase
      .from('support_agents')
      .update({ is_available: !currentData.is_available })
      .eq('support_agent_id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    const transformedData = {
      id: data.support_agent_id,
      agent_name: data.full_name,
      agent_type: data.agent_type,
      specializations: data.specialization ? data.specialization.split(',').map((s: string) => s.trim()) : [],
      is_available: data.is_available,
      created_at: data.created_at
    };

    res.json(transformedData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete agent
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('support_agents')
      .delete()
      .eq('support_agent_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Agent deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
