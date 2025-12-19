import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  escalateTicket,
  fetchTicket,
  postMessage,
  fetchStatuses,
  fetchPriorities,
  updateTicket,
  closeTicket,
} from "../api";
import EscalateModal from "./EscalateModal";
import socket from "../socket";

export default function InteractionPane({ token, ticketId }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch ticket details
  const ticketQ = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicket(token, ticketId),
    enabled: !!token && !!ticketId,
  });

  // Fetch statuses and priorities for dropdowns
  const statusesQ = useQuery({
    queryKey: ["statuses"],
    queryFn: () => fetchStatuses(token),
    enabled: !!token,
    staleTime: Infinity,
  });

  const prioritiesQ = useQuery({
    queryKey: ["priorities"],
    queryFn: () => fetchPriorities(token),
    enabled: !!token,
    staleTime: Infinity,
  });

  // Socket.io for real-time updates
  useEffect(() => {
    if (!ticketId || !token) return;

    socket.auth = { token };
    socket.connect();
    socket.emit("joinTicket", ticketId);

    socket.on("message", (msg) => {
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    });

    socket.on("typing", ({ from }) => {
      setTypingUser(from);
      setTimeout(() => setTypingUser(null), 2000);
    });

    socket.on("ticket:updated", () => {
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    });

    socket.on("ticket:closed", () => {
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["inbox"] });
    });

    return () => {
      socket.emit("leaveTicket", ticketId);
      socket.off("message");
      socket.off("typing");
      socket.off("ticket:updated");
      socket.off("ticket:closed");
    };
  }, [ticketId, token, qc]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticketQ.data?.messages]);

  // Mutations
  const sendMutation = useMutation({
    mutationFn: ({ content, is_internal }) =>
      postMessage(token, ticketId, { content, is_internal }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (patch) => updateTicket(token, ticketId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => closeTicket(token, ticketId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });

  // Emit typing indicator
  const handleTyping = () => {
    socket.emit("typing", { ticketId });
  };

  if (!ticketId) {
    return (
      <div className="empty-state">
        <div className="empty-icon">💬</div>
        <div className="empty-title">Select a ticket</div>
        <div className="empty-description">
          Choose a ticket from the inbox to view details and start communicating.
        </div>
      </div>
    );
  }

  if (ticketQ.isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  const messages = ticketQ.data?.messages || [];
  const ticket = ticketQ.data?.ticket;
  const statuses = statusesQ.data || [];
  const priorities = prioritiesQ.data || [];
  const isClosed = ticket?.status_name === "Closed";
  const isPrimary = ticket?.is_primary;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header with ticket info and action bar */}
      <div className="pane-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="pane-title">
              {ticket?.subject || `Ticket #${ticketId}`}
            </div>
            <div className="pane-subtitle">
              <span
                className="status-dot"
                style={{
                  background:
                    ticket?.status_name === "Resolved" || ticket?.status_name === "Closed"
                      ? "#26de81"
                      : ticket?.status_name === "Escalated"
                      ? "#ff9f43"
                      : "#00d9ff",
                }}
              />
              {ticket?.status_name || "Unknown"} • {ticket?.priority_name || "No priority"}
              {!isPrimary && <span style={{ marginLeft: 8, opacity: 0.7 }}>(Secondary)</span>}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="action-bar">
          {/* Status dropdown */}
          <select
            className="action-select"
            value={ticket?.status_id || ""}
            onChange={(e) => {
              const newStatusId = parseInt(e.target.value, 10);
              if (newStatusId && newStatusId !== ticket?.status_id) {
                updateMutation.mutate({ status_id: newStatusId });
              }
            }}
            disabled={isClosed || updateMutation.isPending}
          >
            <option value="" disabled>
              Status
            </option>
            {statuses.map((s) => (
              <option key={s.status_id} value={s.status_id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Priority dropdown */}
          <select
            className="action-select"
            value={ticket?.priority_id || ""}
            onChange={(e) => {
              const newPriorityId = parseInt(e.target.value, 10);
              if (newPriorityId && newPriorityId !== ticket?.priority_id) {
                updateMutation.mutate({ priority_id: newPriorityId });
              }
            }}
            disabled={isClosed || updateMutation.isPending}
          >
            <option value="" disabled>
              Priority
            </option>
            {priorities.map((p) => (
              <option key={p.priority_id} value={p.priority_id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Escalate button */}
          <button
            className="btn"
            onClick={() => setShowEscalate(true)}
            disabled={isClosed}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
            Escalate
          </button>

          {/* Close ticket button (only for primary) */}
          {isPrimary && !isClosed && (
            <button
              className="btn danger"
              onClick={() => {
                if (window.confirm("Are you sure you want to close this ticket?")) {
                  closeMutation.mutate();
                }
              }}
              disabled={closeMutation.isPending}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Close Ticket
            </button>
          )}

          {isClosed && (
            <span style={{ fontSize: 12, color: "#26de81", fontWeight: 600 }}>
              ✓ Ticket Closed
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No messages yet</div>
            <div className="empty-description">Start the conversation below.</div>
          </div>
        ) : (
          messages.map((m) => {
            const isBot = m.agent_type === "Bot";
            const isAgent = m.sender_agent_id && !isBot;
            const isContact = m.sender_contact_id;

            return (
              <div
                key={m.message_id}
                className={`message ${isAgent ? "agent" : ""} ${isBot ? "bot" : ""} ${m.is_internal ? "internal" : ""}`}
              >
                {!m.is_internal && !isBot && (
                  <div className="message-sender">
                    {m.sender_agent_name || m.sender_contact_name || (isAgent ? "Agent" : "Contact")}
                  </div>
                )}
                <div className="message-content">{m.content}</div>
                <div className="message-meta">
                  {new Date(m.message_time).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      {!isClosed && (
        <div className="composer">
          <div className="composer-options">
            <label className={`internal-toggle ${isInternal ? "active" : ""}`}>
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Internal Note
            </label>
          </div>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (text.trim()) {
                  sendMutation.mutate({ content: text.trim(), is_internal: isInternal });
                  setText("");
                }
              }
            }}
            rows={3}
            placeholder={isInternal ? "Add an internal note..." : "Type your message..."}
          />

          <div className="composer-actions">
            <div className="typing-indicator">
              {typingUser && `${typingUser} is typing...`}
            </div>
            <button
              className="btn primary"
              onClick={() => {
                if (!text.trim()) return;
                sendMutation.mutate({ content: text.trim(), is_internal: isInternal });
                setText("");
              }}
              disabled={!text.trim() || sendMutation.isPending}
            >
              {sendMutation.isPending ? "Sending..." : isInternal ? "Add Note" : "Send Message"}
            </button>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalate && (
        <EscalateModal
          token={token}
          onClose={() => setShowEscalate(false)}
          onSubmit={(payload) =>
            escalateTicket(token, ticketId, payload)
              .then(() => {
                setShowEscalate(false);
                qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
                qc.invalidateQueries({ queryKey: ["inbox"] });
              })
              .catch((e) => alert(`Escalation failed: ${e.message}`))
          }
        />
      )}
    </div>
  );
}
