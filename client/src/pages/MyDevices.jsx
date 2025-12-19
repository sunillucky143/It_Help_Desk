import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Monitor, Smartphone, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyDevices() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

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
            }
            setLoading(false);
        };
        fetchDevices();
    }, []);

    const activeDevices = devices.filter(d => d.is_active);
    const historyDevices = devices.filter(d => !d.is_active);

    const DeviceCard = ({ device, isHistory = false }) => (
        <div className={`bg-white rounded shadow p-4 border-l-4 ${isHistory ? 'border-gray-400 opacity-75' : 'border-green-500'}`}>
            <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-full">
                    <Monitor size={24} className="text-gray-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{device.name}</h3>
                    <p className="text-sm text-gray-600">{device.manufacturer} {device.model_name}</p>
                    <div className="text-xs text-gray-500 mt-1">
                        <span className="mr-2">OS: {device.os_version}</span>
                        {!isHistory && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${device.status === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {device.status}
                            </span>
                        )}
                        {isHistory && <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Returning</span>}
                    </div>
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
                Assigned: {new Date(device.assigned_at).toLocaleDateString()}
                {isHistory && ` | Unassigned: ${new Date(device.unassigned_at).toLocaleDateString()}`}
            </div>
        </div>
    );

    return (
        <div>
            <div className="mb-4">
                <Link to="/" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <h2 className="text-2xl font-bold">My Workspace</h2>
            </div>

            {loading ? <div>Loading assets...</div> : (
                <div className="space-y-8">
                    <section>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Active Devices</h3>
                        {activeDevices.length === 0 ? <p className="text-gray-500">No active devices.</p> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeDevices.map(d => <DeviceCard key={d.device_id} device={d} />)}
                            </div>
                        )}
                    </section>

                    {historyDevices.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">Asset History</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {historyDevices.map(d => <DeviceCard key={d.device_id} device={d} isHistory={true} />)}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
