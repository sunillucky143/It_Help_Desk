import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Get dashboard statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get open tickets count
    const { count: openTicketsCount, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status_id', [1, 2]); // Assuming 1=Open, 2=In Progress

    if (ticketsError) throw ticketsError;

    // Get offline devices count
    const { count: offlineDevicesCount, error: devicesError } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'OFFLINE');

    if (devicesError) throw devicesError;

    // Get bot agents count
    const { count: botAgentsCount, error: botError } = await supabase
      .from('support_agents')
      .select('*', { count: 'exact', head: true })
      .eq('agent_type', 'Bot')
      .eq('is_available', true);

    if (botError) throw botError;

    // Get human agents count
    const { count: humanAgentsCount, error: humanError } = await supabase
      .from('support_agents')
      .select('*', { count: 'exact', head: true })
      .eq('agent_type', 'Human')
      .eq('is_available', true);

    if (humanError) throw humanError;

    // Get locations that require human agents
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*, organizations(name)')
      .eq('requires_human_agent', true);

    if (locationsError) throw locationsError;

    // Build high-risk alerts
    const highRiskAlerts = locations?.map(location => ({
      organization_id: location.organization_id,
      organization_name: location.organizations?.name || 'Unknown',
      location_type: location.location_type,
      requires_human_agent: location.requires_human_agent,
      available_human_agents: humanAgentsCount || 0
    })).filter(alert => alert.available_human_agents === 0) || [];

    res.json({
      totalOpenTickets: openTicketsCount || 0,
      totalDevicesOffline: offlineDevicesCount || 0,
      activeBotAgents: botAgentsCount || 0,
      activeHumanAgents: humanAgentsCount || 0,
      highRiskAlerts
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent tickets
router.get('/recent-tickets', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        organizations(name),
        contacts(full_name),
        ticket_statuses(name),
        ticket_priorities(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get agent availability summary
router.get('/agent-availability', async (req: Request, res: Response) => {
  try {
    // Get all bot agents
    const { data: botAgents, error: botError } = await supabase
      .from('support_agents')
      .select('is_available')
      .eq('agent_type', 'Bot');

    if (botError) throw botError;

    // Get all human agents
    const { data: humanAgents, error: humanError } = await supabase
      .from('support_agents')
      .select('is_available')
      .eq('agent_type', 'Human');

    if (humanError) throw humanError;

    res.json({
      bots: {
        total: botAgents?.length || 0,
        available: botAgents?.filter(a => a.is_available).length || 0,
        unavailable: botAgents?.filter(a => !a.is_available).length || 0
      },
      humans: {
        total: humanAgents?.length || 0,
        available: humanAgents?.filter(a => a.is_available).length || 0,
        unavailable: humanAgents?.filter(a => !a.is_available).length || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
