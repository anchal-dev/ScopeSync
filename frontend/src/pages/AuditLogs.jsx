import { useState, useEffect } from 'react';
import SectionHeader from '../components/SectionHeader';
import Spinner from '../components/Spinner';
import { fetchAuditLogs } from '../services/api';
import { useToastNotification } from '../context/ToastContext';
import { Search, Download, ChevronDown, Shield } from 'lucide-react';
import clsx from 'clsx';

const actionColors = {
  Approved: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-600',
  Flagged: 'bg-orange-50 text-orange-700',
  Created: 'bg-blue-50 text-blue-700',
  Updated: 'bg-violet-50 text-violet-700',
};

const roleColors = {
  'ESG Auditor': 'text-green-700 bg-green-50',
  'Data Analyst': 'text-blue-700 bg-blue-50',
  'Sustainability Lead': 'text-purple-700 bg-purple-50',
  Automated: 'text-gray-600 bg-gray-100',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const addToast = useToastNotification();

  useEffect(() => {
    fetchAuditLogs()
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        addToast('Failed to load audit trail logs.', 'error');
        setLoading(false);
      });
  }, []);

  const handleExport = () => {
    if (logs.length === 0) {
      addToast('No logs to export.', 'info');
      return;
    }
    const headers = ['Audit ID', 'Record ID', 'Action', 'User', 'Timestamp', 'Changes'];
    const csvRows = [headers.join(',')];

    logs.forEach((log) => {
      const row = [
        `AUD-${log.id}`,
        `REC-${log.record}`,
        log.action,
        `"${log.performed_by}"`,
        `"${new Date(log.timestamp).toISOString()}"`,
        `"${(log.new_value || log.old_value || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `scopesync_audit_trail_${Date.now()}.csv`);
    a.click();
    addToast('Audit trail exported successfully.', 'success');
  };

  const filtered = logs.filter((l) => {
    const matchAction = actionFilter === 'All' || l.action === actionFilter;
    const matchSearch =
      !search ||
      String(l.id).includes(search) ||
      String(l.record).includes(search) ||
      l.performed_by.toLowerCase().includes(search.toLowerCase());
    return matchAction && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold">Audit Trail</span>
          <span className="text-xs text-gray-400 ml-1">— immutable log of all record actions</span>
        </div>

        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, user, record…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 placeholder:text-gray-400 transition-all"
            />
          </div>

          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-700 cursor-pointer"
            >
              {['All', 'Created', 'Updated', 'Approved', 'Rejected'].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Timeline + Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5">
          <SectionHeader
            title="System & User Actions"
            subtitle={`${filtered.length} events — sorted by most recent`}
          />
        </div>
        
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Audit ID', 'Record ID', 'Action', 'User', 'Role', 'Timestamp', 'Change Summary'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((log) => {
                  let roleName = 'ESG Auditor';
                  if (log.performed_by === 'Analyst') roleName = 'Data Analyst';
                  else if (log.performed_by === 'System') roleName = 'Automated';

                  let changeSummary = '';
                  if (log.action === 'Created') {
                    changeSummary = 'Record ingested.';
                  } else if (log.action === 'Updated') {
                    changeSummary = `Value modified: ${log.old_value} → ${log.new_value}`;
                  } else {
                    changeSummary = `${log.old_value} → ${log.new_value}`;
                  }

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-400 whitespace-nowrap">AUD-{String(log.id).padStart(5, '0')}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-blue-600 font-medium whitespace-nowrap">
                        REC-{String(log.record).padStart(5, '0')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={clsx(
                            'inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full',
                            actionColors[log.action] ?? 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium text-xs whitespace-nowrap">{log.performed_by}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={clsx(
                            'text-xs font-medium px-2 py-0.5 rounded-md',
                            roleColors[roleName] ?? 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {roleName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 max-w-xs">
                        <span className="line-clamp-2">{changeSummary}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">No audit events match your filters.</div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-50 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Audit logs are retained for <span className="font-medium text-gray-600">7 years</span> per regulatory requirements.
          </span>
          <span className="text-xs text-gray-400">{filtered.length} records shown</span>
        </div>
      </div>
    </div>
  );
}
