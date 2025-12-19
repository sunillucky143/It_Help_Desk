import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

export default function NewTicket() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        deviceId: '',
        priorityId: '2'
    });
    const [submitting, setSubmitting] = useState(false);
    const [priorityHint, setPriorityHint] = useState(null);

    useEffect(() => {
        const fetchDevices = async () => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch('http://localhost:3000/api/devices', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDevices(data);
                if (data.length === 1) {
                    setFormData(prev => ({ ...prev, deviceId: data[0].device_id }));
                }
            }
        };
        fetchDevices();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Priority Hint Logic
        if (name === 'subject' || name === 'description') {
            const text = ((name === 'subject' ? value : formData.subject) + " " + (name === 'description' ? value : formData.description)).toLowerCase();
            if (text.includes('down') || text.includes('crash') || text.includes('urgent')) {
                setPriorityHint(true);
            } else {
                setPriorityHint(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch('http://localhost:3000/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    priorityId: priorityHint ? '3' : '2', // Auto-escalate if hinted
                    locationId: profile.locationId || 1
                })
            });

            if (res.ok) {
                navigate('/');
            } else {
                const err = await res.json();
                alert('Error creating ticket: ' + err.error);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to submit ticket');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-6 text-sm font-medium transition-colors w-fit">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="mb-8 border-b border-slate-100 pb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Submit a Request</h2>
                    <p className="text-slate-500 mt-1">Describe the issue you are experiencing.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Topic / Subject</label>
                        <input
                            type="text"
                            name="subject"
                            required
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="e.g., Laptop Screen Flickering"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Affected Device</label>
                        <select
                            name="deviceId"
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 outline-none transition-all"
                            value={formData.deviceId}
                            onChange={handleChange}
                        >
                            <option value="">-- Select Device --</option>
                            {devices.map(d => (
                                <option key={d.device_id} value={d.device_id}>
                                    {d.name} ({d.model_name}) - {d.status}
                                </option>
                            ))}
                        </select>
                        {devices.length === 0 && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertTriangle size={12} /> No assigned devices found.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                        <textarea
                            name="description"
                            rows={5}
                            required
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Please provide as much detail as possible..."
                        />
                    </div>

                    {priorityHint && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                            <AlertTriangle className="text-amber-600 mt-0.5" size={18} />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">High Priority Detected</p>
                                <p className="text-xs text-amber-700">Based on your description, we've flagged this as urgent.</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={18} />
                            {submitting ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
