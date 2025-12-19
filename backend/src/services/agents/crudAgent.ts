import { supabase } from '../../config/supabase';
import { llmComplete } from '../llmClient';

const CRUD_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_all_tickets',
      description: 'Get all support tickets with optional filters',
      parameters: {
        type: 'object',
        properties: {
          status_id: {
            type: 'number',
            description: 'Filter by status ID (1=Open, 2=In Progress, 3=Awaiting Customer, 4=Escalated, 5=Resolved, 6=Closed)',
          },
          priority_id: {
            type: 'number',
            description: 'Filter by priority ID (1=Low, 2=Medium, 3=High, 4=Critical)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of tickets to return',
            default: 10,
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_ticket_by_id',
      description: 'Get detailed information about a specific ticket by ID',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: {
            type: 'number',
            description: 'The ticket ID',
          },
        },
        required: ['ticket_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_ticket',
      description: 'Create a new support ticket',
      parameters: {
        type: 'object',
        properties: {
          organization_id: { type: 'number' },
          contact_id: { type: 'number' },
          subject: { type: 'string' },
          description: { type: 'string' },
          priority_id: { type: 'number', default: 2 },
          status_id: { type: 'number', default: 1 },
        },
        required: ['organization_id', 'contact_id', 'subject', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_ticket',
      description: 'Update an existing ticket',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: { type: 'number' },
          status_id: { type: 'number' },
          priority_id: { type: 'number' },
          subject: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['ticket_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_ticket',
      description: 'Delete a ticket by ID',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: { type: 'number' },
        },
        required: ['ticket_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_all_organizations',
      description: 'Get all organizations',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_all_agents',
      description: 'Get all support agents',
      parameters: {
        type: 'object',
        properties: {
          agent_type: {
            type: 'string',
            enum: ['Bot', 'Human'],
            description: 'Filter by agent type',
          },
          limit: { type: 'number', default: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_all_devices',
      description: 'Get all devices',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ONLINE', 'OFFLINE'],
            description: 'Filter by device status',
          },
          organization_id: {
            type: 'number',
            description: 'Filter by organization',
          },
          limit: { type: 'number', default: 20 },
        },
      },
    },
  },
];

const CRUD_SYSTEM_PROMPT = `You are a CRUD Operations Agent for the admin portal.
You help admins perform Create, Read, Update, and Delete operations on:
- Support Tickets
- Organizations
- Support Agents
- Devices

When the user asks to perform an operation:
1. Call the appropriate tool function
2. Present the results in a clear, conversational format WITHOUT markdown symbols
3. Use plain text with line breaks for readability
4. For lists, use simple bullet points (•) instead of dashes or asterisks
5. For errors, explain what went wrong and suggest fixes in plain language

IMPORTANT: Do NOT use markdown formatting like **, *, #, ##, backticks, or []().
Use plain text only with line breaks and bullet points (•) for lists.

Always be helpful and professional. Present data in a natural, conversational way.`;

async function executeTool(toolName: string, args: any): Promise<any> {
  try {
    switch (toolName) {
      case 'get_all_tickets': {
        let query = supabase
          .from('support_tickets')
          .select(`
            ticket_id,
            subject,
            description,
            created_at,
            organizations(name),
            contacts(full_name, email),
            ticket_statuses(name),
            ticket_priorities(name)
          `)
          .order('created_at', { ascending: false })
          .limit(args.limit || 10);

        if (args.status_id) query = query.eq('status_id', args.status_id);
        if (args.priority_id) query = query.eq('priority_id', args.priority_id);

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data, count: data?.length || 0 };
      }

      case 'get_ticket_by_id': {
        const { data, error } = await supabase
          .from('support_tickets')
          .select(`
            *,
            organizations(name),
            contacts(full_name, email),
            devices(asset_name),
            locations(name),
            ticket_statuses(name),
            ticket_priorities(name)
          `)
          .eq('ticket_id', args.ticket_id)
          .single();

        if (error) throw error;
        return { success: true, data };
      }

      case 'create_ticket': {
        const { data, error } = await supabase
          .from('support_tickets')
          .insert([
            {
              organization_id: args.organization_id,
              contact_id: args.contact_id,
              subject: args.subject,
              description: args.description,
              priority_id: args.priority_id || 2,
              status_id: args.status_id || 1,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return { success: true, data, message: 'Ticket created successfully' };
      }

      case 'update_ticket': {
        const updateData: any = {};
        if (args.status_id) updateData.status_id = args.status_id;
        if (args.priority_id) updateData.priority_id = args.priority_id;
        if (args.subject) updateData.subject = args.subject;
        if (args.description) updateData.description = args.description;

        const { data, error } = await supabase
          .from('support_tickets')
          .update(updateData)
          .eq('ticket_id', args.ticket_id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data, message: 'Ticket updated successfully' };
      }

      case 'delete_ticket': {
        const { error } = await supabase
          .from('support_tickets')
          .delete()
          .eq('ticket_id', args.ticket_id);

        if (error) throw error;
        return { success: true, message: 'Ticket deleted successfully' };
      }

      case 'get_all_organizations': {
        const { data, error } = await supabase
          .from('organizations')
          .select('organization_id, name, u_e_code, created_at')
          .order('created_at', { ascending: false })
          .limit(args.limit || 20);

        if (error) throw error;
        return { success: true, data, count: data?.length || 0 };
      }

      case 'get_all_agents': {
        let query = supabase
          .from('support_agents')
          .select('support_agent_id, full_name, email, agent_type, specialization, is_available')
          .order('created_at', { ascending: false })
          .limit(args.limit || 20);

        if (args.agent_type) query = query.eq('agent_type', args.agent_type);

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data, count: data?.length || 0 };
      }

      case 'get_all_devices': {
        let query = supabase
          .from('devices')
          .select(`
            device_id,
            asset_name,
            status,
            host_name,
            public_ip,
            organizations(name)
          `)
          .order('created_at', { ascending: false })
          .limit(args.limit || 20);

        if (args.status) query = query.eq('status', args.status);
        if (args.organization_id) query = query.eq('organization_id', args.organization_id);

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data, count: data?.length || 0 };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function runCrudAgent(userMessage: string): Promise<string> {
  try {
    const response = await llmComplete(
      CRUD_SYSTEM_PROMPT,
      [{ role: 'user', content: userMessage }],
      CRUD_TOOLS,
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
        CRUD_SYSTEM_PROMPT,
        [
          { role: 'user', content: userMessage },
          {
            role: 'assistant',
            content: `Tool call: ${toolCall.name} with args ${JSON.stringify(toolCall.arguments)}. Result: ${JSON.stringify(toolResult)}`,
          },
          {
            role: 'user',
            content: 'Summarize the result in a user-friendly way.',
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
    return `I encountered an error: ${error.message}. Please try rephrasing your request.`;
  }
}
