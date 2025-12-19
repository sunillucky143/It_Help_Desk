const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize internal client (re-reading env vars for service isolation)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) console.error('[AI] CRITICAL: Missing Env Vars in Service');
const supabase = createClient(supabaseUrl, supabaseKey);

class AIService {

    constructor() {
        this.botName = 'Support Bot';
        this.botAgentId = null; // Will fetch on first use
    }

    async getBotId() {
        if (this.botAgentId) return this.botAgentId;

        // Try to find by EMAIL (more stable than name)
        const { data } = await supabase
            .from('support_agents')
            .select('support_agent_id')
            .eq('email', 'bot@system.com')
            .single();

        if (data) {
            this.botAgentId = data.support_agent_id;
            console.log('[AI] Found Bot ID:', this.botAgentId);
        } else {
            console.log('[AI] Support Bot not found (by email). Creating one now...');
            const { data: newBot, error } = await supabase.from('support_agents').insert({
                full_name: this.botName,
                email: 'bot@system.com',
                agent_type: 'Bot',
                is_available: true
            }).select('support_agent_id').single();

            if (error) {
                console.error('[AI] Failed to auto-create bot:', error);
                return null;
            }
            this.botAgentId = newBot.support_agent_id;
            console.log('[AI] Created Support Bot with ID:', this.botAgentId);
        }
        return this.botAgentId;
    }

    determineResponse(message) {
        const lower = message.toLowerCase();

        if (lower.includes('password') || lower.includes('login') || lower.includes('reset')) {
            return "I can help with credentials. Please visit https://id.urackit.com/reset to self-service your password reset. If you are locked out, let me know.";
        }
        if (lower.includes('wifi') || lower.includes('internet') || lower.includes('connect')) {
            return "Connectivity issues are usually resolved by forgetting the network and re-joining. Please try connecting to 'URACK-GUEST' as a backup.";
        }
        if (lower.includes('slow') || lower.includes('lag') || lower.includes('crash')) {
            return "Performance issues can often be fixed with a restart. Have you tried turning it off and on again? If the issue persists, please provide your Asset Tag.";
        }
        if (lower.includes('screen') || lower.includes('monitor') || lower.includes('display')) {
            return "For display issues, please check your HDMI/DisplayPort cable connections. If it's a laptop screen, unfortunately this will require a hardware swap.";
        }
        if (lower.includes('vpn')) {
            return "Ensure your RSA token is active. You may need to resync your authenticator app.";
        }

        return "I've updated your ticket with these details. A human agent (perhaps Sarah) will review your case shortly.";
    }

    async analyzeAndReply(ticketId, userMessage, io) {
        console.log(`[AI] Analyzing message: "${userMessage}" for Ticket ${ticketId}`);

        // 1. Get Bot Identity
        const botId = await this.getBotId();
        if (!botId) {
            console.error('[AI] Abort: Support Bot ID not found.');
            return;
        }

        // 2. Think... (Simulate small delay for realism)
        setTimeout(async () => {
            console.log('[AI] Thinking complete. Generating response...');
            const replyContent = this.determineResponse(userMessage);

            // 3. Save Message to DB
            const { data, error } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    sender_agent_id: botId,
                    content: replyContent,
                    message_type: 'text'
                })
                .select(`
                    *,
                    sender_agent:support_agents(full_name, agent_type)
                `)
                .single();

            if (error) {
                console.error('AI Service Error:', error);
                return;
            }

            // 4. Emit Real-time Event
            if (io) {
                io.to(`ticket:${ticketId}`).emit('new_message', data);
            }

        }, 1500); // 1.5s delay
    }
}

module.exports = new AIService();
