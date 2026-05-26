import { useState, useEffect } from 'react';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import { fetchRecords, approveRecord, rejectRecord, editRecord } from '../services/api';
import { useToastNotification } from '../context/ToastContext';
import {
  Check,
  X,
  Pencil,
  AlertTriangle,
  Filter,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

const scopeColors = {
  'Scope 1': 'bg-green-50 text-green-700 ring-green-200',
  'Scope 2': 'bg-blue-50 text-blue-700 ring-blue-200',
  'Scope 3': 'bg-violet-50 text-violet-700 ring-violet-200',
};

export default function ReviewRecords() {
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const addToast = useToastNotification();

  const loadRecords = () => {
    setLoading(true);
    const params = { page };
    if (scopeFilter !== 'All') params.scope = scopeFilter;
    if (statusFilter === 'Flagged') {
      params.is_suspicious = 'true';
    } else if (statusFilter !== 'All') {
      params.status = statusFilter;
    }

    fetchRecords(params)
      .then((data) => {
        // DRF returns { count, results } or list if pagination is disabled
        if (data.results) {
          setRecords(data.results);
          setTotalCount(data.count);
        } else {
          setRecords(data);
          setTotalCount(data.length);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        addToast('Failed to fetch emission records.', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRecords();
  }, [page, scopeFilter, statusFilter]);

  // Reset to page 1 on filter change
  const handleScopeFilterChange = (e) => {
    setScopeFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleApprove = (id) => {
    approveRecord(id)
      .then(() => {
        addToast(`Record REC-${id} approved.`, 'success');
        window.dispatchEvent(new Event('recordsUpdated'));
        loadRecords();
      })
      .catch((err) => {
        addToast(err.message || 'Approval failed.', 'error');
      });
  };

  const handleReject = (id) => {
    rejectRecord(id)
      .then(() => {
        addToast(`Record REC-${id} rejected.`, 'success');
        window.dispatchEvent(new Event('recordsUpdated'));
        loadRecords();
      })
      .catch((err) => {
        addToast(err.message || 'Rejection failed.', 'error');
      });
  };

  const startEdit = (rec) => {
    setEditId(rec.id);
    setEditValue(String(rec.normalized_value));
  };

  const saveEdit = (id) => {
    const parseFloatVal = parseFloat(editValue);
    if (isNaN(parseFloatVal)) {
      addToast('Invalid value entered.', 'error');
      setEditId(null);
      return;
    }

    editRecord(id, { normalized_value: parseFloatVal })
      .then(() => {
        addToast(`Record REC-${id} value updated.`, 'success');
        setEditId(null);
        window.dispatchEvent(new Event('recordsUpdated'));
        loadRecords();
      })
      .catch((err) => {
        addToast(err.message || 'Edit failed.', 'error');
        setEditId(null);
      });
  };

  // Frontend search filtering (matches search key against visible attributes)
  const filteredRecords = records.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(r.id).includes(s) ||
      (r.activity_type && r.activity_type.toLowerCase().includes(s)) ||
      (r.category && r.category.toLowerCase().includes(s))
    );
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / 50));

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID or activity type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">Filters:</span>
        </div>

        {/* Scope filter */}
        <div className="relative">
          <select
            value={scopeFilter}
            onChange={handleScopeFilterChange}
            className="appearance-none pl-3 pr-7 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 text-gray-700 cursor-pointer"
          >
            {['All', 'Scope 1', 'Scope 2', 'Scope 3'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="appearance-none pl-3 pr-7 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 text-gray-700 cursor-pointer"
          >
            {['All', 'Pending', 'Approved', 'Rejected', 'Flagged'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        <span className="ml-auto text-xs text-gray-400 font-medium">
          {filteredRecords.length} records on this page
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader
          title="Emission Records"
          subtitle="Review and action individual activity records"
        />
        <div className="px-5 pb-5 -mt-2">
          {loading ? (
            <Spinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Record ID', 'Source Type', 'Scope', 'Activity Type', 'Value', 'Unit', 'Category', 'Status', 'Flag', 'Actions'].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRecords.map((row) => {
                    const sourceName = row.source_type || 'SAP';
                    return (
                      <tr key={row.id} className="hover:bg-gray-50/70 transition-colors group">
                        <td className="py-3 px-3 font-mono text-xs text-gray-500 whitespace-nowrap">REC-{String(row.id).padStart(5, '0')}</td>
                        <td className="py-3 px-3 text-gray-700 font-medium text-xs whitespace-nowrap uppercase">{sourceName}</td>
                        <td className="py-3 px-3">
                          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full ring-1', scopeColors[row.scope])}>
                            {row.scope}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-xs max-w-[160px] truncate">{row.activity_type}</td>
                        <td className="py-3 px-3 font-semibold text-gray-800 text-right whitespace-nowrap">
                          {editId === row.id ? (
                            <input
                              className="w-24 border border-green-400 rounded px-1.5 py-0.5 text-sm focus:outline-none ring-1 ring-green-200"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(row.id)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit(row.id)}
                              autoFocus
                            />
                          ) : (
                            Number(row.normalized_value).toLocaleString(undefined, { maximumFractionDigits: 4 })
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-xs">{row.normalized_unit}</td>
                        <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">{row.category || '—'}</td>
                        <td className="py-3 px-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.is_suspicious ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto animate-pulse" />
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleApprove(row.id)}
                              disabled={row.status === 'Approved'}
                              title="Approve"
                              className={clsx(
                                'p-1.5 rounded-md transition-colors',
                                row.status === 'Approved'
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                              )}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleReject(row.id)}
                              disabled={row.status === 'Rejected'}
                              title="Reject"
                              className={clsx(
                                'p-1.5 rounded-md transition-colors',
                                row.status === 'Rejected'
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              )}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => startEdit(row)}
                              title="Edit value"
                              className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No records match your filters on this page.
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
            <span className="text-xs text-gray-400">Total: {totalCount} records</span>
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-gray-700 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
