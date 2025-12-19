import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Get all organizations
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('organization_id', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get organization by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all account managers
router.get('/managers/all', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('account_managers')
      .select('*')
      .order('manager_id', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create organization
router.post('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        name: req.body.organization_name,
        u_e_code: parseInt(req.body.u_e_code),
        manager_id: parseInt(req.body.manager_id)
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update organization
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: req.body.organization_name,
        u_e_code: parseInt(req.body.u_e_code),
        manager_id: parseInt(req.body.manager_id)
      })
      .eq('organization_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete organization
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('organization_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Organization deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
