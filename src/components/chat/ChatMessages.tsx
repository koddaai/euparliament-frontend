'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick?: (text: string) => void;
}

const SUGGESTIONS = [
  "Which MEPs joined the Parliament most recently?",
  "Who is talking about environmental regulation?",
  "What's the left vs right balance in Parliament?",
  "Which MEPs mentioned Brazil or Mercosur?",
  "How many MEPs does Germany have?",
  "List Portuguese MEPs",
];

export default function ChatMessages({ messages, isLoading, onSuggestionClick }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#003399]/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="font-semibold text-slate-900 mb-2">EU Parliament Assistant</h3>
        <p className="text-sm text-slate-500 mb-4">
          Ask me about MEPs, political groups, or EU Parliament news.
        </p>
        <div className="space-y-2 w-full text-left">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Try asking:</p>
          {SUGGESTIONS.slice(0, 4).map((text) => (
            <SuggestionChip
              key={text}
              text={text}
              onClick={() => onSuggestionClick?.(text)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              message.role === 'user'
                ? 'bg-[#003399] text-white rounded-br-md'
                : 'bg-slate-100 text-slate-900 rounded-bl-md'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function SuggestionChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm text-slate-600 bg-slate-50
                 rounded-lg hover:bg-slate-100 hover:text-[#003399] transition-colors
                 border border-slate-200 hover:border-[#003399]/30"
    >
      {text}
    </button>
  );
}
