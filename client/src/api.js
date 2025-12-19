// src/api.js
const API_URL = 'http://localhost:3000/api';

export async function login(email) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    return res.json();
}

export async function getMyAssets(email, history = false) {
    const res = await fetch(`${API_URL}/devices?email=${email}&history=${history}`);
    return res.json();
}

export async function getMyTickets(userId) {
    const res = await fetch(`${API_URL}/tickets?userId=${userId}`);
    return res.json();
}

export async function createTicket(ticketData) {
    const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
    });
    return res.json();
}

export async function getTicketMessages(ticketId) {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/messages`);
    return res.json();
}