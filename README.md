# IT Help Desk - Requester Portal

A Mono-repo MERN stack application for IT Ticket Management.

## Structure
- `/server`: Node.js Express API + Socket.io + Supabase
- `/client`: React + Vite + TailwindCSS

## Prerequisites
- Node.js (v18+)
- Supabase Project (Credentials in `.env`)

## Setup

1. **Install Dependencies**:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Environment Variables**:
   - Ensure `server/.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
   - Ensure `client/.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Running the App

1. **Start Backend** (Port 3000):
   ```bash
   cd server
   node index.js
   ```

2. **Start Frontend** (Port 5173):
   ```bash
   cd client
   npm run dev
   ```

3. **Access**:
   Open [http://localhost:5173](http://localhost:5173)

## Features
- **Authentication**: Magic Link via Supabase. Mapping to `contacts` table.
- **My Workspace**: View active and history assets.
- **Smart Ticket**: Auto-select device, keyword-based priority.
- **Real-time Chat**: Socket.io powered messaging on tickets.
