require("dotenv").config(); // Load env vars FIRST

const express = require("express");
const http = require("http");
const cors = require("cors");
const { attachDb } = require("./db");
const ticketsRouter = require("./routes/tickets");
const agentsRouter = require("./routes/agents");
const { Server } = require("socket.io");
const { verifySupabaseToken } = require("./auth");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(attachDb);

app.set("io", io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing token"));
    const claims = await verifySupabaseToken(token);
    socket.data.user = { sub: claims.sub, email: claims.email };
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("joinTicket", (ticketId) => socket.join(`ticket_${ticketId}`));
  socket.on("leaveTicket", (ticketId) => socket.leave(`ticket_${ticketId}`));
  socket.on("typing", ({ ticketId }) => {
    socket.to(`ticket_${ticketId}`).emit("typing", {
      ticketId,
      from: socket.data.user?.email || "unknown",
    });
  });
});

const { requireAuth, withAgent } = require("./auth");

app.use("/api/agents", requireAuth, withAgent, agentsRouter);
app.use("/api/tickets", requireAuth, withAgent, ticketsRouter);



app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
