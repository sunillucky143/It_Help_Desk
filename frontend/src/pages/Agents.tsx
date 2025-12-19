import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Bot, User, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface Agent {
  id: number;
  agent_name: string;
  agent_type: 'Bot' | 'Human';
  specializations: string[];
  is_available: boolean;
  created_at: string;
}

export default function Agents() {
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    agent_name: '',
    agent_type: 'Bot' as 'Bot' | 'Human',
    specializations: '',
    is_available: true,
  });

  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await api.get('/agents');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/agents', {
        ...data,
        specializations: data.specializations.split(',').map((s: string) => s.trim()),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent created successfully');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create agent');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/agents/${id}`, {
        ...data,
        specializations: data.specializations.split(',').map((s: string) => s.trim()),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent updated successfully');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update agent');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/agents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete agent');
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/agents/${id}/availability`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent availability updated');
    },
    onError: () => {
      toast.error('Failed to update availability');
    },
  });

  const resetForm = () => {
    setFormData({
      agent_name: '',
      agent_type: 'Bot',
      specializations: '',
      is_available: true,
    });
    setEditingAgent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      agent_name: agent.agent_name,
      agent_type: agent.agent_type,
      specializations: agent.specializations.join(', '),
      is_available: agent.is_available,
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const botAgents = agents?.filter((a) => a.agent_type === 'Bot') || [];
  const humanAgents = agents?.filter((a) => a.agent_type === 'Human') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600 mt-1">Manage bot and human support agents</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Agent
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bots</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{botAgents.length}</p>
            </div>
            <Bot className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Bots</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {botAgents.filter((a) => a.is_available).length}
              </p>
            </div>
            <Bot className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Humans</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{humanAgents.length}</p>
            </div>
            <User className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Humans</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {humanAgents.filter((a) => a.is_available).length}
              </p>
            </div>
            <User className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specializations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents?.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {agent.agent_type === 'Bot' ? (
                        <Bot className="w-5 h-5 text-blue-600 mr-2" />
                      ) : (
                        <User className="w-5 h-5 text-purple-600 mr-2" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{agent.agent_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        agent.agent_type === 'Bot'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {agent.agent_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {agent.specializations.map((spec, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleAvailabilityMutation.mutate(agent.id)}
                      className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        agent.is_available
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      <Power className="w-3 h-3 mr-1" />
                      {agent.is_available ? 'Available' : 'Unavailable'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(agent)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingAgent ? 'Edit Agent' : 'Add Agent'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                <input
                  type="text"
                  value={formData.agent_name}
                  onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agent Type</label>
                <select
                  value={formData.agent_type}
                  onChange={(e) =>
                    setFormData({ ...formData, agent_type: e.target.value as 'Bot' | 'Human' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="Bot">Bot</option>
                  <option value="Human">Human</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.specializations}
                  onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Hardware, Software, Network"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_available" className="ml-2 text-sm font-medium text-gray-700">
                  Available
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAgent ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
