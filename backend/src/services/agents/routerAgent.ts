import { llmComplete } from '../llmClient';

export const INTENTS = [
  'create_ticket',
  'update_ticket',
  'delete_ticket',
  'view_tickets',
  'create_organization',
  'update_organization',
  'delete_organization',
  'view_organizations',
  'create_agent',
  'update_agent',
  'delete_agent',
  'view_agents',
  'create_device',
  'update_device',
  'delete_device',
  'view_devices',
  'view_metrics',
  'view_dashboard',
  'small_talk',
] as const;

export type Intent = typeof INTENTS[number];

export interface RoutingResult {
  intent: Intent;
  entityId?: number;
  confidence: number;
}

const ROUTER_SYSTEM_PROMPT = `You are a routing component for an admin portal chatbot.
Choose exactly one intent from: ${INTENTS.join(', ')}.

Rules:
- For CREATE operations: create_ticket, create_organization, create_agent, create_device
- For UPDATE operations: update_ticket, update_organization, update_agent, update_device
- For DELETE operations: delete_ticket, delete_organization, delete_agent, delete_device
- For VIEW/LIST operations: view_tickets, view_organizations, view_agents, view_devices
- For METRICS/ANALYTICS: view_metrics, view_dashboard
- If unclear or chatting, use 'small_talk'

When user mentions IDs or numbers (e.g., "ticket #123", "organization 5"), extract the entityId.

OUTPUT ONLY compact JSON with keys: intent, entityId (number or null), confidence (0-1).
Example: {"intent": "view_tickets", "entityId": null, "confidence": 0.95}
Example: {"intent": "update_ticket", "entityId": 123, "confidence": 0.90}`;

function extractEntityId(text: string): number | undefined {
  // Match patterns like #123, ticket 123, ID 123, organization 5, etc.
  const patterns = [
    /#(\d+)/,
    /ticket\s+(\d+)/i,
    /organization\s+(\d+)/i,
    /agent\s+(\d+)/i,
    /device\s+(\d+)/i,
    /\bid\s+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  return undefined;
}

export async function routeIntent(userMessage: string): Promise<RoutingResult> {
  try {
    const response = await llmComplete(
      ROUTER_SYSTEM_PROMPT,
      [{ role: 'user', content: userMessage }],
      undefined,
      'gpt-4o-mini',
      0.1,
      150
    );

    const rawOutput = response.content.trim();

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(rawOutput);
      const intent = parsed.intent as Intent;
      const entityId = parsed.entityId || extractEntityId(userMessage);
      const confidence = parsed.confidence || 0.5;

      // Validate intent
      if (!INTENTS.includes(intent)) {
        return { intent: 'small_talk', confidence: 0.3 };
      }

      return { intent, entityId, confidence };
    } catch (parseError) {
      // Fallback to keyword matching
      return fallbackRouting(userMessage);
    }
  } catch (error) {
    console.error('Router agent failed:', error);
    return fallbackRouting(userMessage);
  }
}

function fallbackRouting(userMessage: string): RoutingResult {
  const lower = userMessage.toLowerCase();
  const entityId = extractEntityId(userMessage);

  // Ticket operations
  if (lower.includes('create ticket') || lower.includes('new ticket')) {
    return { intent: 'create_ticket', entityId, confidence: 0.7 };
  }
  if (lower.includes('update ticket') || lower.includes('edit ticket')) {
    return { intent: 'update_ticket', entityId, confidence: 0.7 };
  }
  if (lower.includes('delete ticket') || lower.includes('remove ticket')) {
    return { intent: 'delete_ticket', entityId, confidence: 0.7 };
  }
  if (lower.includes('ticket') || lower.includes('show me tickets')) {
    return { intent: 'view_tickets', entityId, confidence: 0.6 };
  }

  // Organization operations
  if (lower.includes('create org') || lower.includes('new organization')) {
    return { intent: 'create_organization', entityId, confidence: 0.7 };
  }
  if (lower.includes('update org') || lower.includes('edit organization')) {
    return { intent: 'update_organization', entityId, confidence: 0.7 };
  }
  if (lower.includes('delete org') || lower.includes('remove organization')) {
    return { intent: 'delete_organization', entityId, confidence: 0.7 };
  }
  if (lower.includes('organization') || lower.includes('org')) {
    return { intent: 'view_organizations', entityId, confidence: 0.6 };
  }

  // Agent operations
  if (lower.includes('create agent') || lower.includes('new agent')) {
    return { intent: 'create_agent', entityId, confidence: 0.7 };
  }
  if (lower.includes('update agent') || lower.includes('edit agent')) {
    return { intent: 'update_agent', entityId, confidence: 0.7 };
  }
  if (lower.includes('delete agent') || lower.includes('remove agent')) {
    return { intent: 'delete_agent', entityId, confidence: 0.7 };
  }
  if (lower.includes('agent')) {
    return { intent: 'view_agents', entityId, confidence: 0.6 };
  }

  // Device operations
  if (lower.includes('create device') || lower.includes('new device')) {
    return { intent: 'create_device', entityId, confidence: 0.7 };
  }
  if (lower.includes('update device') || lower.includes('edit device')) {
    return { intent: 'update_device', entityId, confidence: 0.7 };
  }
  if (lower.includes('delete device') || lower.includes('remove device')) {
    return { intent: 'delete_device', entityId, confidence: 0.7 };
  }
  if (lower.includes('device')) {
    return { intent: 'view_devices', entityId, confidence: 0.6 };
  }

  // Metrics and dashboard
  if (lower.includes('metric') || lower.includes('analytic') || lower.includes('statistic')) {
    return { intent: 'view_metrics', confidence: 0.7 };
  }
  if (lower.includes('dashboard') || lower.includes('overview')) {
    return { intent: 'view_dashboard', confidence: 0.7 };
  }

  // Default to small talk
  return { intent: 'small_talk', confidence: 0.5 };
}
