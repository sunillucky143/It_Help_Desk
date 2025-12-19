const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET /api/tickets?userId=123
router.get('/', async (req, res) => {
    const userId = req.query.userId;

    // Fetch tickets with Status Name
    const { data, error } = await supabaseAdmin
        .from('support_tickets')
        .select(`
            *,
            ticket_statuses ( name )
        `)
        .eq('contact_id', userId)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST /api/tickets (Create New Ticket)
router.post('/', async (req, res) => {
    const { contact_id, organization_id, subject, description, device_id } = req.body;

    // 1. Create the Ticket
    const { data: ticket, error } = await supabaseAdmin
        .from('support_tickets')
        .insert({
            contact_id,
            organization_id,
            subject,
            description,
            device_id: device_id || null,
            location_id: req.body.location_id || null,
            status_id: 1, // Default 'Open'
            priority_id: req.body.priority_id || (
                // Smart Priority Inference (Fallback)
                /server|down|fail|urgent|critical|broken/i.test(subject + " " + description) ? 3 : 2
            ) // 3=High, 2=Medium
        })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    const { handleBotMessage } = require('../services/botService');

    // 2. TRIGGER THE BOT AGENT (Zero Latency)
    // Instead of a static message, we ask the Bot to "READ" the ticket description 
    // and respond immediately.

    // We mock a Socket object because the botService expects one to emit events.
    // In this API context, we just want it to save to DB. Real-time emit might fail if we don't pass real socket,
    // but the critical part is DB saving. Ideally, we refactor botService to separate Logic from Socket Emit.
    // For now, we pass a dummy socket to avoid crashes.
    const dummySocket = { emit: () => { } };

    // We combine Subject + Description as the "User Message" for the Bot
    const initialUserMessage = `${subject}. ${description}`;

    // Fire and Forget (remove await to prevent blocking the UI response)
    // We catch errors so they don't crash the server process
    handleBotMessage(dummySocket, ticket.ticket_id, initialUserMessage, contact_id)
        .catch(err => console.error("❌ Bot Error (Background):", err));

    res.json(ticket);
});

// GET /api/tickets/:id/messages (Chat History)
router.get('/:id/messages', async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('message_time', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

module.exports = router;