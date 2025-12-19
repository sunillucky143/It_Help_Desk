import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { getTicketMessages } from '../api';
import { Send, Bot, User, Sparkles } from 'lucide-react';

// Connect to the backend once (Singleton pattern)
const socket = io('http://localhost:3000');

export default function ChatWindow({ ticket, userId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Helper: Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!ticket) return;

        // 1. Load History from Database (via API)
        getTicketMessages(ticket.ticket_id).then(data => {
            const formatted = data.map(m => ({
                content: m.content,
                type: m.message_type,
                sender: m.sender_agent_id ? 'Support Bot' : 'Me',
                time: m.message_time
            }));
            setMessages(formatted);
        });

        // 2. Join the Real-Time Room
        socket.emit('join_ticket', ticket.ticket_id);

        // 3. Listen for New Messages
        const handleNewMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };

        socket.on('receive_message', handleNewMessage);

        return () => {
            socket.off('receive_message', handleNewMessage);
        };
    }, [ticket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        socket.emit('send_message', {
            ticketId: ticket.ticket_id,
            content: input,
            senderId: userId
        });

        setInput('');
    };

    return (
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 flex flex-col h-[600px] overflow-hidden relative">

            {/* Header */}
            <div className={`p-5 border-b border-indigo-50/50 flex justify-between items-center transition-colors duration-500 relative z-10 ${messages.some(m => m.sender === 'System') ? 'bg-amber-50/80' : 'bg-white/40'
                }`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                            AI Concierge
                            {messages.some(m => m.sender === 'System') && (
                                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide font-bold animate-pulse">
                                    Human Agent Joined
                                </span>
                            )}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ticket #{ticket.ticket_id}</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-gradient-to-b from-transparent to-white/30">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <Sparkles size={32} className="text-indigo-400 mb-3" />
                        <p className="text-sm font-medium text-slate-500">How can I help you today?</p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const isBot = msg.sender === 'Support Bot';
                    const isMe = msg.sender === 'Me';
                    return (
                        <div
                            key={idx}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up group`}
                        >
                            <div className={`max-w-[85%] flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm text-xs font-bold ${isMe ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'
                                    }`}>
                                    {isMe ? <User size={14} /> : <Bot size={14} />}
                                </div>

                                <div
                                    className={`p-4 rounded-3xl text-sm shadow-sm relative transition-all duration-300 ${isMe
                                        ? 'bg-indigo-600 text-white rounded-tr-sm chat-bubble-me'
                                        : isBot
                                            ? 'bg-white border border-indigo-50 text-slate-700 rounded-tl-sm chat-bubble-bot shadow-md'
                                            : 'bg-amber-50 border border-amber-100 text-slate-800 rounded-tl-sm' // Human Agent
                                        }`}
                                >
                                    {msg.type === 'image' ? (
                                        <img src={msg.content} alt="Attachment" className="max-w-full rounded-2xl border border-white/20 shadow-sm" />
                                    ) : (
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    )}
                                    <span className={`text-[9px] block mt-1 text-right font-medium opacity-0 group-hover:opacity-60 transition ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {new Date(msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white/60 backdrop-blur-lg border-t border-white/50">
                <div className="relative flex items-center shadow-lg rounded-full bg-white ring-1 ring-black/5 hover:ring-indigo-200 transition-all focus-within:ring-2 focus-within:ring-indigo-400">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent px-6 py-3.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="mr-1.5 bg-indigo-600 text-white rounded-full p-2.5 hover:bg-indigo-700 transition disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-md transform active:scale-90"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}