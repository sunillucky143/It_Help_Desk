const aiService = require('./src/services/aiService');
const dotenv = require('dotenv');
dotenv.config();

// Mock ID (Alice's Ticket) - You might need to adjust ID if not 1, but usually seed starts at 1
const TEST_TICKET_ID = 2;

async function test() {
    console.log('--- Testing AI Service ---');

    // Test Case 1: Wifi
    await aiService.analyzeAndReply(TEST_TICKET_ID, "My Wifi is slow", {
        to: (room) => ({
            emit: (evt, data) => console.log(`[MOCK IO] Emitted to ${room}:`, data.content)
        })
    });

    // Wait for async timeout
    setTimeout(() => {
        console.log('--- Test Complete ---');
    }, 2000);
}

test();
