class Prompt {
    constructor(baseInstruction) {
        this.base = baseInstruction;
        this.context = {};
    }

    // Add dynamic data (e.g., "User is Alice", "Asset is Dell")
    withContext(key, value) {
        this.context[key] = value;
        return this; // Chainable
    }

    build() {
        // Convert context object to a readable string
        const contextStr = Object.entries(this.context)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n');

        return `
            ${this.base}
            
            --- CURRENT CONTEXT ---
            ${contextStr}
            
            --- GUIDELINES ---
            - Be concise.
            - If you see a security risk, suggest a Handoff.
        `;
    }
}

module.exports = Prompt;
