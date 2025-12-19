# URack IT - Human Agent Portal

## 🎯 Features

- ✅ **Unified Inbox** - Priority-based ticket queue with search and filtering
- ✅ **Real-time Messaging** - Socket.io powered chat with typing indicators
- ✅ **Device Telemetry** - Live device diagnostics and health monitoring
- ✅ **Internal Notes** - Agent-only notes for collaboration
- ✅ **Bot-to-Human Handoff** - Seamless transition from bot to human agents
- ✅ **Ticket Escalation** - Transfer tickets to specialists with reason tracking
- ✅ **Availability Toggle** - Control agent availability status
- ✅ **High Compliance Indicators** - Visual alerts for data center tickets
- ✅ **Stale Data Warnings** - Automatic detection of outdated device data (>24h)
- ✅ **Three-Pane Workspace** - Optimized layout for efficient ticket management

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, React Query, Socket.io-client |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | PostgreSQL (Supabase) |
| **Authentication** | Supabase Auth (JWT) |
| **Real-time** | Socket.io (WebSockets) |

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm installed
- **PostgreSQL database** (Supabase recommended)
- **Supabase account** (for authentication)

## 📁 Project Structure

```
It_Help_Desk/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── index.js      # Server entry point
│   │   ├── db.js         # Database connection
│   │   ├── auth.js       # Authentication middleware
│   │   └── routes/       # API routes
│   ├── migrations/       # Database migrations
│   └── seed_test_data.js # Test data seeder
│
├── frontend/             # React application
│   ├── src/
│   │   ├── App.jsx       # Main app component
│   │   ├── api.js        # API client
│   │   └── components/   # React components
│   └── public/
│
└── ticket_management_schema.sql  # Database schema
```

## 🚀 Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd It_Help_Desk
```

### Step 2: Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: Found in Settings → API
   - **Database Password**: Set during project creation

### Step 3: Set Up Database

1. **Run the schema**:
   ```bash
   # Using Supabase SQL Editor or psql
   psql "your-connection-string" -f ticket_management_schema.sql
   ```

2. **Run migrations**:
   ```bash
   cd backend
   node migrate.js
   ```

### Step 4: Configure Backend

1. Create `backend/.env`:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   
   # Database Connection (Supabase)
   DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
   
   # Server Configuration
   PORT=4000
   AUTO_PROVISION_AGENT=true
   ```

   **Note**: URL-encode special characters in password (e.g., `@` becomes `%40`)

2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

### Step 5: Configure Frontend

1. Create `frontend/.env`:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   REACT_APP_API_BASE=http://localhost:4000/api
   REACT_APP_SOCKET_URL=http://localhost:4000
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Step 6: Create Test Data (Optional)

1. **Get your Supabase User UUID**:
   - Go to Supabase Dashboard → Authentication → Users
   - Copy the User UID

2. **Update seed script**:
   ```javascript
   // backend/seed_test_data.js
   const AUTH_USER_ID = 'your-user-uuid-here';
   ```

3. **Run seed script**:
   ```bash
   cd backend
   node seed_test_data.js
   ```

   This creates:
   - 3 organizations
   - 5 locations
   - 5 contacts
   - 5 devices
   - 5 tickets
   - Sample messages

## ▶️ Running the Project

### Start Backend Server

```bash
cd backend
npm run dev
```

Server will run at `http://localhost:4000`

### Start Frontend Development Server

```bash
cd frontend
npm start
```

Frontend will run at `http://localhost:3000`

### Access the Application

1. Open `http://localhost:3000` in your browser
2. Sign in with your Supabase credentials
3. If `AUTO_PROVISION_AGENT=true`, your agent record will be created automatically

## 👤 Creating New Users

### Option 1: Auto-Provision (Recommended)

1. Set `AUTO_PROVISION_AGENT=true` in `backend/.env`
2. Create user in Supabase Dashboard → Authentication → Users
3. User can log in immediately (agent record created automatically)

### Option 2: Manual Agent Creation

1. Create user in Supabase Dashboard
2. Copy User UID
3. Create agent record in database:
   ```sql
   INSERT INTO support_agents (full_name, email, agent_type, is_available, auth_user_id)
   VALUES ('Agent Name', 'agent@example.com', 'Human', true, 'user-uuid-from-supabase');
   ```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/me` | GET | Get current agent profile |
| `/api/agents/me/availability` | PATCH | Toggle availability |
| `/api/tickets/inbox` | GET | Get assigned tickets |
| `/api/tickets/:id` | GET | Get ticket details |
| `/api/tickets/:id` | PATCH | Update status/priority |
| `/api/tickets/:id/messages` | POST | Send message |
| `/api/tickets/:id/close` | POST | Close ticket |
| `/api/tickets/:id/escalate` | POST | Escalate ticket |

## 🔐 Environment Variables Reference

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `PORT` | Server port (default: 4000) | No |
| `AUTO_PROVISION_AGENT` | Auto-create agents on login | No |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL | Yes |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `REACT_APP_API_BASE` | Backend API URL | No |
| `REACT_APP_SOCKET_URL` | Socket.io server URL | No |

## 🔧 Troubleshooting

### "Missing bearer token" Error

- Ensure you're logged in
- Check browser localStorage for session
- Clear localStorage and log in again

### "Agent not provisioned" Error

- Set `AUTO_PROVISION_AGENT=true` in backend `.env`
- Or create agent record manually in database

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- URL-encode special characters in password
- Check Supabase database is running
- Verify SSL settings for Supabase

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <process-id> /F

# Mac/Linux
lsof -ti:4000 | xargs kill
```

### Tickets Not Showing

- Verify agent record exists with correct `auth_user_id`
- Check tickets are assigned to your agent
- Verify `assignment_end IS NULL` in database

## 🛠️ Development

### Running Migrations

```bash
cd backend
node migrate.js
```

### Seeding Test Data

```bash
cd backend
# Update AUTH_USER_ID in seed_test_data.js first
node seed_test_data.js
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

## 🔒 Security Notes

- ⚠️ Never commit `.env` files to version control
- 🔑 Use environment variables for all secrets
- 🎫 JWT tokens expire after 1 hour (auto-refreshed)
- 🔐 All API endpoints require authentication
- 🔒 Database connections use SSL in production

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Socket.io Documentation](https://socket.io/docs/v4/)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check backend/frontend console logs

## 📄 License

[Your License Here]

---

**Built with ❤️ using React, Node.js, and Supabase**
