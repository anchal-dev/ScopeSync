import { Bell, Search, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: 'Reporting period: Q1 2024 · GHG Protocol aligned' },
  '/upload': { title: 'Upload Data', subtitle: 'Ingest emission activity data from connected sources' },
  '/review': { title: 'Review Records', subtitle: 'Validate, approve or reject ingested emission records' },
  '/audit': { title: 'Audit Logs', subtitle: 'Full trail of all record actions and system events' },
  '/analytics': { title: 'Analytics', subtitle: 'Trend analysis and emission intensity benchmarking' },
  '/settings': { title: 'Settings', subtitle: 'Manage integrations, users, and reporting configuration' },
};

export default function Navbar() {
  const { pathname } = useLocation();
  const page = pageTitles[pathname] ?? pageTitles['/'];

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Page info */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold text-gray-900 leading-tight">{page.title}</h1>
        <p className="text-xs text-gray-400 truncate">{page.subtitle}</p>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search records, reports…"
          className="pl-8 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Actions */}
      <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
      </button>

      {/* Period selector */}
      <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        FY 2024
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {/* Export */}
      <button
        onClick={() => window.print()}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
      >
        Export Report
      </button>
    </header>
  );
}
