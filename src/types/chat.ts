export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface SearchMepsArgs {
  name?: string;
  country?: string;
  political_group?: string;
  limit?: number;
}

export interface GetStatsArgs {
  // No arguments needed
}

export interface SearchWebArgs {
  query: string;
}
