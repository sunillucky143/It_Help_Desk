const { supabaseAdmin } = require('../config/supabase');
const Agent = require('../sdk/Agent');
const Prompt = require('../sdk/Prompt');
const Handoff = require('../sdk/Handoff');

// 1. Initialize Modules
const handoffModule = new Handoff(supabaseAdmin);
const supportBot = new Agent('SupportBot', {
    model: 'gpt-4o',
    handoff: handoffModule
});

async function handleBotMessage(socket, ticketId, userMessage, senderId) {
    try {
        console.log(`🤖 Bot thinking for Ticket ${ticketId}...`);

        // 2. Fetch Dynamic Context (Who is the user? What is the Asset?)
        const { data: ticket, error: ticketError } = await supabaseAdmin
            .from('support_tickets')
            .select(`
                *,
                contacts ( full_name ),
                devices ( asset_name, system_uptime, status )
            `)
            .eq('ticket_id', ticketId)
            .single();

        if (ticketError) throw new Error(`Fetch Ticket Error: ${ticketError.message}`);

        // Default context if DB fetch fails
        const userContext = {
            name: ticket?.contacts?.full_name || "Requester",
            last_asset: ticket?.devices?.asset_name || "Unknown Device",
            uptime: ticket?.devices?.system_uptime || null
        };

        // 3. Construct the Prompt using SDK
        const promptBuilder = new Prompt("You are a helpful IT Support Bot. You solve Tier 1 issues.")
            .withContext("User Name", userContext.name)
            .withContext("Asset Info", userContext.last_asset)
            .withContext("Ticket ID", ticketId);

        // SMART DIAGNOSTIC: Inject Uptime if available
        if (userContext.uptime) {
            promptBuilder.withContext("System Uptime", `${userContext.uptime} (High uptime may cause lag. Suggest reboot)`);
        }

        // 4. Run the Agent
        const reply = await supportBot.think(ticketId, userMessage, promptBuilder);

        // 5. Emit & Save (Standard IO)
        if (socket && typeof socket.emit === 'function') {
            socket.emit('receive_message', { sender: supportBot.name, content: reply });
        }

        // Check if agent ID 1 exists, otherwise this insert might fail if we haven't seeded it.
        // Assuming Agent ID 1 is the bot based on previous files.
        const { error: insertError } = await supabaseAdmin.from('ticket_messages').insert({
            ticket_id: ticketId,
            sender_agent_id: 1,
            content: reply
        });

        if (insertError) console.error("Error saving bot reply:", insertError.message);

    } catch (err) {
        console.error(`ERROR in handleBotMessage (Ticket ${ticketId}):`, err);
    }
}

module.exports = { handleBotMessage };