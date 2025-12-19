import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import MyDevices from './pages/MyDevices';
import { LogOut, User } from 'lucide-react';

function ProtectedLayout() {
    const { user, profile, loading, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    }

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (!profile) return <div className="flex h-screen items-center justify-center text-red-500">Access Denied: No Contact Profile Found.</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900 hover:text-blue-600 transition flex items-center gap-2">
                        URACK IT
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link to="/my-devices" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
                            My Workspace
                        </Link>
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-sm font-semibold text-slate-700">{profile.fullName}</span>
                                <span className="text-xs text-slate-500">{user.email}</span>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <User size={18} />
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                title="Sign Out"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <Outlet />
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<ProtectedLayout />}>
                        {/* 3-Pane Dashboard is the ONLY view now */}
                        <Route path="/" element={<Dashboard />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;