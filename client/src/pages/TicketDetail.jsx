import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Send, ArrowLeft, Laptop, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function TicketDetail() {
    const { id } = useParams();
    const { profile } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join_ticket', id);
        });

        newSocket.on('new_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
            // Use timeout to ensure DOM update
            setTimeout(() => scrollToBottom(), 100);
        });

        return () => newSocket.disconnect();
    }, [id]);

    useEffect(() => {
        const fetchTicketDetails = async () => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTicket(data);
                if (data.messages) {
                    const sorted = data.messages.sort((a, b) => new Date(a.message_time) - new Date(b.message_time));
                    setMessages(sorted);
                }
            }
        };
        fetchTicketDetails();
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch(`http://localhost:3000/api/tickets/${id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newMessage,
                    messageType: 'text'
                })
            });

            if (res.ok) {
                setNewMessage('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!ticket) return (
        <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
            {/* Header Section */}
            <div>
                <Link to="/" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-4 text-sm font-medium transition-colors w-fit">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-800">{ticket.subject}</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono">#{ticket.ticket_id}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                                <AlertCircle size={14} />
                                {ticket.priority?.name} Priority
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle size={14} />
                                {ticket.status?.name}
                            </div>
                        </div>
                    </div>
                    {ticket.device && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                <Laptop size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-900">{ticket.device.asset_name}</p>
                                <p className="text-xs text-blue-700">{ticket.device.model?.name}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Section */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">Discussion History</h3>
                    <span className="text-xs text-slate-400 ml-2">Real-time Encrypted</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
                    {/* Original Request Bubble */}
                    <div className="flex justify-center my-4">
                        <div className="bg-white border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-full shadow-sm">
                            Ticket created on {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-sm">
                            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Original Description</p>
                            <p className="text-slate-800 leading-relaxed">{ticket.description}</p>
                        </div>
                    </div>

                    {messages.map((msg, idx) => {
                        const isMyMessage = Number(msg.sender_contact_id) === Number(profile.contactId);
                        const isBot = msg.sender_agent?.agent_type === 'Bot';

                        return (
                            <div key={msg.message_id || idx} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                <div className={`
                                    rounded-2xl p-4 max-w-[85%] shadow-sm relative
                                    ${isMyMessage
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : isBot
                                            ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-900 rounded-bl-none'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                                    }
                                `}>
                                    <div className={`text-[10px] mb-1 font-bold uppercase tracking-wider flex items-center gap-1 ${isMyMessage ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {isMyMessage ? 'You' : (msg.sender_agent?.full_name || 'Support Agent')}
                                        {isBot && <span className="bg-indigo-100 text-indigo-600 px-1 rounded">AI</span>}
                                    </div>
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    <div className={`text-[10px] mt-2 text-right ${isMyMessage ? 'text-blue-200' : 'text-slate-400'}`}>
                                        {new Date(msg.message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-3 items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm py-2.5 px-4 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
