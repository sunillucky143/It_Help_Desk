const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

async function apiFetch(path, token, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  // Some endpoints may return empty responses
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;

  return res.json();
}

export const getMe = (token) => apiFetch("/agents/me", token);

export const fetchAgents = (token) => apiFetch("/agents", token);

export const toggleAvailability = (token, isAvailable) =>
  apiFetch("/agents/me/availability", token, {
    method: "PATCH",
    body: JSON.stringify({ is_available: !!isAvailable }),
  });

export const fetchInbox = (token) => apiFetch("/tickets/inbox", token);

export const fetchTicket = (token, ticketId) =>
  apiFetch(`/tickets/${ticketId}`, token);

export const postMessage = (token, ticketId, payload) =>
  apiFetch(`/tickets/${ticketId}/messages`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchStatuses = (token) => apiFetch("/tickets/meta/statuses", token);

export const fetchPriorities = (token) =>
  apiFetch("/tickets/meta/priorities", token);

export const updateTicket = (token, ticketId, patch) =>
  apiFetch(`/tickets/${ticketId}`, token, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

export const closeTicket = (token, ticketId) =>
  apiFetch(`/tickets/${ticketId}/close`, token, { method: "POST" });

export const escalateTicket = (token, ticketId, payload) =>
  apiFetch(`/tickets/${ticketId}/escalate`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
