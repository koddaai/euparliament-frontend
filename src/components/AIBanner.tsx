'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AIBanner() {
  const [mepCount, setMepCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setMepCount(data.totalMEPs))
      .catch(() => setMepCount(null));
  }, []);

  const openChat = () => {
    window.dispatchEvent(new Event('openChat'));
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800">
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
        {/* Left: AI Political Assistant */}
        <div className="p-5 md:p-6 flex items-center">
          <div className="flex items-center gap-4 w-full">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white text-lg font-semibold">AI Political Assistant</h2>
                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  AI
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                Ask questions about MEPs, policies, voting records, political groups and EU affairs
              </p>
            </div>
            <button
              onClick={openChat}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </button>
          </div>
        </div>

        {/* Right: Quick Access CTAs */}
        <div className="p-5 md:p-6">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">Quick Access</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/news"
              className="group flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg p-3 transition-all"
            >
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">EU News</p>
                <p className="text-slate-500 text-xs">Latest headlines</p>
              </div>
            </Link>

            <Link
              href="/social"
              className="group flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg p-3 transition-all"
            >
              <div className="w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">Social</p>
                <p className="text-slate-500 text-xs">MEPs on X</p>
              </div>
            </Link>

            <a
              href="#mep-list"
              className="group flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg p-3 transition-all"
            >
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">All MEPs</p>
                <p className="text-slate-500 text-xs">{mepCount ? `${mepCount} profiles` : 'Browse all'}</p>
              </div>
            </a>

            <a
              href="#changes"
              className="group flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg p-3 transition-all"
            >
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">Changes</p>
                <p className="text-slate-500 text-xs">Recent updates</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
