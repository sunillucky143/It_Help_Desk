import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import organizationRoutes from './routes/organizationRoutes';
import agentRoutes from './routes/agentRoutes';
import deviceRoutes from './routes/deviceRoutes';
import metadataRoutes from './routes/metadataRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authRoutes from './routes/authRoutes';
import ticketRoutes from './routes/ticketRoutes';
import chatbotRoutes from './routes/chatbotRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
