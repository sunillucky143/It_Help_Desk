# URackIT - Admin Portal

IT Help Desk Management System - Admin/Super-Admin Portal

## Overview

The Admin Portal is a comprehensive management interface for the URackIT IT Help Desk system. It provides tools for managing organizations, agents, devices, and system metadata in a multi-tenant architecture.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS
- **State Management**: Zustand + React Query
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL via Supabase
- **AI/LLM**: OpenAI GPT-4o-mini (Multi-Agent Chatbot)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## Features

### 1. 🤖 AI-Powered Multi-Agent Chatbot (NEW!)
- **Natural Language Interface** for all admin operations
- **Multi-Agent Architecture**:
  - Router Agent (Intent Classification)
  - CRUD Agent (Create/Read/Update/Delete Operations)
  - Metrics Agent (Analytics & Statistics)
  - Orchestrator (Agent Coordination)
- **Conversational Admin Tasks**:
  - "Show me all open tickets"
  - "How many devices are offline?"
  - "Create a ticket for Tech Corp about VPN issues"
  - "What are the dashboard metrics?"
- **Real-time Database Integration** via specialized agents
- **Session Management** with conversation history
- **Cost-Effective**: Uses GPT-4o-mini ($0.001-0.003 per conversation)
- 📖 See [MULTI_AGENT_CHATBOT.md](MULTI_AGENT_CHATBOT.md) for full documentation
- 🚀 See [CHATBOT_SETUP.md](CHATBOT_SETUP.md) for quick setup

### 2. Dashboard Home
- KPI Cards showing critical metrics
  - Total Open Tickets
  - Devices Offline
  - Active Bot Agents
  - Active Human Agents
- High-Risk Alerts for organizations requiring human agents
- Agent availability summary
- Quick action buttons

### 3. Support Ticket Management
- View all support tickets with filtering
- Filter by status (Open, In Progress, Resolved, Closed)
- Filter by priority (Low, Medium, High, Critical)
- Detailed ticket view with:
  - Full description and subject
  - Requester information
  - Organization and device details
  - Ticket assignments to agents
  - Message history/comments
- Statistics dashboard showing ticket counts
- Color-coded priority and status badges

### 4. Organization Management
- Create, Read, Update, Delete organizations
- Field validation for unique U/E codes
- Account Manager mapping
- Location type configuration
- Critical toggle for "requires_human_agent"

### 5. Agent Management
- Manage Bot and Human agents
- Specialization tagging
- Real-time availability monitoring
- Toggle agent availability status
- Agent statistics overview

### 6. Global Asset Oversight
- Master inventory of all devices across organizations
- Filter by status (ONLINE/OFFLINE)
- Device information including:
  - Manufacturer and Model
  - Operating System and Architecture
  - IP Address and Gateway
  - Last seen timestamp

### 7. Metadata Manager
- Centralized management of lookup tables:
  - Device Manufacturers & Models (Parent-Child)
  - Operating Systems
  - Processor Architectures
  - Ticket Statuses (with color coding)
  - Ticket Priorities (with SLA hours)
- Dependency checking before deletion
- Prevents "spelling chaos" with standardized entries

### 8. Authentication
- JWT-based authentication (1-hour expiration)
- Role-Based Access Control (RBAC):
  - **Super-Admin**: Full access to all organizations and lookups
  - **Account Manager**: Access only to assigned organizations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install all dependencies (root, backend, and frontend):**
   ```bash
   npm run install-all
   ```

### Development

**Run both backend and frontend concurrently:**
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend dev server on `http://localhost:3000`

**Or run them separately:**

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### Demo Credentials

The application comes with placeholder data and demo users:

**Super Admin:**
- Email: `admin@urackit.com`
- Password: `admin123`

**Account Manager:**
- Email: `manager@urackit.com`
- Password: `manager123`

## Project Structure

```
Admin_portal/
├── backend/
│   ├── src/
│   │   ├── data/
│   │   │   └── mockData.ts          # Placeholder data
│   │   ├── routes/
│   │   │   ├── authRoutes.ts        # Authentication endpoints
│   │   │   ├── organizationRoutes.ts
│   │   │   ├── agentRoutes.ts
│   │   │   ├── deviceRoutes.ts
│   │   │   ├── ticketRoutes.ts      # Ticket management
│   │   │   ├── chatbotRoutes.ts     # Multi-agent chatbot API
│   │   │   ├── metadataRoutes.ts
│   │   │   └── dashboardRoutes.ts
│   │   ├── services/
│   │   │   ├── llmClient.ts         # OpenAI client wrapper
│   │   │   └── agents/              # Multi-agent system
│   │   │       ├── routerAgent.ts   # Intent classification
│   │   │       ├── crudAgent.ts     # CRUD operations
│   │   │       ├── metricsAgent.ts  # Analytics agent
│   │   │       └── orchestrator.ts  # Agent coordinator
│   │   ├── config/
│   │   │   └── supabase.ts          # Supabase client
│   │   └── server.ts                # Express server
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx           # Main layout with sidebar
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Login page
│   │   │   ├── Dashboard.tsx        # Dashboard with KPIs
│   │   │   ├── Chatbot.tsx          # AI Assistant chatbot
│   │   │   ├── Organizations.tsx    # Organization management
│   │   │   ├── Agents.tsx           # Agent management
│   │   │   ├── Devices.tsx          # Device inventory
│   │   │   ├── Tickets.tsx          # Ticket management
│   │   │   └── Metadata.tsx         # Metadata manager
│   │   ├── store/
│   │   │   └── authStore.ts         # Zustand auth state
│   │   ├── lib/
│   │   │   └── api.ts               # Axios instance with interceptors
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── .env                              # Environment variables
├── package.json
└── README.md
```

## Environment Variables

Create a `backend/.env` file:

```env
# Server Configuration
PORT=5000

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Supabase Configuration
SUPABASE_URL=https://zdciritnjaeadbksghko.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI Configuration (for Multi-Agent Chatbot)
OPENAI_API_KEY=sk-your-openai-api-key
```

📖 See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for Supabase integration details
📖 See [CHATBOT_SETUP.md](CHATBOT_SETUP.md) for chatbot setup

## Database Integration

✅ **Supabase is fully integrated!** All routes now connect to your Supabase PostgreSQL database.

- Organizations, Agents, Devices, Tickets all use real data
- Dashboard shows real-time statistics
- Metadata tables for lookups (statuses, priorities, manufacturers, etc.)
- Complex joins for related data

📖 See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for setup instructions

## Key Features Implementation

### Dependency Checking
When deleting manufacturers, the system checks if they have associated models:
```typescript
// Example from metadataRoutes.ts
const hasModels = mockDeviceModels.some(m => m.manufacturer_id === parseInt(req.params.id));
if (hasModels) {
  return res.status(400).json({
    message: 'Dependency Error: Cannot delete manufacturer with existing models',
    type: 'dependency_error'
  });
}
```

### Agent Availability Toggle
Real-time agent status updates with visual feedback:
```typescript
router.patch('/:id/availability', (req, res) => {
  agent.is_available = !agent.is_available;
  res.json(agent);
});
```

### High-Risk Alerts
Dashboard automatically detects organizations that require human agents but none are available:
```typescript
const highRiskAlerts = mockOrganizations
  .filter(org => org.requires_human_agent)
  .filter(alert => alert.available_human_agents === 0);
```

## Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/verify` - Verify JWT token

### Organizations
- `GET /api/organizations` - Get all organizations
- `GET /api/organizations/:id` - Get organization by ID
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization
- `GET /api/organizations/managers/all` - Get all account managers

### Agents
- `GET /api/agents` - Get all agents
- `GET /api/agents/:id` - Get agent by ID
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `PATCH /api/agents/:id/availability` - Toggle agent availability
- `DELETE /api/agents/:id` - Delete agent

### Devices
- `GET /api/devices` - Get all devices (supports ?status=ONLINE|OFFLINE filter)
- `GET /api/devices/:id` - Get device by ID
- `POST /api/devices` - Create device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Metadata
- `GET /api/metadata/manufacturers` - Get all manufacturers
- `POST /api/metadata/manufacturers` - Create manufacturer
- `PUT /api/metadata/manufacturers/:id` - Update manufacturer
- `DELETE /api/metadata/manufacturers/:id` - Delete manufacturer
- Similar endpoints for: models, operating-systems, processor-architectures, ticket-statuses, ticket-priorities

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-tickets` - Get recent tickets
- `GET /api/dashboard/agent-availability` - Get agent availability summary

### Tickets
- `GET /api/tickets` - Get all tickets (supports ?status=1&priority=3 filters)
- `GET /api/tickets/:id` - Get ticket by ID with messages and assignments
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `PATCH /api/tickets/:id/assign` - Assign ticket to agent
- `POST /api/tickets/:id/comments` - Add comment/message to ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `GET /api/tickets/stats/summary` - Get ticket statistics

### Chatbot (Multi-Agent AI)
- `POST /api/chatbot/message` - Send message to chatbot (returns AI response)
- `GET /api/chatbot/history/:userId` - Get chat history for user
- `DELETE /api/chatbot/history/:userId` - Clear chat history

## Security Features

- JWT authentication with 1-hour token expiration
- Password validation (to be enhanced with bcrypt in production)
- Role-based access control (RBAC)
- Axios interceptors for automatic token injection
- Protected routes with authentication guards
- Automatic logout on token expiration

## Completed Features

- ✅ PostgreSQL/Supabase database integration
- ✅ Multi-agent AI chatbot for natural language admin operations
- ✅ Support ticket management with full CRUD
- ✅ Real-time dashboard metrics from database
- ✅ Complex database joins for related data
- ✅ Metadata management with dependency checking

## Future Enhancements

- [ ] Implement bcrypt password hashing
- [ ] Add refresh token mechanism
- [ ] Real-time updates with WebSockets/Supabase Realtime
- [ ] Audit logs for all CRUD operations
- [ ] Export data to Excel/CSV
- [ ] Advanced filtering and search
- [ ] Pagination for large datasets
- [ ] Dark mode support
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Voice interface for chatbot
- [ ] Multi-language support
- [ ] Predictive analytics with AI

## License

MIT

## Support

For issues and questions, please contact the development team.
