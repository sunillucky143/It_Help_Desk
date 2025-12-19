import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "../api";

export default function EscalateModal({ token, onClose, onSubmit }) {
  const [toAgentId, setToAgentId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agentsQ = useQuery({
    queryKey: ["agents"],
    queryFn: () => fetchAgents(token),
    enabled: !!token,
  });

  const agents = (agentsQ.data || []).filter((a) => a.agent_type === "Human" && a.is_available);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Reason is required for escalation");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ 
        to_agent_id: toAgentId ? Number(toAgentId) : null, 
        reason: reason.trim() 
      });
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h4>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ marginRight: 10, verticalAlign: "middle" }}
          >
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
          Escalate Ticket
        </h4>

        <div className="field">
          <label className="field-label">Transfer To (Optional)</label>
          <select
            className="select"
            value={toAgentId}
            onChange={(e) => setToAgentId(e.target.value)}
          >
            <option value="">Select an agent or leave empty for general escalation</option>
            {agentsQ.isLoading ? (
              <option disabled>Loading agents...</option>
            ) : agents.length === 0 ? (
              <option disabled>No available agents</option>
            ) : (
              agents.map((a) => (
                <option key={a.support_agent_id} value={a.support_agent_id}>
                  {a.full_name || a.email}
                  {a.specialization ? ` — ${a.specialization}` : ""}
                </option>
              ))
            )}
          </select>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
            Only showing available human agents
          </div>
        </div>

        <div className="field">
          <label className="field-label">
            Reason <span style={{ color: "var(--status-critical)" }}>*</span>
          </label>
          <textarea
            className="select"
            rows={4}
            style={{ resize: "vertical", minHeight: 100 }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this ticket needs to be escalated..."
          />
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Escalating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                Escalate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
