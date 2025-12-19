class Handoff {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        // Keywords that trigger immediate human intervention
        this.triggers = ['data center', 'firewall', 'server down', 'breach'];
    }

    shouldHandoff(userMessage) {
        const lower = userMessage.toLowerCase();
        return this.triggers.some(t => lower.includes(t));
    }

    async execute(ticketId) {
        console.log(`🚨 Executing Handoff for Ticket ${ticketId}`);

        // 1. Update Ticket Status in DB
        const { error } = await this.supabase
            .from('support_tickets')
            .update({
                requires_human_agent: true,
                status_id: 3 // 'Escalated'
            })
            .eq('ticket_id', ticketId);

        if (error) console.error("Handoff DB Error:", error);

        return "I have detected a critical issue. I am transferring this ticket to a Senior Human Engineer immediately. Please hold.";
    }
}

module.exports = Handoff;
