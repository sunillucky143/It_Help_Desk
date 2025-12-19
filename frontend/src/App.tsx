import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Organizations from './pages/Organizations';
import Agents from './pages/Agents';
import Devices from './pages/Devices';
import Metadata from './pages/Metadata';
import Tickets from './pages/Tickets';
import Chatbot from './pages/Chatbot';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="agents" element={<Agents />} />
            <Route path="devices" element={<Devices />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="metadata" element={<Metadata />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
