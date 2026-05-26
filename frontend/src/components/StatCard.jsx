import clsx from 'clsx';
import {
  Database,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const iconMap = {
  database: Database,
  'check-circle': CheckCircle,
  clock: Clock,
  'x-circle': XCircle,
};

const colorMap = {
  blue: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50',
    ring: 'ring-blue-100',
  },
  green: {
    icon: 'text-green-600',
    bg: 'bg-green-50',
    ring: 'ring-green-100',
  },
  amber: {
    icon: 'text-amber-600',
    bg: 'bg-amber-50',
    ring: 'ring-amber-100',
  },
  red: {
    icon: 'text-red-500',
    bg: 'bg-red-50',
    ring: 'ring-red-100',
  },
};

export default function StatCard({ label, value, delta, deltaPositive, sub, icon, color = 'blue' }) {
  const Icon = iconMap[icon] ?? Database;
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div
          className={clsx(
            'w-10 h-10 rounded-lg flex items-center justify-center ring-1',
            c.bg,
            c.ring
          )}
        >
          <Icon className={clsx('w-5 h-5', c.icon)} strokeWidth={1.75} />
        </div>
        <span
          className={clsx(
            'inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5',
            deltaPositive
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-red-600 bg-red-50'
          )}
        >
          {deltaPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {delta}
        </span>
      </div>

      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        <p className="mt-0.5 text-sm font-medium text-gray-500">{label}</p>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}
