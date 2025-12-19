import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Get all tickets with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, priority } = req.query;

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        organizations(name),
        contacts(full_name, email),
        devices(asset_name),
        locations(name),
        ticket_statuses(name),
        ticket_priorities(name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status_id', parseInt(status as string));
    }

    if (priority) {
      query = query.eq('priority_id', parseInt(priority as string));
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get ticket by ID with comments and assignments
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        organizations(name),
        contacts(full_name, email),
        devices(asset_name),
        locations(name),
        ticket_statuses(name),
        ticket_priorities(name)
      `)
      .eq('ticket_id', req.params.id)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Get assignments for this ticket
    const { data: assignments, error: assignmentsError } = await supabase
      .from('ticket_assignments')
      .select(`
        *,
        support_agents(full_name, email, agent_type)
      `)
      .eq('ticket_id', req.params.id)
      .is('assignment_end', null)
      .order('assignment_start', { ascending: false });

    if (assignmentsError) throw assignmentsError;

    // Get messages for this ticket
    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select(`
        *,
        sender_agent:support_agents!ticket_messages_sender_agent_id_fkey(full_name, agent_type),
        sender_contact:contacts!ticket_messages_sender_contact_id_fkey(full_name, email)
      `)
      .eq('ticket_id', req.params.id)
      .order('message_time', { ascending: true });

    if (messagesError) throw messagesError;

    res.json({
      ...ticket,
      assignments: assignments || [],
      comments: messages || []
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create new ticket
router.post('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([{
        organization_id: parseInt(req.body.organization_id),
        contact_id: parseInt(req.body.contact_id),
        device_id: req.body.device_id ? parseInt(req.body.device_id) : null,
        location_id: req.body.location_id ? parseInt(req.body.location_id) : null,
        subject: req.body.subject,
        description: req.body.description,
        status_id: req.body.status_id || 1, // Default to 'Open'
        priority_id: req.body.priority_id || 2, // Default to 'Medium'
        requires_human_agent: req.body.requires_human_agent || false
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update ticket
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        status_id: req.body.status_id,
        priority_id: req.body.priority_id,
        subject: req.body.subject,
        description: req.body.description
      })
      .eq('ticket_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Assign ticket to agent
router.patch('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { agent_id } = req.body;

    // Create assignment record
    const { data: assignment, error: assignmentError } = await supabase
      .from('ticket_assignments')
      .insert([{
        ticket_id: parseInt(req.params.id),
        support_agent_id: parseInt(agent_id),
        is_primary: true
      }])
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment/message to ticket
router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { content, sender_agent_id, sender_contact_id } = req.body;

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert([{
        ticket_id: parseInt(req.params.id),
        sender_agent_id: sender_agent_id ? parseInt(sender_agent_id) : null,
        sender_contact_id: sender_contact_id ? parseInt(sender_contact_id) : null,
        content,
        message_type: 'text'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete ticket
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('ticket_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get ticket statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    // Get counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('support_tickets')
      .select('status_id, ticket_statuses(name)')
      .order('status_id');

    if (statusError) throw statusError;

    // Get counts by priority
    const { data: priorityCounts, error: priorityError } = await supabase
      .from('support_tickets')
      .select('priority_id, ticket_priorities(name)')
      .order('priority_id');

    if (priorityError) throw priorityError;

    // Aggregate counts
    const statusSummary = statusCounts?.reduce((acc: any, ticket: any) => {
      const status = ticket.ticket_statuses?.name || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const prioritySummary = priorityCounts?.reduce((acc: any, ticket: any) => {
      const priority = ticket.ticket_priorities?.name || 'Unknown';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    res.json({
      byStatus: statusSummary,
      byPriority: prioritySummary
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
