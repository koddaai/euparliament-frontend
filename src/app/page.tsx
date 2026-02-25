import Stats from '@/components/Stats';
import Changes from '@/components/Changes';
import MEPList from '@/components/MEPList';
import ExportButton from '@/components/ExportButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">EU Parliament Monitor</h1>
              <p className="text-blue-200 mt-1">Track Members of the European Parliament</p>
            </div>
            <ExportButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Stats />
        <Changes />
        <MEPList />
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>Data sourced from the European Parliament website</p>
          <p className="mt-1">Updated daily at 6:00 UTC</p>
        </div>
      </footer>
    </div>
  );
}
