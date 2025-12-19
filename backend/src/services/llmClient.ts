import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
}

export async function llmComplete(
  systemPrompt: string,
  messages: Message[],
  tools?: any[],
  model: string = 'gpt-4o-mini',
  temperature: number = 0.2,
  maxTokens: number = 800
): Promise<LLMResponse> {
  try {
    const allMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const params: any = {
      model,
      messages: allMessages,
      temperature,
      max_tokens: maxTokens,
    };

    if (tools && tools.length > 0) {
      params.tools = tools;
    }

    const response = await openai.chat.completions.create(params);

    const choice = response.choices[0];
    const content = choice.message.content || '';

    const toolCalls: ToolCall[] = [];
    if (choice.message.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        // Check if it's a function tool call (not a custom tool call)
        if (toolCall.type === 'function' && toolCall.function) {
          toolCalls.push({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments || '{}'),
          });
        }
      }
    }

    return { content, toolCalls };
  } catch (error: any) {
    console.error('LLM call failed:', error);
    throw new Error(`LLM call failed: ${error.message}`);
  }
}
