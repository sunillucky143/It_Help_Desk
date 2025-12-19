import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Laptop,
  Database,
  Ticket,
  Bot,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import ChatWidget from './ChatWidget';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'AI Assistant', href: '/chatbot', icon: Bot },
    { name: 'Organizations', href: '/organizations', icon: Building2 },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Devices', href: '/devices', icon: Laptop },
    { name: 'Tickets', href: '/tickets', icon: Ticket },
    { name: 'Metadata', href: '/metadata', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-gray-900 w-64`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-5 px-3">
            <h2 className="text-xl font-bold text-white">URackIT</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6 px-3 py-2 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">Logged in as</p>
            <p className="text-white font-medium">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>

          <ul className="space-y-2 font-medium">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="absolute bottom-4 left-3 right-3">
            <button
              onClick={logout}
              className="flex items-center w-full p-2 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:ml-64' : ''} transition-all`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Chat Widget - Only show if not on the chatbot page */}
      {location.pathname !== '/chatbot' && <ChatWidget />}
    </div>
  );
}
