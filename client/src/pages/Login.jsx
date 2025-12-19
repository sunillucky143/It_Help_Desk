import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isMagicLink, setIsMagicLink] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { login, loginWithPassword } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            if (isMagicLink) {
                await login(email);
                setMessage('✨ Check your email for the login link!');
            } else {
                await loginWithPassword(email, password || 'password123');
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-slate-100 to-slate-100">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 mb-4">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">URACK IT</h1>
                    <p className="text-slate-500 mt-2">Sign in to your enterprise portal</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-white">
                    {message && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 text-sm font-medium">{message}</div>}
                    {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2 text-sm font-medium">{error}</div>}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="block w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {!isMagicLink && (
                            <div className="animate-fade-in-up">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        className="block w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                        >
                            {isMagicLink ? 'Send Magic Link' : 'Sign In'}
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                        <p className="text-slate-500 text-sm mb-3">{isMagicLink ? 'Prefer using a password?' : 'Want passwordless access?'}</p>
                        <button
                            type="button"
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                            onClick={() => setIsMagicLink(!isMagicLink)}
                        >
                            {isMagicLink ? 'Login with Password' : 'Login with Magic Link'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
