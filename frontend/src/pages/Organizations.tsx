import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface Organization {
  organization_id: number;
  name: string;
  u_e_code: number;
  manager_id: number;
  created_at: string;
  updated_at: string;
}

interface AccountManager {
  manager_id: number;
  full_name: string;
  email: string;
  phone: string;
}

export default function Organizations() {
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    u_e_code: '',
    organization_name: '',
    manager_id: '',
  });

  const queryClient = useQueryClient();

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await api.get('/organizations');
      return response.data;
    },
  });

  const { data: managers } = useQuery<AccountManager[]>({
    queryKey: ['managers'],
    queryFn: async () => {
      const response = await api.get('/organizations/managers/all');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/organizations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created successfully');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create organization');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/organizations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization updated successfully');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update organization');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/organizations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete organization');
    },
  });

  const resetForm = () => {
    setFormData({
      u_e_code: '',
      organization_name: '',
      manager_id: '',
    });
    setEditingOrg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.organization_id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      u_e_code: org.u_e_code.toString(),
      organization_name: org.name,
      manager_id: org.manager_id.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this organization?')) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 mt-1">Manage tenant organizations</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Organization
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Manager
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
              {organizations?.map((org) => {
                const manager = managers?.find((m) => m.manager_id === org.manager_id);
                return (
                  <tr key={org.organization_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {org.u_e_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{org.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {manager?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(org)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(org.organization_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingOrg ? 'Edit Organization' : 'Add Organization'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  U/E Code
                </label>
                <input
                  type="number"
                  value={formData.u_e_code}
                  onChange={(e) => setFormData({ ...formData, u_e_code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formData.organization_name}
                  onChange={(e) =>
                    setFormData({ ...formData, organization_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Manager
                </label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select Manager</option>
                  {managers?.map((manager) => (
                    <option key={manager.manager_id} value={manager.manager_id}>
                      {manager.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingOrg ? 'Update' : 'Create'}
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
