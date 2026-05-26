import clsx from 'clsx';

const variants = {
  Approved: {
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  Pending: {
    dot: 'bg-amber-400',
    pill: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  Rejected: {
    dot: 'bg-red-500',
    pill: 'bg-red-50 text-red-700 ring-red-200',
  },
  Flagged: {
    dot: 'bg-orange-500',
    pill: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
  Submitted: {
    dot: 'bg-blue-500',
    pill: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  Edited: {
    dot: 'bg-violet-500',
    pill: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
  Automated: {
    dot: 'bg-slate-400',
    pill: 'bg-slate-50 text-slate-600 ring-slate-200',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const v = variants[status] ?? variants['Pending'];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        v.pill
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', v.dot)} />
      {status}
    </span>
  );
}
