import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

type MetadataType =
  | 'manufacturers'
  | 'models'
  | 'operating-systems'
  | 'processor-architectures'
  | 'ticket-statuses'
  | 'ticket-priorities';

export default function Metadata() {
  const [activeTab, setActiveTab] = useState<MetadataType>('manufacturers');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['metadata', activeTab],
    queryFn: async () => {
      const response = await api.get(`/metadata/${activeTab}`);
      return response.data;
    },
  });

  const { data: manufacturers } = useQuery({
    queryKey: ['metadata', 'manufacturers'],
    queryFn: async () => {
      const response = await api.get('/metadata/manufacturers');
      return response.data;
    },
    enabled: activeTab === 'models',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/metadata/${activeTab}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata'] });
      toast.success('Item created successfully');
      setShowModal(false);
      setFormData({});
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create item';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/metadata/${activeTab}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata'] });
      toast.success('Item updated successfully');
      setShowModal(false);
      setFormData({});
      setEditingItem(null);
    },
    onError: () => {
      toast.error('Failed to update item');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/metadata/${activeTab}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata'] });
      toast.success('Item deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete item';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({});
    setEditingItem(null);
  };

  const tabs = [
    { id: 'manufacturers', label: 'Manufacturers' },
    { id: 'models', label: 'Device Models' },
    { id: 'operating-systems', label: 'Operating Systems' },
    { id: 'processor-architectures', label: 'Processor Architectures' },
    { id: 'ticket-statuses', label: 'Ticket Statuses' },
    { id: 'ticket-priorities', label: 'Ticket Priorities' },
  ];

  const renderFormFields = () => {
    switch (activeTab) {
      case 'manufacturers':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </>
        );
      case 'models':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
              <select
                value={formData.manufacturer_id || ''}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer_id: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select Manufacturer</option>
                {manufacturers?.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
              <input
                type="text"
                value={formData.model_name || ''}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </>
        );
      case 'operating-systems':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OS Name</label>
              <input
                type="text"
                value={formData.os_name || ''}
                onChange={(e) => setFormData({ ...formData, os_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
              <input
                type="text"
                value={formData.version || ''}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </>
        );
      case 'processor-architectures':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Architecture</label>
              <input
                type="text"
                value={formData.architecture || ''}
                onChange={(e) => setFormData({ ...formData, architecture: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </>
        );
      case 'ticket-statuses':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Name</label>
              <input
                type="text"
                value={formData.status_name || ''}
                onChange={(e) => setFormData({ ...formData, status_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="color"
                value={formData.color || '#3b82f6'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </>
        );
      case 'ticket-priorities':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority Name</label>
              <input
                type="text"
                value={formData.priority_name || ''}
                onChange={(e) => setFormData({ ...formData, priority_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rank</label>
              <input
                type="number"
                value={formData.rank || ''}
                onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SLA Hours
              </label>
              <input
                type="number"
                value={formData.sla_hours || ''}
                onChange={(e) => setFormData({ ...formData, sla_hours: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </>
        );
    }
  };

  const renderTableRows = () => {
    if (!items || items.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
            No items found. Click "Add Item" to create one.
          </td>
        </tr>
      );
    }

    return items.map((item: any) => (
      <tr key={item.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {item.id}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {item.name ||
            item.model_name ||
            item.os_name ||
            item.architecture ||
            item.status_name ||
            item.priority_name}
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {item.country ||
            item.version ||
            item.description ||
            item.color ||
            item.rank ||
            (item.manufacturer_id &&
              manufacturers?.find((m: any) => m.id === item.manufacturer_id)?.name) ||
            '-'}
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {item.sla_hours ? `${item.sla_hours} hours` : '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <div className="flex items-center space-x-2">
            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900">
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metadata Manager</h1>
          <p className="text-gray-600 mt-1">Manage lookup tables and standardization</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Item
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as MetadataType);
                  resetForm();
                }}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Additional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">{renderTableRows()}</tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Database className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-blue-900">About Metadata Management</h3>
            <p className="text-sm text-blue-800 mt-1">
              The Metadata Manager serves as the exclusive editor for lookup tables to prevent
              "spelling chaos." Delete operations are restricted if the item is currently referenced
              in other tables (e.g., devices or support tickets).
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingItem ? 'Edit Item' : 'Add Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderFormFields()}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? 'Update' : 'Create'}
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
