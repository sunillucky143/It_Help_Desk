const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const { Server } = require('socket.io');
const { handleBotMessage } = require('./src/services/botService');
const { supabaseAdmin } = require('./src/config/supabase');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"], // Vite default and fallback ports
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Attach IO to request for controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
const authRoutes = require('./src/routes/authRoutes');
const devicesRoutes = require('./src/routes/devicesRoutes');
const ticketsRoutes = require('./src/routes/ticketsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/tickets', ticketsRoutes);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    socket.on('join_ticket', (ticketId) => {
        socket.join(`ticket:${ticketId}`);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    // Handle User Sending a Message
    socket.on('send_message', async ({ ticketId, content, senderId }) => {
        try {
            console.log(`📩 New Message on Ticket ${ticketId}: ${content}`);

            // 1. Save User Message to DB
            const { error } = await supabaseAdmin
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    sender_id: senderId, // Contact ID
                    message_type: 'text', // Default to text
                    content: content,
                    message_time: new Date().toISOString()
                });

            if (error) {
                console.error('Failed to save message:', error);
                return;
            }

            // 2. Broadcast to Room (so user sees it immediately if they have multiple tabs, or just ack)
            // Ideally frontend optimistic updates, but this confirms it.
            // We construct the msg object to match what frontend expects
            const userMsgPayload = {
                ticket_id: ticketId,
                content: content,
                sender: 'Me', // Frontend maps this based on ID, but for realtime we can just send "Me" if we want, or better:
                // sending the raw DB structure is safer if frontend handles mapping.
                // But frontend expects: { content, type, sender, time }
                // Let's send the mapped version for simplicity or raw?
                // ChatWindow.jsx handles raw 'receive_message' by appending.
                // It expects `msg` to have { sender: 'Me', content, type, time }
                sender: 'Me',
                type: 'text',
                time: new Date().toISOString()
            };

            // Emit to EVERYONE in room (including sender if they rely on this for display, 
            // but usually sender appends optimistically. Let's emit to room.)
            io.to(`ticket:${ticketId}`).emit('receive_message', userMsgPayload);

            // 3. Trigger Bot Response
            // We pass the REAL socket here so the bot can emit 'receive_message' back
            await handleBotMessage(io, ticketId, content, senderId);

        } catch (err) {
            console.error('Error in send_message handler:', err);
        }
    });
});