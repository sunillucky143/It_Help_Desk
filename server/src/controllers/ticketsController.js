const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.createTicket = async (req, res) => {
    try {
        const { contactId, organizationId } = req.user;
        const { subject, description, deviceId, locationId, priorityId } = req.body;

        // TODO: Validate deviceId belongs to contactId if provided? 
        // Requirement says: "Middleware to verify that the device_id being submitted... actually belongs to the contact_id"
        if (deviceId) {
            const { data: ownership } = await supabase
                .from('contact_devices')
                .select('device_id')
                .eq('contact_id', contactId)
                .eq('device_id', deviceId)
                .is('unassigned_at', null)
                .single();

            if (!ownership) {
                return res.status(403).json({ error: 'You cannot submit a ticket for a device not assigned to you.' });
            }
        }

        const { data, error } = await supabase
            .from('support_tickets')
            .insert({
                organization_id: organizationId,
                contact_id: contactId,
                device_id: deviceId || null,
                location_id: locationId, // Frontend should send this or we default to something?
                subject,
                description,
                status_id: 1, // Default to 'Open' (ID 1 assumed from schema insert)
                priority_id: priorityId || 2, // Default to Medium (ID 2 assumed)
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
};

exports.getMyTickets = async (req, res) => {
    try {
        const { contactId, organizationId } = req.user;

        const { data, error } = await supabase
            .from('support_tickets')
            .select(`
        ticket_id,
        subject,
        status:ticket_statuses (name),
        priority:ticket_priorities (name),
        updated_at,
        created_at
      `)
            .eq('organization_id', organizationId) // Tenant isolation
            .eq('contact_id', contactId) // Requester isolation
            .order('updated_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error('Error fetching tickets:', err);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};

exports.getTicketDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { contactId, organizationId } = req.user;

        // Multi-step fetch or deep join
        const { data, error } = await supabase
            .from('support_tickets')
            .select(`
        *,
        status:ticket_statuses (*),
        priority:ticket_priorities (*),
        device:devices (
            asset_name,
            model:device_models(name)
        ),
        messages:ticket_messages (
          message_id,
          content,
          message_time,
          sender_agent_id,
          sender_contact_id,
          message_type,
          sender_agent:support_agents(full_name, agent_type),
          sender_contact:contacts(full_name)
        )
      `)
            .eq('ticket_id', id)
            .eq('organization_id', organizationId)
            .eq('contact_id', contactId)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Ticket not found' });

        res.json(data);
    } catch (err) {
        console.error('Error fetching ticket details:', err);
        res.status(500).json({ error: 'Failed to fetch ticket details' });
    }
};

exports.addMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { contactId, organizationId } = req.user;
        const { content, messageType } = req.body;

        // Verify access first
        const { data: ticket } = await supabase
            .from('support_tickets')
            .select('ticket_id')
            .eq('ticket_id', id)
            .eq('organization_id', organizationId)
            .eq('contact_id', contactId)
            .single();

        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        const { data, error } = await supabase
            .from('ticket_messages')
            .insert({
                ticket_id: id,
                sender_contact_id: contactId,
                content,
                message_type: messageType || 'text'
            })
            .select()
            .single();

        if (error) throw error;

        // Emit socket event to room
        // We need access to 'io' here. Usually we attach io to req or import it.
        // For simplicity, we might just rely on client polling or move io to a separate module.
        // But app.js isn't exporting io easily.
        // Let's assume we'll fix the socket architecture in a moment, 
        // or just rely on the receiver to poll for now?
        // REQUIREMENT: "Socket.io to provide real-time updates"
        // Fix: Attach io to req in app.js
        if (req.io) {
            req.io.to(`ticket:${id}`).emit('new_message', data);
        }

        // TRIGGER AI REPLY
        // We do not await this, we let it run in background
        const aiService = require('../services/aiService');
        aiService.analyzeAndReply(id, content, req.io);

        res.status(201).json(data);

    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
}
