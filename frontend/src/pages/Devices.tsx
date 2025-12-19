import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Laptop, Monitor, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface Device {
  id: number;
  device_name: string;
  organization_id: number;
  manufacturer: string;
  model: string;
  operating_system: string;
  processor_architecture: string;
  status: 'ONLINE' | 'OFFLINE';
  public_ip: string;
  gateway: string;
  last_seen: string;
}

export default function Devices() {
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [formData, setFormData] = useState({
    device_name: '',
    organization_id: '',
    manufacturer: '',
    model: '',
    operating_system: '',
    processor_architecture: '',
    status: 'ONLINE' as 'ONLINE' | 'OFFLINE',
    public_ip: '',
    gateway: '',
  });

  const queryClient = useQueryClient();

  // Fetch all devices for stats (always unfiltered)
  const { data: allDevices } = useQuery<Device[]>({
    queryKey: ['devices', 'ALL'],
    queryFn: async () => {
      const response = await api.get('/devices');
      return response.data;
    },
  });

  // Fetch filtered devices for the table
  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: ['devices', filterStatus],
    queryFn: async () => {
      const params = filterStatus !== 'ALL' ? `?status=${filterStatus}` : '';
      const response = await api.get(`/devices${params}`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/devices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device created successfully');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create device');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/devices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device updated successfully');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update device');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/devices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete device');
    },
  });

  const resetForm = () => {
    setFormData({
      device_name: '',
      organization_id: '',
      manufacturer: '',
      model: '',
      operating_system: '',
      processor_architecture: '',
      status: 'ONLINE',
      public_ip: '',
      gateway: '',
    });
    setEditingDevice(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_name: device.device_name,
      organization_id: device.organization_id.toString(),
      manufacturer: device.manufacturer,
      model: device.model,
      operating_system: device.operating_system,
      processor_architecture: device.processor_architecture,
      status: device.status,
      public_ip: device.public_ip,
      gateway: device.gateway,
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
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

  // Calculate stats from all devices, not filtered devices
  const onlineDevices = allDevices?.filter((d) => d.status === 'ONLINE').length || 0;
  const offlineDevices = allDevices?.filter((d) => d.status === 'OFFLINE').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Global Asset Oversight</h1>
          <p className="text-gray-600 mt-1">Master inventory of all devices</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Device
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Devices</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{allDevices?.length || 0}</p>
            </div>
            <Laptop className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Online</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{onlineDevices}</p>
            </div>
            <Circle className="w-12 h-12 text-green-600 opacity-20 fill-current" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offline</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{offlineDevices}</p>
            </div>
            <Circle className="w-12 h-12 text-red-600 opacity-20 fill-current" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Devices
          </button>
          <button
            onClick={() => setFilterStatus('ONLINE')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'ONLINE'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Online ({onlineDevices})
          </button>
          <button
            onClick={() => setFilterStatus('OFFLINE')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'OFFLINE'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Offline ({offlineDevices})
          </button>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manufacturer / Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices?.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Monitor className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{device.device_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {device.manufacturer} {device.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{device.operating_system}</div>
                    <div className="text-xs text-gray-500">{device.processor_architecture}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`flex items-center px-2 py-1 text-xs font-medium rounded-full w-fit ${
                        device.status === 'ONLINE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <Circle
                        className={`w-2 h-2 mr-1 fill-current ${
                          device.status === 'ONLINE' ? 'text-green-600' : 'text-red-600'
                        }`}
                      />
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{device.public_ip}</div>
                    <div className="text-xs text-gray-500">GW: {device.gateway}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(device.last_seen).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(device)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(device.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full m-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingDevice ? 'Edit Device' : 'Add Device'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device Name
                  </label>
                  <input
                    type="text"
                    value={formData.device_name}
                    onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization ID
                  </label>
                  <input
                    type="number"
                    value={formData.organization_id}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operating System
                  </label>
                  <input
                    type="text"
                    value={formData.operating_system}
                    onChange={(e) =>
                      setFormData({ ...formData, operating_system: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processor Architecture
                  </label>
                  <input
                    type="text"
                    value={formData.processor_architecture}
                    onChange={(e) =>
                      setFormData({ ...formData, processor_architecture: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'ONLINE' | 'OFFLINE' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public IP
                  </label>
                  <input
                    type="text"
                    value={formData.public_ip}
                    onChange={(e) => setFormData({ ...formData, public_ip: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="192.168.1.1"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gateway</label>
                  <input
                    type="text"
                    value={formData.gateway}
                    onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="192.168.1.254"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingDevice ? 'Update' : 'Create'}
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
