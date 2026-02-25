'use client';

import Image from 'next/image';
import { MEP } from '@/types';

interface MEPCardProps {
  mep: MEP;
}

const GROUP_COLORS: Record<string, string> = {
  'EPP': 'bg-blue-600',
  'S&D': 'bg-red-600',
  'RE': 'bg-yellow-500',
  'Greens/EFA': 'bg-green-600',
  'ECR': 'bg-sky-700',
  'The Left': 'bg-red-800',
  'PfE': 'bg-indigo-700',
  'ESN': 'bg-slate-700',
  'NI': 'bg-gray-500',
  'Unknown': 'bg-gray-400',
};

export default function MEPCard({ mep }: MEPCardProps) {
  const groupColor = GROUP_COLORS[mep.political_group_short] || GROUP_COLORS['Unknown'];

  return (
    <a
      href={mep.profile_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
    >
      <div className="relative">
        <Image
          src={mep.photo_url}
          alt={mep.name}
          width={150}
          height={200}
          className="w-full h-48 object-cover object-top"
          unoptimized
        />
        <span className={`absolute top-2 right-2 ${groupColor} text-white text-xs font-semibold px-2 py-1 rounded`}>
          {mep.political_group_short}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
          {mep.name}
        </h3>
        <p className="text-gray-600 text-xs mb-1">{mep.country}</p>
        <p className="text-gray-500 text-xs truncate" title={mep.national_party}>
          {mep.national_party}
        </p>
      </div>
    </a>
  );
}
