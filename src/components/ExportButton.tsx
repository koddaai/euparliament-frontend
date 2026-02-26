'use client';

export default function ExportButton() {
  const handleExport = () => {
    window.open('/api/export/xlsx', '_blank');
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleExport}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 rounded-lg hover:bg-slate-100 transition-all font-medium shadow-sm border border-slate-200 group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span className="hidden sm:inline">Download</span>
        <span className="text-emerald-600 font-semibold">Excel</span>
      </button>
      <span className="text-xs text-blue-200 hidden md:block">
        Full MEP directory · Updated daily
      </span>
    </div>
  );
}
