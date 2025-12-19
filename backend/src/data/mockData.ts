// Mock data for placeholder until Supabase is connected

export const mockOrganizations = [
  {
    id: 1,
    u_e_code: '1001',
    organization_name: 'TechCorp Solutions',
    manager_id: 1,
    location_type: 'Headquarters',
    requires_human_agent: true,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    u_e_code: '1002',
    organization_name: 'Global Enterprises',
    manager_id: 2,
    location_type: 'Branch',
    requires_human_agent: false,
    created_at: '2024-02-20T14:30:00Z'
  },
  {
    id: 3,
    u_e_code: '1003',
    organization_name: 'InnovateLabs Inc',
    manager_id: 1,
    location_type: 'Remote',
    requires_human_agent: false,
    created_at: '2024-03-10T09:15:00Z'
  }
];

export const mockAccountManagers = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.j@urackit.com', phone: '+1-555-0101' },
  { id: 2, name: 'Michael Chen', email: 'michael.c@urackit.com', phone: '+1-555-0102' }
];

export const mockAgents = [
  {
    id: 1,
    agent_name: 'AI Assistant Bot',
    agent_type: 'Bot',
    specializations: ['General Support', 'Password Reset'],
    is_available: true,
    created_at: '2024-01-10T08:00:00Z'
  },
  {
    id: 2,
    agent_name: 'Hardware Specialist Bot',
    agent_type: 'Bot',
    specializations: ['Hardware', 'Device Setup'],
    is_available: true,
    created_at: '2024-01-10T08:00:00Z'
  },
  {
    id: 3,
    agent_name: 'John Smith',
    agent_type: 'Human',
    specializations: ['Cybersecurity', 'Network Issues'],
    is_available: true,
    created_at: '2024-01-15T09:00:00Z'
  },
  {
    id: 4,
    agent_name: 'Emily Davis',
    agent_type: 'Human',
    specializations: ['Software Installation', 'Troubleshooting'],
    is_available: false,
    created_at: '2024-01-20T10:00:00Z'
  }
];

export const mockDevices = [
  {
    id: 1,
    device_name: 'LAPTOP-001',
    organization_id: 1,
    manufacturer: 'Dell',
    model: 'Latitude 5420',
    operating_system: 'Windows 11 Pro',
    processor_architecture: 'x64',
    status: 'ONLINE',
    public_ip: '203.0.113.45',
    gateway: '203.0.113.1',
    last_seen: '2024-12-18T10:30:00Z'
  },
  {
    id: 2,
    device_name: 'DESKTOP-042',
    organization_id: 1,
    manufacturer: 'HP',
    model: 'EliteDesk 800',
    operating_system: 'Windows 10 Enterprise',
    processor_architecture: 'x64',
    status: 'OFFLINE',
    public_ip: '203.0.113.46',
    gateway: '203.0.113.1',
    last_seen: '2024-12-17T18:00:00Z'
  },
  {
    id: 3,
    device_name: 'MACBOOK-PRO-03',
    organization_id: 2,
    manufacturer: 'Apple',
    model: 'MacBook Pro 16',
    operating_system: 'macOS Sonoma',
    processor_architecture: 'ARM64',
    status: 'ONLINE',
    public_ip: '198.51.100.22',
    gateway: '198.51.100.1',
    last_seen: '2024-12-18T11:00:00Z'
  },
  {
    id: 4,
    device_name: 'LAPTOP-089',
    organization_id: 3,
    manufacturer: 'Lenovo',
    model: 'ThinkPad X1 Carbon',
    operating_system: 'Ubuntu 22.04 LTS',
    processor_architecture: 'x64',
    status: 'ONLINE',
    public_ip: '192.0.2.15',
    gateway: '192.0.2.1',
    last_seen: '2024-12-18T10:45:00Z'
  }
];

export const mockTickets = [
  {
    id: 1,
    ticket_number: 'TKT-2024-001',
    organization_id: 1,
    device_id: 1,
    status: 'Open',
    priority: 'High',
    subject: 'Cannot access VPN',
    assigned_agent_id: 3,
    created_at: '2024-12-18T09:00:00Z'
  },
  {
    id: 2,
    ticket_number: 'TKT-2024-002',
    organization_id: 1,
    device_id: 2,
    status: 'Open',
    priority: 'Critical',
    subject: 'Computer won\'t boot',
    assigned_agent_id: null,
    created_at: '2024-12-18T10:15:00Z'
  },
  {
    id: 3,
    ticket_number: 'TKT-2024-003',
    organization_id: 2,
    device_id: 3,
    status: 'In Progress',
    priority: 'Medium',
    subject: 'Software installation request',
    assigned_agent_id: 1,
    created_at: '2024-12-17T14:30:00Z'
  }
];

export const mockDeviceManufacturers = [
  { id: 1, name: 'Dell', country: 'USA' },
  { id: 2, name: 'HP', country: 'USA' },
  { id: 3, name: 'Lenovo', country: 'China' },
  { id: 4, name: 'Apple', country: 'USA' },
  { id: 5, name: 'Asus', country: 'Taiwan' }
];

export const mockDeviceModels = [
  { id: 1, manufacturer_id: 1, model_name: 'Latitude 5420' },
  { id: 2, manufacturer_id: 1, model_name: 'XPS 15' },
  { id: 3, manufacturer_id: 2, model_name: 'EliteDesk 800' },
  { id: 4, manufacturer_id: 2, model_name: 'ProBook 450' },
  { id: 5, manufacturer_id: 3, model_name: 'ThinkPad X1 Carbon' },
  { id: 6, manufacturer_id: 4, model_name: 'MacBook Pro 16' }
];

export const mockOperatingSystems = [
  { id: 1, os_name: 'Windows 11 Pro', version: '23H2' },
  { id: 2, os_name: 'Windows 10 Enterprise', version: '22H2' },
  { id: 3, os_name: 'macOS Sonoma', version: '14.2' },
  { id: 4, os_name: 'Ubuntu 22.04 LTS', version: '22.04' }
];

export const mockProcessorArchitectures = [
  { id: 1, architecture: 'x64', description: '64-bit x86' },
  { id: 2, architecture: 'ARM64', description: 'ARM 64-bit' },
  { id: 3, architecture: 'x86', description: '32-bit x86' }
];

export const mockTicketStatuses = [
  { id: 1, status_name: 'Open', color: '#ef4444' },
  { id: 2, status_name: 'In Progress', color: '#f59e0b' },
  { id: 3, status_name: 'Pending Customer', color: '#8b5cf6' },
  { id: 4, status_name: 'Resolved', color: '#10b981' },
  { id: 5, status_name: 'Closed', color: '#6b7280' }
];

export const mockTicketPriorities = [
  { id: 1, priority_name: 'Low', rank: 1, sla_hours: 72 },
  { id: 2, priority_name: 'Medium', rank: 2, sla_hours: 24 },
  { id: 3, priority_name: 'High', rank: 3, sla_hours: 8 },
  { id: 4, priority_name: 'Critical', rank: 4, sla_hours: 2 }
];

export const mockDashboardStats = {
  totalOpenTickets: 15,
  totalDevicesOffline: 8,
  activeBotAgents: 5,
  activeHumanAgents: 12,
  highRiskAlerts: [
    {
      organization_id: 1,
      organization_name: 'TechCorp Solutions',
      location_type: 'Headquarters',
      requires_human_agent: true,
      available_human_agents: 0
    }
  ]
};
