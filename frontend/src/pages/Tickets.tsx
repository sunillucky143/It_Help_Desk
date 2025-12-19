import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, MessageSquare, User, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface Ticket {
  ticket_id: number;
  subject: string;
  description: string;
  status_id: number;
  priority_id: number;
  organization_id: number;
  contact_id: number;
  device_id: number | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  organizations: { name: string };
  contacts: { full_name: string; email: string };
  ticket_statuses: { name: string };
  ticket_priorities: { name: string };
  support_agents: { full_name: string } | null;
}

export default function Tickets() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', filterStatus, filterPriority],
    queryFn: async () => {
      let url = '/tickets';
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url);
      return response.data;
    },
  });

  const { data: statuses } = useQuery({
    queryKey: ['ticket-statuses'],
    queryFn: async () => {
      const response = await api.get('/metadata/ticket-statuses');
      return response.data;
    },
  });

  const { data: priorities } = useQuery({
    queryKey: ['ticket-priorities'],
    queryFn: async () => {
      const response = await api.get('/metadata/ticket-priorities');
      return response.data;
    },
  });

  const viewTicketDetails = async (ticket: Ticket) => {
    try {
      const response = await api.get(`/tickets/${ticket.ticket_id}`);
      setSelectedTicket(response.data);
      setShowDetails(true);
    } catch (error) {
      toast.error('Failed to load ticket details');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in progress':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage and track all support requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Statuses</option>
              {statuses?.map((status: any) => (
                <option key={status.id} value={status.id}>
                  {status.status_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Priorities</option>
              {priorities?.map((priority: any) => (
                <option key={priority.id} value={priority.id}>
                  {priority.priority_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterStatus('');
                setFilterPriority('');
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{tickets?.length || 0}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {tickets?.filter(t => t.ticket_statuses?.name.toLowerCase() === 'open').length || 0}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {tickets?.filter(t => t.ticket_statuses?.name.toLowerCase() === 'in progress').length || 0}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {tickets?.filter(t => t.ticket_statuses?.name.toLowerCase() === 'resolved').length || 0}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets?.map((ticket) => (
                <tr key={ticket.ticket_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{ticket.ticket_id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {ticket.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {ticket.contacts?.full_name}
                        </div>
                        <div className="text-xs text-gray-500">{ticket.contacts?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {ticket.organizations?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                        ticket.ticket_priorities?.name
                      )}`}
                    >
                      {ticket.ticket_priorities?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        ticket.ticket_statuses?.name
                      )}`}
                    >
                      {ticket.ticket_statuses?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => viewTicketDetails(ticket)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {showDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Ticket #{selectedTicket.ticket_id}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Subject</label>
                    <p className="text-gray-900">{selectedTicket.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          selectedTicket.ticket_statuses?.name
                        )}`}
                      >
                        {selectedTicket.ticket_statuses?.name}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <p>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                          selectedTicket.ticket_priorities?.name
                        )}`}
                      >
                        {selectedTicket.ticket_priorities?.name}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-gray-900">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900 mt-1">{selectedTicket.description}</p>
                  </div>
                </div>
              </div>

              {/* Comments */}
              {(selectedTicket as any).comments && (selectedTicket as any).comments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Comments ({(selectedTicket as any).comments.length})
                  </h3>
                  <div className="space-y-4">
                    {(selectedTicket as any).comments.map((comment: any) => (
                      <div key={comment.message_id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {comment.sender_agent?.full_name || comment.sender_contact?.full_name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.message_time).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
