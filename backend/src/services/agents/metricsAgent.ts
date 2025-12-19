import { supabase } from '../../config/supabase';
import { llmComplete } from '../llmClient';

const METRICS_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_dashboard_stats',
      description: 'Get overall dashboard statistics including tickets, devices, and agents',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_ticket_metrics',
      description: 'Get ticket statistics grouped by status, priority, or organization',
      parameters: {
        type: 'object',
        properties: {
          group_by: {
            type: 'string',
            enum: ['status', 'priority', 'organization'],
            description: 'How to group the ticket metrics',
          },
        },
        required: ['group_by'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_device_metrics',
      description: 'Get device statistics including online/offline counts by organization',
      parameters: {
        type: 'object',
        properties: {
          organization_id: {
            type: 'number',
            description: 'Optional: Filter by specific organization',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_agent_metrics',
      description: 'Get support agent availability and workload statistics',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

const METRICS_SYSTEM_PROMPT = `You are a Metrics & Analytics Agent for the admin portal.
You help admins understand system metrics, statistics, and trends for:
- Support Tickets (by status, priority, organization)
- Devices (online/offline status, distribution)
- Support Agents (availability, workload)
- Overall Dashboard metrics

When the user asks about metrics or analytics:
1. Call the appropriate metrics tool
2. Present the data in a clear, conversational format WITHOUT markdown symbols
3. Highlight important insights or trends in plain language
4. Use percentages and comparisons where helpful
5. Use simple bullet points (•) for lists

IMPORTANT: Do NOT use markdown formatting like **, *, #, ##, backticks, or []().
Use plain text only with line breaks and bullet points (•) for structure.

Be concise and focus on actionable insights in natural language.`;

async function executeTool(toolName: string, args: any): Promise<any> {
  try {
    switch (toolName) {
      case 'get_dashboard_stats': {
        // Get open tickets count
        const { count: openTicketsCount } = await supabase
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .in('status_id', [1, 2]);

        // Get offline devices count
        const { count: offlineDevicesCount } = await supabase
          .from('devices')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'OFFLINE');

        // Get bot agents count
        const { count: botAgentsCount } = await supabase
          .from('support_agents')
          .select('*', { count: 'exact', head: true })
          .eq('agent_type', 'Bot')
          .eq('is_available', true);

        // Get human agents count
        const { count: humanAgentsCount } = await supabase
          .from('support_agents')
          .select('*', { count: 'exact', head: true })
          .eq('agent_type', 'Human')
          .eq('is_available', true);

        return {
          success: true,
          data: {
            totalOpenTickets: openTicketsCount || 0,
            totalDevicesOffline: offlineDevicesCount || 0,
            activeBotAgents: botAgentsCount || 0,
            activeHumanAgents: humanAgentsCount || 0,
          },
        };
      }

      case 'get_ticket_metrics': {
        const groupBy = args.group_by;

        if (groupBy === 'status') {
          const { data } = await supabase
            .from('support_tickets')
            .select('status_id, ticket_statuses(name)');

          const statusCounts: Record<string, number> = {};
          data?.forEach((ticket: any) => {
            const status = ticket.ticket_statuses?.name || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });

          return { success: true, groupBy: 'status', data: statusCounts };
        } else if (groupBy === 'priority') {
          const { data } = await supabase
            .from('support_tickets')
            .select('priority_id, ticket_priorities(name)');

          const priorityCounts: Record<string, number> = {};
          data?.forEach((ticket: any) => {
            const priority = ticket.ticket_priorities?.name || 'Unknown';
            priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
          });

          return { success: true, groupBy: 'priority', data: priorityCounts };
        } else if (groupBy === 'organization') {
          const { data } = await supabase
            .from('support_tickets')
            .select('organization_id, organizations(name)');

          const orgCounts: Record<string, number> = {};
          data?.forEach((ticket: any) => {
            const org = ticket.organizations?.name || 'Unknown';
            orgCounts[org] = (orgCounts[org] || 0) + 1;
          });

          return { success: true, groupBy: 'organization', data: orgCounts };
        }

        return { success: false, error: 'Invalid group_by parameter' };
      }

      case 'get_device_metrics': {
        let query = supabase.from('devices').select('status, organization_id, organizations(name)');

        if (args.organization_id) {
          query = query.eq('organization_id', args.organization_id);
        }

        const { data } = await query;

        const metrics = {
          total: data?.length || 0,
          online: data?.filter((d: any) => d.status === 'ONLINE').length || 0,
          offline: data?.filter((d: any) => d.status === 'OFFLINE').length || 0,
          byOrganization: {} as Record<string, { online: number; offline: number }>,
        };

        data?.forEach((device: any) => {
          const orgName = device.organizations?.name || 'Unknown';
          if (!metrics.byOrganization[orgName]) {
            metrics.byOrganization[orgName] = { online: 0, offline: 0 };
          }
          if (device.status === 'ONLINE') {
            metrics.byOrganization[orgName].online++;
          } else {
            metrics.byOrganization[orgName].offline++;
          }
        });

        return { success: true, data: metrics };
      }

      case 'get_agent_metrics': {
        const { data: botAgents } = await supabase
          .from('support_agents')
          .select('is_available')
          .eq('agent_type', 'Bot');

        const { data: humanAgents } = await supabase
          .from('support_agents')
          .select('is_available')
          .eq('agent_type', 'Human');

        const metrics = {
          bots: {
            total: botAgents?.length || 0,
            available: botAgents?.filter((a) => a.is_available).length || 0,
            unavailable: botAgents?.filter((a) => !a.is_available).length || 0,
          },
          humans: {
            total: humanAgents?.length || 0,
            available: humanAgents?.filter((a) => a.is_available).length || 0,
            unavailable: humanAgents?.filter((a) => !a.is_available).length || 0,
          },
        };

        return { success: true, data: metrics };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function runMetricsAgent(userMessage: string): Promise<string> {
  try {
    const response = await llmComplete(
      METRICS_SYSTEM_PROMPT,
      [{ role: 'user', content: userMessage }],
      METRICS_TOOLS,
      'gpt-4o-mini',
      0.2,
      800
    );

    // If LLM wants to call tools
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolCall = response.toolCalls[0];
      const toolResult = await executeTool(toolCall.name, toolCall.arguments);

      // Generate final response with tool result
      const followUpResponse = await llmComplete(
        METRICS_SYSTEM_PROMPT,
        [
          { role: 'user', content: userMessage },
          {
            role: 'assistant',
            content: `Tool result: ${JSON.stringify(toolResult)}`,
          },
          {
            role: 'user',
            content: 'Present these metrics in a clear, user-friendly format with insights.',
          },
        ],
        undefined,
        'gpt-4o-mini',
        0.3,
        600
      );

      return followUpResponse.content;
    }

    // Direct response without tools
    return response.content;
  } catch (error: any) {
    return `I encountered an error while fetching metrics: ${error.message}. Please try again.`;
  }
}
