import OpenAI from 'openai';
import { systemPrompt } from '@/lib/chat/system-prompt';
import { chatTools } from '@/lib/chat/tools';
import { executeTool } from '@/lib/chat/tool-handlers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // Build message history with system prompt
    const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // First call - may include tool calls
    let response = await openai.chat.completions.create({
      model: 'gpt-5.2-chat-latest',
      messages: chatMessages,
      tools: chatTools,
      tool_choice: 'auto',
    });

    let assistantMessage = response.choices[0].message;

    // Handle tool calls if present
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Add assistant message with tool calls
      chatMessages.push(assistantMessage);

      // Execute all tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        // Type guard for function tool calls
        if (toolCall.type !== 'function') continue;

        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(toolCall.function.name, args);

        // Add tool result
        chatMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Get next response
      response = await openai.chat.completions.create({
        model: 'gpt-5.2-chat-latest',
        messages: chatMessages,
        tools: chatTools,
        tool_choice: 'auto',
      });

      assistantMessage = response.choices[0].message;
    }

    // Return final text response
    return Response.json({
      message: assistantMessage.content || 'I could not generate a response.',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to process chat request', details: String(error) },
      { status: 500 }
    );
  }
}
