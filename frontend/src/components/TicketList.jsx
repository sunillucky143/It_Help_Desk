import React, { useState, useMemo } from "react";

// Calculate time elapsed since ticket creation for SLA display
function getSLADisplay(createdAt) {
  if (!createdAt) return null;
  
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    return { text: `${days}d ${diffHours % 24}h`, urgent: days >= 2 };
  }
  
  return { 
    text: `${diffHours}h ${diffMins}m`, 
    urgent: diffHours >= 8 
  };
}

// Get priority class for styling
function getPriorityClass(priority) {
  if (!priority) return "";
  const p = priority.toLowerCase();
  if (p === "critical") return "critical";
  if (p === "high") return "high";
  if (p === "medium") return "medium";
  return "low";
}

export default function TicketList({ inbox, onSelect, selectedTicket }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, primary, secondary

  // Filter and search tickets
  const filteredTickets = useMemo(() => {
    let result = inbox || [];

    // Apply role filter
    if (filter === "primary") {
      result = result.filter((t) => t.is_primary);
    } else if (filter === "secondary") {
      result = result.filter((t) => !t.is_primary);
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          (t.subject || "").toLowerCase().includes(q) ||
          (t.host_name || "").toLowerCase().includes(q) ||
          (t.public_ip || "").toLowerCase().includes(q) ||
          String(t.ticket_id).includes(q)
      );
    }

    return result;
  }, [inbox, search, filter]);

  const counts = useMemo(() => {
    const all = inbox || [];
    return {
      all: all.length,
      primary: all.filter((t) => t.is_primary).length,
      secondary: all.filter((t) => !t.is_primary).length,
    };
  }, [inbox]);

  return (
    <>
      {/* Search */}
      <div className="search-container">
        <div className="search-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="search"
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        <div className="filter-bar">
          <button
            className={`filter-chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({counts.all})
          </button>
          <button
            className={`filter-chip ${filter === "primary" ? "active" : ""}`}
            onClick={() => setFilter("primary")}
          >
            Primary ({counts.primary})
          </button>
          <button
            className={`filter-chip ${filter === "secondary" ? "active" : ""}`}
            onClick={() => setFilter("secondary")}
          >
            Secondary ({counts.secondary})
          </button>
        </div>
      </div>

      {/* Ticket list */}
      <div className="ticket-list">
        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No tickets found</div>
            <div className="empty-description">
              {search ? "Try adjusting your search" : "Your inbox is empty"}
            </div>
          </div>
        ) : (
          filteredTickets.map((t) => {
            const sla = getSLADisplay(t.created_at);
            const isCompliance = t.requires_human_agent || t.location_requires_human;
            const priorityClass = getPriorityClass(t.priority_name);

            return (
              <div
                key={t.ticket_id}
                className={`ticket-row ${selectedTicket === t.ticket_id ? "selected" : ""} ${isCompliance ? "compliance" : ""}`}
                onClick={() => onSelect(t.ticket_id)}
              >
                <div className="ticket-content">
                  <div className="ticket-title">
                    {t.subject || `Ticket #${t.ticket_id}`}
                  </div>
                  <div className="ticket-sub">
                    {t.host_name || t.public_ip || "No device linked"}
                  </div>
                </div>

                <div className="ticket-meta">
                  <div className={`primary-badge ${t.is_primary ? "" : "secondary"}`}>
                    {t.is_primary ? "Primary" : "Secondary"}
                  </div>
                  
                  <div className={`priority-badge ${priorityClass}`}>
                    {t.priority_name || "—"}
                  </div>

                  {sla && (
                    <div className={`sla-timer ${sla.urgent ? "urgent" : ""}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12,6 12,12 16,14" />
                      </svg>
                      {sla.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
