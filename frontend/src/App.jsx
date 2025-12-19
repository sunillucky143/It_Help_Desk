import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "./App.css";

import { supabase } from "./supabaseClient";
import { fetchInbox, toggleAvailability, getMe } from "./api";
import socket from "./socket";

import TicketList from "./components/TicketList";
import InteractionPane from "./components/InteractionPane";
import DeviceInsight from "./components/DeviceInsight";

export default function App() {
  const [session, setSession] = useState(null);
  const token = useMemo(() => session?.access_token || null, [session]);

  // Load session on refresh + subscribe to auth changes
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // If supabase env missing, show a clear message
  if (!supabase) {
    return (
      <div className="signin-container">
        <div className="signin-card">
          <div className="signin-logo">
            <h1>⚠️ Configuration Required</h1>
            <p>Missing Supabase environment variables</p>
          </div>
          <div style={{ background: "var(--bg-tertiary)", padding: 16, borderRadius: 8, fontSize: 13 }}>
            <p style={{ marginBottom: 12 }}>Add these to your frontend <code>.env</code> file:</p>
            <code style={{ display: "block", color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}>
              REACT_APP_SUPABASE_URL=your_url<br />
              REACT_APP_SUPABASE_ANON_KEY=your_key
            </code>
            <p style={{ marginTop: 12, color: "var(--text-muted)" }}>Then restart the frontend server.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!token) return <AgentSignIn />;

  return <AgentPortal token={token} onLogout={() => supabase.auth.signOut()} />;
}

function AgentPortal({ token, onLogout }) {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const qc = useQueryClient();

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token),
    retry: false,
  });

  const inboxQ = useQuery({
    queryKey: ["inbox"],
    queryFn: () => fetchInbox(token),
    enabled: !!token,
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Socket.io for real-time inbox updates
  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    socket.connect();

    socket.on("inbox:refresh", () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
    });

    socket.on("agent:availability", () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    });

    return () => {
      socket.off("inbox:refresh");
      socket.off("agent:availability");
    };
  }, [token, qc]);

  const me = meQ.data;
  const isAvailable = !!me?.is_available;

  return (
    <div className="app">
      {/* Left Pane - Ticket List */}
      <div className="left">
        <div className="top-bar">
          <div className="agent-info">
            <label 
              className={`availability-toggle ${isAvailable ? "available" : ""}`}
              title={isAvailable ? "You are available for new tickets" : "You are unavailable"}
            >
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) =>
                  toggleAvailability(token, e.target.checked).then(() => meQ.refetch())
                }
              />
              <div className="toggle-track">
                <div className="toggle-thumb" />
              </div>
              <span className="toggle-label">
                {isAvailable ? "Available" : "Away"}
              </span>
            </label>
          </div>

          <button className="btn ghost sm" onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>

        <div className="inbox-header">
          Unified Inbox
          {meQ.isLoading ? null : (
            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 400, letterSpacing: 0 }}>
              {me?.full_name || me?.email}
            </span>
          )}
        </div>

        <TicketList
          inbox={inboxQ.data || []}
          onSelect={setSelectedTicket}
          selectedTicket={selectedTicket}
        />

        {inboxQ.isLoading && (
          <div className="loading">
            <div className="spinner" />
          </div>
        )}
      </div>

      {/* Center Pane - Interaction */}
      <div className="center">
        <InteractionPane token={token} ticketId={selectedTicket} />
      </div>

      {/* Right Pane - Device Insight */}
      <div className="right">
        <DeviceInsight token={token} ticketId={selectedTicket} />
      </div>
    </div>
  );
}

function AgentSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-logo">
          <h1>IT Help Desk</h1>
          <p>Agent Portal</p>
        </div>

        <form className="signin-form" onSubmit={onSubmit}>
          {error && (
            <div
              style={{
                background: "rgba(255, 71, 87, 0.1)",
                border: "1px solid rgba(255, 71, 87, 0.3)",
                color: "#ff4757",
                padding: "12px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="field-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              className="signin-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="signin-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="signin-btn" type="submit" disabled={busy}>
            {busy ? (
              <>
                <span
                  className="spinner"
                  style={{
                    width: 16,
                    height: 16,
                    borderWidth: 2,
                    display: "inline-block",
                    verticalAlign: "middle",
                    marginRight: 8,
                  }}
                />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: "1px solid var(--border-color)",
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          <p>Support Agent Portal v1.0</p>
          <p style={{ marginTop: 4 }}>Contact IT Admin for access credentials</p>
        </div>
      </div>
    </div>
  );
}
