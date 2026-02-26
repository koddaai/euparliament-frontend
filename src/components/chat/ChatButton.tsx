'use client';

import { useState, useEffect } from 'react';

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function ChatButton({ onClick, isOpen }: ChatButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Show tooltip after 2 seconds on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) setShowTooltip(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Hide tooltip when chat is opened
  useEffect(() => {
    if (isOpen) setShowTooltip(false);
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <div className="animate-fade-in bg-white rounded-xl shadow-xl px-4 py-3 max-w-[220px] border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-sm font-semibold text-slate-900">Political Intelligence</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ask about MEPs, their positions, voting patterns, and recent news.
          </p>
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Button */}
      <button
        onClick={onClick}
        className={`group relative w-16 h-16 rounded-full shadow-xl
                    flex items-center justify-center transition-all duration-300
                    ${isOpen
                      ? 'bg-slate-600 hover:bg-slate-700'
                      : 'bg-gradient-to-br from-[#003399] to-[#002266] hover:from-[#002266] hover:to-[#001a4d]'
                    }`}
        aria-label={isOpen ? 'Close chat' : 'Open AI Assistant'}
      >
        {/* Pulse animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#003399] animate-ping opacity-20" />
        )}

        {isOpen ? (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>
    </div>
  );
}
