import Stats from '@/components/Stats';
import Changes from '@/components/Changes';
import MEPList from '@/components/MEPList';
import ExportButton from '@/components/ExportButton';
import ChatWrapper from '@/components/chat/ChatWrapper';

// AI Political Intelligence Banner Component
function AIBanner() {
  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl shadow-xl border border-slate-700">
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Left side - Title and description */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30">
                AI-Powered
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Political Intelligence Assistant
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
              Ask about MEPs, their positions on environmental regulation, Mercosur, recent news, and more.
            </p>
          </div>

          {/* Right side - Example questions */}
          <div className="md:w-80">
            <div className="bg-slate-700/50 rounded-xl px-5 py-4 border border-slate-600/50">
              <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider font-medium">Example questions</p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start gap-2 text-slate-300">
                  <span className="text-blue-400 mt-0.5">›</span>
                  Who joined Parliament recently?
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <span className="text-blue-400 mt-0.5">›</span>
                  MEPs discussing climate regulation?
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <span className="text-blue-400 mt-0.5">›</span>
                  Left vs right balance?
                </li>
              </ul>
            </div>
            <p className="text-slate-500 text-xs text-center mt-3">
              Click the chat button in the corner
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// EU Stars Logo Component
function EUStars() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-12 h-12 md:w-14 md:h-14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="48" stroke="#FFD700" strokeWidth="2" fill="none" />
      {/* 12 stars in a circle */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = 50 + 35 * Math.cos(angle);
        const y = 50 + 35 * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            fontSize="12"
            fill="#FFD700"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ★
          </text>
        );
      })}
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003399] via-[#002266] to-[#003399] text-white shadow-xl">
        <div className="container mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <EUStars />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  EU Parliament Monitor
                </h1>
                <p className="text-blue-200 text-sm md:text-base">
                  Members of the European Parliament
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a
                href="/social"
                className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Social Feed
              </a>
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Data
              </div>
              <ExportButton />
            </div>
          </div>

          {/* Stats bar */}
          <div className="py-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-6 text-blue-200">
              <span>Updated daily at 06:00 UTC</span>
            </div>
            <div className="md:hidden">
              <ExportButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Section */}
          <section className="animate-fade-in">
            <Stats />
          </section>

          {/* Changes Section */}
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Changes />
          </section>

          {/* AI Political Intelligence Banner */}
          <section className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <AIBanner />
          </section>

          {/* MEP List Section */}
          <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <MEPList />
          </section>
        </div>
      </main>

      {/* Chat Assistant */}
      <ChatWrapper />

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <EUStars />
                <h3 className="font-semibold text-lg">EU Parliament Monitor</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Track Members of the European Parliament with real-time data on political groups,
                countries, and membership changes.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="https://www.europarl.europa.eu/meps/en/full-list/all"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Official EU Parliament Website →
                  </a>
                </li>
                <li>
                  <a
                    href="/api/export/xlsx"
                    className="hover:text-white transition-colors"
                  >
                    Download Full MEP List (Excel) →
                  </a>
                </li>
              </ul>
            </div>

            {/* Data Info */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Data Information</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Updated daily at 06:00 UTC
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Source: europarl.europa.eu
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-500 text-sm">
            <p>
              This is an independent monitoring tool. Not affiliated with the European Parliament.
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} EU Parliament Monitor
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
