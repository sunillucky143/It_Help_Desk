import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTicket } from "../api";

// Check if device data is stale (> 24 hours since last report)
function isDeviceStale(lastReportedTime) {
  if (!lastReportedTime) return true;
  const lastReport = new Date(lastReportedTime);
  const now = new Date();
  const hoursDiff = (now - lastReport) / (1000 * 60 * 60);
  return hoursDiff > 24;
}

// Format bytes to human-readable
function formatMemory(bytes) {
  if (!bytes) return null;
  const gb = Number(bytes) / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

// Format uptime interval
function formatUptime(uptime) {
  if (!uptime) return null;
  // PostgreSQL interval format: "X days HH:MM:SS"
  return String(uptime).replace(/(\d+):(\d+):[\d.]+/, (_, h, m) => `${h}h ${m}m`);
}

// Format time ago
function timeAgo(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (mins > 0) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  return "Just now";
}

function DeviceItem({ label, value, mono = false }) {
  const hasValue = value !== null && value !== undefined && value !== "";
  
  return (
    <div className="device-item">
      <span className="device-label">{label}</span>
      <span className={`device-value ${!hasValue ? "na" : ""}`} style={mono ? { fontFamily: "var(--font-mono)" } : {}}>
        {hasValue ? value : "N/A"}
      </span>
    </div>
  );
}

export default function DeviceInsight({ token, ticketId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicket(token, ticketId),
    enabled: !!token && !!ticketId,
  });

  if (!ticketId) {
    return (
      <div className="device-panel">
        <div className="empty-state">
          <div className="empty-icon">🖥️</div>
          <div className="empty-title">Device Context</div>
          <div className="empty-description">
            Select a ticket to view device telemetry and diagnostics.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="device-panel">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const t = data?.ticket;
  
  if (!t) {
    return (
      <div className="device-panel">
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <div className="empty-title">Unable to load</div>
          <div className="empty-description">Could not fetch device information.</div>
        </div>
      </div>
    );
  }

  const stale = isDeviceStale(t.last_reported_time);
  const deviceOnline = t.device_status === "ONLINE";

  return (
    <div className="device-panel">
      {/* Header */}
      <div className="device-header">
        <span className="device-title">Device Insight</span>
        {t.device_id && (
          <span className={`device-status ${deviceOnline ? "online" : "offline"}`}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: deviceOnline ? "#26de81" : "#ff4757",
                display: "inline-block",
              }}
            />
            {deviceOnline ? "Online" : "Offline"}
          </span>
        )}
      </div>

      {/* Stale warning */}
      {stale && t.device_id && (
        <div className="stale-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Stale Data — Last reported {timeAgo(t.last_reported_time) || "over 24h ago"}
        </div>
      )}

      {!t.device_id ? (
        <div className="empty-state" style={{ padding: "40px 20px" }}>
          <div className="empty-icon">🔗</div>
          <div className="empty-title">No Device Linked</div>
          <div className="empty-description">
            This ticket is not associated with a device.
          </div>
        </div>
      ) : (
        <>
          {/* System Info */}
          <div className="device-section">
            <div className="device-section-title">System</div>
            <div className="device-grid">
              <DeviceItem label="Hostname" value={t.host_name} mono />
              <DeviceItem 
                label="Operating System" 
                value={t.os_name ? `${t.os_name}${t.os_version ? ` ${t.os_version}` : ""}` : t.os_version} 
              />
              <DeviceItem label="Uptime" value={formatUptime(t.system_uptime)} />
              <DeviceItem 
                label="Last Report" 
                value={t.last_reported_time ? timeAgo(t.last_reported_time) : null} 
              />
            </div>
          </div>

          {/* Hardware */}
          <div className="device-section">
            <div className="device-section-title">Hardware</div>
            <div className="device-grid">
              <DeviceItem 
                label="Processor" 
                value={
                  t.processor_manufacturer && t.processor_model
                    ? `${t.processor_manufacturer} ${t.processor_model}`
                    : t.processor_id
                    ? `Processor ID: ${t.processor_id}`
                    : null
                }
              />
              <DeviceItem label="Memory" value={formatMemory(t.total_memory)} />
            </div>
          </div>

          {/* Network */}
          <div className="device-section">
            <div className="device-section-title">Network</div>
            <div className="device-grid">
              <DeviceItem label="Public IP" value={t.public_ip} mono />
              <DeviceItem label="Gateway" value={t.gateway} mono />
            </div>
          </div>

          {/* Update Status */}
          <div className="device-section">
            <div className="device-section-title">Maintenance</div>
            <div className="device-grid">
              <DeviceItem 
                label="Update Status" 
                value={t.update_status_name || (t.update_status_id ? `Status ID: ${t.update_status_id}` : null)} 
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
