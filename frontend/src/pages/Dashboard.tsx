import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Laptop, Ticket, Bot, Users } from 'lucide-react';
import api from '../lib/api';

interface DashboardStats {
  totalOpenTickets: number;
  totalDevicesOffline: number;
  activeBotAgents: number;
  activeHumanAgents: number;
  highRiskAlerts: Array<{
    organization_id: number;
    organization_name: string;
    location_type: string;
    requires_human_agent: boolean;
    available_human_agents: number;
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Open Tickets',
      value: stats?.totalOpenTickets || 0,
      icon: Ticket,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Devices Offline',
      value: stats?.totalDevicesOffline || 0,
      icon: Laptop,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Active Bot Agents',
      value: stats?.activeBotAgents || 0,
      icon: Bot,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Human Agents',
      value: stats?.activeHumanAgents || 0,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">IT Help Desk Management Overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-3xl font-bold mt-2 ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <card.icon className={`w-8 h-8 ${card.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* High-Risk Alerts */}
      {stats?.highRiskAlerts && stats.highRiskAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200">
          <div className="p-6 border-b border-red-200 bg-red-50">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-red-900">High-Risk Alerts</h2>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Organizations requiring human agents but none are available
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.highRiskAlerts.map((alert) => (
                <div
                  key={alert.organization_id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{alert.organization_name}</h3>
                    <p className="text-sm text-gray-600">Location: {alert.location_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      Requires Human Agent: Yes
                    </p>
                    <p className="text-sm text-gray-600">
                      Available: {alert.available_human_agents}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agent Availability Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Status Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Bot className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Bot Agents</p>
                  <p className="text-sm text-gray-600">Automated Support</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.activeBotAgents || 0}
                </p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Human Agents</p>
                  <p className="text-sm text-gray-600">Support Specialists</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {stats?.activeHumanAgents || 0}
                </p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/tickets')}
              className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <p className="font-medium text-blue-900">View All Tickets</p>
              <p className="text-sm text-blue-700">Manage open support requests</p>
            </button>
            <button
              onClick={() => navigate('/agents')}
              className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
            >
              <p className="font-medium text-green-900">Manage Agents</p>
              <p className="text-sm text-green-700">Configure agent availability</p>
            </button>
            <button
              onClick={() => navigate('/devices')}
              className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
            >
              <p className="font-medium text-purple-900">Device Inventory</p>
              <p className="text-sm text-purple-700">View and manage all devices</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
