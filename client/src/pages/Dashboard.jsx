// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { getMyAssets, getMyTickets, createTicket } from '../api';
import ChatWindow from '../components/ChatWindow';
import { Monitor, Smartphone, HardDrive, Plus, Search, Activity, Cpu, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ user: propUser }) {
    return <DashboardContent />;
}

function DashboardContent() {
    const { user, profile } = useAuth();
    const [assets, setAssets] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);

    // Filter State
    const [showClosed, setShowClosed] = useState(false);

    // New Ticket Form State
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [showHistory, setShowHistory] = useState(false); // Asset History Toggle
    const [priorityId, setPriorityId] = useState(2); // 1=Low, 2=Medium, 3=High
    const [newSubject, setNewSubject] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // 1. Fetch Data (Reactive to History Toggle)
    useEffect(() => {
        if (!user || !profile) return;

        getMyAssets(user.email, showHistory).then(assetsData => {
            const validAssets = Array.isArray(assetsData) ? assetsData : [];
            setAssets(validAssets);
            if (validAssets.length > 0 && !selectedAssetId) setSelectedAssetId(validAssets[0].device_id);
        });

        getMyTickets(profile.id).then(ticketsData => {
            setTickets(Array.isArray(ticketsData) ? ticketsData : []);
        });
    }, [user, profile, showHistory]);

    // Smart Form Logic: Priority Inference
    useEffect(() => {
        const text = (newSubject + " " + newDesc).toLowerCase();
        if (/server|down|fail|urgent|critical|broken/i.test(text)) {
            setPriorityId(3); // High
        } else {
            setPriorityId(2);
        }
    }, [newSubject, newDesc]);

    // 2. Handle Create Ticket
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newSubject) return;
        setIsCreating(true);

        try {
            const asset = assets.find(a => a.device_id == selectedAssetId);
            const locationId = asset?.location_id || null;

            const newTicket = await createTicket({
                contact_id: profile.id,
                organization_id: profile.org_id,
                subject: newSubject,
                description: newDesc,
                device_id: selectedAssetId || null,
                location_id: locationId,
                priority_id: priorityId
            });

            if (newTicket && newTicket.ticket_id) {
                setTickets([newTicket, ...tickets]);
                setSelectedTicket(newTicket);
            }
            setShowNewTicket(false);
            setNewSubject('');
            setNewDesc('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    // Helper: Determine Device Health
    const getDeviceHealth = (lastReported) => {
        if (!lastReported) return 'OFFLINE';
        const diff = new Date() - new Date(lastReported);
        const minutes = diff / (1000 * 60);
        return minutes < 10 ? 'ONLINE' : 'OFFLINE';
    };

    const displayedTickets = tickets.filter(t => {
        const isClosed = t.ticket_statuses?.name === 'Closed' || t.ticket_statuses?.name === 'Resolved';
        return showClosed ? isClosed : !isClosed;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6 overscroll-none">
            {/* Main Grid Container with generous gap needed for Split Panel look */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-60px)]">

                {/* PANE 1: My Assets (Clean, White Card) */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <Monitor size={20} className="text-gray-400" /> Assets
                            </h2>
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
                                <input
                                    type="checkbox"
                                    checked={showHistory}
                                    onChange={e => setShowHistory(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs text-gray-600 font-semibold uppercase tracking-wide select-none">History</span>
                            </label>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                            {assets.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2 border-2 border-dashed border-gray-100 rounded-xl">
                                    <Monitor size={32} className="opacity-20" />
                                    No devices found.
                                </div>
                            ) : (
                                assets.map(asset => {
                                    const health = getDeviceHealth(asset.last_reported_time);
                                    const isOnline = health === 'ONLINE';
                                    return (
                                        <div key={asset.device_id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-indigo-100 hover:shadow-md transition-all group relative">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                                                    {isOnline ? <Wifi size={18} /> : <Monitor size={18} />}
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isOnline
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-gray-50 text-gray-500 border-gray-100'
                                                    }`}>
                                                    {health}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-800 text-sm mb-1">{asset.asset_name}</h3>
                                            <p className="text-xs text-gray-500">{asset.manufacturer} {asset.model}</p>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* PANE 2: Ticket List (Clean, White Card) */}
                <div className="lg:col-span-5 flex flex-col h-full">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
                        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h2 className="font-bold text-gray-800 text-lg">Support Tickets</h2>
                            <div className="flex bg-gray-50 p-1 rounded-lg">
                                <button
                                    onClick={() => setShowClosed(false)}
                                    className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all ${!showClosed ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setShowClosed(true)}
                                    className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all ${showClosed ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    History
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white custom-scrollbar">
                            {/* Create Ticket Button / Form */}
                            {!showNewTicket ? (
                                <button
                                    onClick={() => setShowNewTicket(true)}
                                    className="w-full py-3 border border-dashed border-indigo-200 bg-indigo-50/30 rounded-xl text-indigo-500 font-semibold text-sm hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> Create New Ticket
                                </button>
                            ) : (
                                <form onSubmit={handleCreate} className="mb-6 bg-gray-50 p-5 rounded-xl border border-indigo-100 animate-fade-in-up">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">New Ticket Details</h3>
                                        <div className="flex items-center gap-3">
                                            {priorityId === 3 && (
                                                <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded border border-rose-200 font-bold uppercase">High Priority</span>
                                            )}
                                            <button type="button" onClick={() => setShowNewTicket(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600">CANCEL</button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Asset</label>
                                            <select
                                                className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                                                value={selectedAssetId}
                                                onChange={e => setSelectedAssetId(e.target.value)}
                                            >
                                                <option value="">No specific asset</option>
                                                {assets.map(a => (
                                                    <option key={a.device_id} value={a.device_id}>{a.asset_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <input
                                            autoFocus
                                            className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                                            placeholder="Subject"
                                            value={newSubject}
                                            onChange={e => setNewSubject(e.target.value)}
                                        />
                                        <textarea
                                            className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm text-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none h-24 resize-none"
                                            placeholder="Description..."
                                            value={newDesc}
                                            onChange={e => setNewDesc(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isCreating}
                                            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                        >
                                            {isCreating ? 'Creating...' : 'Submit Ticket'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {displayedTickets.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-400 text-sm">No tickets found.</p>
                                </div>
                            ) : (
                                displayedTickets.map(t => (
                                    <div
                                        key={t.ticket_id}
                                        onClick={() => setSelectedTicket(t)}
                                        className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 group relative
                                        ${selectedTicket?.ticket_id === t.ticket_id
                                                ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-100'
                                                : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                                            }
                                    `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800 text-sm truncate pr-2">#{t.ticket_id} {t.subject}</span>
                                            <StatusBagde status={t.ticket_statuses?.name} />
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{t.description}</p>
                                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                                            <span>{new Date(t.created_at).toLocaleDateString()}</span>
                                            {t.device && <span className="flex items-center gap-1 text-gray-500"><Monitor size={10} /> {t.device.asset_name}</span>}
                                        </div>
                                    </div>
                                )))}
                        </div>
                    </div>
                </div>

                {/* PANE 3: Chat Window (Clean, White Shadow Card) */}
                <div className="lg:col-span-4 h-full flex flex-col">
                    {selectedTicket ? (
                        <div className="h-full rounded-2xl shadow-sm border border-gray-100 overflow-hidden bg-white">
                            <ChatWindow ticket={selectedTicket} userId={profile?.id} />
                        </div>
                    ) : (
                        <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Search size={28} className="text-gray-300" />
                            </div>
                            <h3 className="font-bold text-gray-700 text-base mb-1">No Ticket Selected</h3>
                            <p className="text-sm text-gray-400">Select a ticket to verify details or chat with support.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

function StatusBagde({ status }) {
    const s = status?.toLowerCase() || 'open';
    const styles = {
        'open': 'bg-blue-50 text-blue-600 border-blue-100',
        'in progress': 'bg-violet-50 text-violet-600 border-violet-100',
        'resolved': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'closed': 'bg-gray-100 text-gray-500 border-gray-200',
        'escalated': 'bg-amber-50 text-amber-600 border-amber-100'
    };
    return (
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${styles[s] || styles['closed']}`}>
            {status || 'Open'}
        </span>
    );
}