import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  ClipboardList,
  ScrollText,
  BarChart3,
  Settings,
  Leaf,
} from 'lucide-react';
import clsx from 'clsx';
import { fetchStats } from '../services/api';

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Upload Data', to: '/upload', icon: UploadCloud },
  { label: 'Review Records', to: '/review', icon: ClipboardList },
  { label: 'Audit Logs', to: '/audit', icon: ScrollText },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();

  const updateCount = () => {
    fetchStats()
      .then((data) => {
        if (data && typeof data.pending === 'number') {
          setPendingCount(data.pending);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch stats for sidebar badge:', err);
      });
  };

  useEffect(() => {
    updateCount();
  }, [location.key]);

  useEffect(() => {
    const handleUpdate = () => updateCount();
    window.addEventListener('recordsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('recordsUpdated', handleUpdate);
    };
  }, []);

  return (
    <aside className="flex flex-col w-60 shrink-0 h-screen bg-white border-r border-gray-100 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-600">
          <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold text-gray-900 tracking-tight">
          ScopeSync
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Main Menu
        </p>
        <ul className="space-y-0.5">
          {navItems.slice(0, 4).map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={clsx(
                        'w-4 h-4 shrink-0',
                        isActive ? 'text-green-600' : 'text-gray-400'
                      )}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                    {label}
                    {to === '/review' && pendingCount > 0 && (
                      <span className="ml-auto text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <p className="px-2 mt-5 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Insights
        </p>
        <ul className="space-y-0.5">
          {navItems.slice(4).map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={clsx(
                        'w-4 h-4 shrink-0',
                        isActive ? 'text-green-600' : 'text-gray-400'
                      )}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            SM
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Sarah Mitchell</p>
            <p className="text-xs text-gray-400 truncate">ESG Auditor</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
