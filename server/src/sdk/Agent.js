const { OpenAI } = require('openai');

class Agent {
    constructor(name, config) {
        this.name = name;
        this.model = config.model || 'gpt-4o';
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.handoff = config.handoff; // The Handoff Module
    }

    async think(ticketId, userMessage, promptObject) {
        // 1. CHECK HANDOFF FIRST (The Guardrail)
        if (this.handoff.shouldHandoff(userMessage)) {
            return await this.handoff.execute(ticketId);
        }

        // 2. BUILD PROMPT
        const systemMsg = promptObject.build();

        // 3. CALL LLM (The Thinking)
        try {
            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: "system", content: systemMsg },
                    { role: "user", content: userMessage }
                ]
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error("Agent Brain Freeze:", error);
            // Fallback for when OpenAI api key is missing or invalid or network error
            return "I am having trouble connecting to my knowledge base. Please check the system logs.";
        }
    }
}

module.exports = Agent;
