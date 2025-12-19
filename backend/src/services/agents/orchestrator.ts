import { routeIntent, Intent } from './routerAgent';
import { runCrudAgent } from './crudAgent';
import { runMetricsAgent } from './metricsAgent';
import { llmComplete } from '../llmClient';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SessionState {
  userId: number;
  messages: Message[];
  lastIntent?: Intent;
  context?: Record<string, any>;
}

// In-memory session storage (replace with Redis or database in production)
const sessions: Map<number, SessionState> = new Map();

export function getSession(userId: number): SessionState {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      userId,
      messages: [],
    });
  }
  return sessions.get(userId)!;
}

export function clearSession(userId: number): void {
  sessions.delete(userId);
}

function formatHistorySnippet(messages: Message[], maxItems: number = 4): string {
  const recent = messages.slice(-maxItems);
  return recent.map((m) => `${m.role}: ${m.content}`).join('\n');
}

async function handleSmallTalk(userMessage: string, state: SessionState): Promise<string> {
  const systemPrompt = `You are a helpful admin portal assistant.
You can help with:
- Creating, viewing, updating, and deleting tickets
- Managing organizations, agents, and devices
- Viewing metrics and dashboard statistics

Be friendly and guide users on what they can do. Keep responses concise.`;

  const response = await llmComplete(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    undefined,
    'gpt-4o-mini',
    0.7,
    300
  );

  return response.content;
}

function getAgentForIntent(intent: Intent): 'crud' | 'metrics' | 'smalltalk' {
  const crudIntents: Intent[] = [
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
  ];

  const metricsIntents: Intent[] = ['view_metrics', 'view_dashboard'];

  if (crudIntents.includes(intent)) {
    return 'crud';
  } else if (metricsIntents.includes(intent)) {
    return 'metrics';
  } else {
    return 'smalltalk';
  }
}

export async function orchestrateTurn(
  userMessage: string,
  userId: number
): Promise<{ reply: string; intent: Intent; agent: string }> {
  try {
    // Get or create session
    const state = getSession(userId);

    // Add user message to history
    state.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // Keep history manageable
    if (state.messages.length > 20) {
      state.messages = state.messages.slice(-20);
    }

    // Route the intent
    const routing = await routeIntent(userMessage);
    const intent = routing.intent;
    state.lastIntent = intent;

    console.log('Routing decision:', { userId, intent, confidence: routing.confidence });

    // Choose appropriate agent
    const agentType = getAgentForIntent(intent);
    let reply: string;

    switch (agentType) {
      case 'crud':
        // Build context-aware prompt for CRUD agent
        const crudContext = `Recent conversation:\n${formatHistorySnippet(state.messages, 4)}\n\nUser request: ${userMessage}`;
        reply = await runCrudAgent(crudContext);
        break;

      case 'metrics':
        // Build context-aware prompt for Metrics agent
        const metricsContext = `Recent conversation:\n${formatHistorySnippet(state.messages, 4)}\n\nUser request: ${userMessage}`;
        reply = await runMetricsAgent(metricsContext);
        break;

      case 'smalltalk':
      default:
        reply = await handleSmallTalk(userMessage, state);
        break;
    }

    // Add assistant reply to history
    state.messages.push({
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    });

    return { reply, intent, agent: agentType };
  } catch (error: any) {
    console.error('Orchestration error:', error);
    return {
      reply: `I encountered an error: ${error.message}. Please try again or rephrase your request.`,
      intent: 'small_talk',
      agent: 'error',
    };
  }
}

export async function getChatHistory(userId: number): Promise<Message[]> {
  const state = getSession(userId);
  return state.messages;
}
