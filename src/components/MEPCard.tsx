'use client';

import Image from 'next/image';
import { MEP } from '@/types';

interface MEPCardProps {
  mep: MEP;
}

const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'EPP': { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-600' },
  'S&D': { bg: 'bg-red-600', text: 'text-white', border: 'border-red-600' },
  'RE': { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-500' },
  'Greens/EFA': { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-600' },
  'ECR': { bg: 'bg-sky-700', text: 'text-white', border: 'border-sky-700' },
  'The Left': { bg: 'bg-rose-700', text: 'text-white', border: 'border-rose-700' },
  'PfE': { bg: 'bg-indigo-700', text: 'text-white', border: 'border-indigo-700' },
  'ESN': { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-700' },
  'NI': { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500' },
  'Unknown': { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-400' },
};

export default function MEPCard({ mep }: MEPCardProps) {
  const colors = GROUP_COLORS[mep.political_group_short] || GROUP_COLORS['Unknown'];

  return (
    <a
      href={mep.profile_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden card-hover"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        <Image
          src={mep.photo_url}
          alt={mep.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Political Group Badge */}
        <div className="absolute top-3 right-3">
          <span className={`${colors.bg} ${colors.text} text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg`}>
            {mep.political_group_short}
          </span>
        </div>

        {/* External Link Indicator */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
            View profile
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </span>
        </div>
      </div>

      {/* Info Container */}
      <div className={`p-4 border-t-2 ${colors.border}`}>
        <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {mep.name}
        </h3>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-600">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium">{mep.country}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-xs truncate" title={mep.national_party}>
              {mep.national_party}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
