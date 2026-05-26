import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import { fetchStats, fetchDataSources } from '../services/api';
import {
  statsData as mockStatsData,
  emissionsTrend as mockEmissionsTrend,
  emissionsData as mockEmissionsData,
  recentIngestions as mockRecentIngestions,
  dataQuality,
} from '../data/mockData';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ArrowRight, AlertTriangle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-4 py-3 text-sm">
        <p className="font-medium text-gray-700 mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-500 capitalize">{p.dataKey}:</span>
            <span className="font-semibold text-gray-800">{p.value.toLocaleString()} t</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [ingestions, setIngestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    Promise.all([fetchStats(), fetchDataSources()])
      .then(([statsRes, ingestionsRes]) => {
        setStats(statsRes);
        setIngestions(ingestionsRes);
        // If there are no uploaded data sources or stats is 0, we can flag that we are showing demo/mock data
        if (!statsRes || statsRes.total === 0) {
          setIsDemo(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard data, falling back to mock data:', err);
        setIsDemo(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Spinner size="lg" />;
  }

  // Map statsData
  const activeStatsData = isDemo
    ? mockStatsData
    : [
        {
          id: 'total',
          label: 'Total Records',
          value: stats.total.toLocaleString(),
          delta: '+100%',
          deltaPositive: true,
          sub: 'Live records',
          icon: 'database',
          color: 'blue',
        },
        {
          id: 'approved',
          label: 'Approved Records',
          value: stats.approved.toLocaleString(),
          delta: stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}%` : '0%',
          deltaPositive: true,
          sub: 'Approved share',
          icon: 'check-circle',
          color: 'green',
        },
        {
          id: 'pending',
          label: 'Pending Review',
          value: stats.pending.toLocaleString(),
          delta: stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}%` : '0%',
          deltaPositive: false,
          sub: 'Requires action',
          icon: 'clock',
          color: 'amber',
        },
        {
          id: 'rejected',
          label: 'Rejected Records',
          value: stats.rejected.toLocaleString(),
          delta: stats.total > 0 ? `${Math.round((stats.rejected / stats.total) * 100)}%` : '0%',
          deltaPositive: false,
          sub: 'Rejected share',
          icon: 'x-circle',
          color: 'red',
        },
      ];

  const activeEmissionsData = isDemo
    ? mockEmissionsData
    : [
        { scope: 'Scope 1', value: stats.emissions_sum['Scope 1'], unit: 'tCO₂e', color: '#16a34a' },
        { scope: 'Scope 2', value: stats.emissions_sum['Scope 2'], unit: 'tCO₂e', color: '#4ade80' },
        { scope: 'Scope 3', value: stats.emissions_sum['Scope 3'], unit: 'tCO₂e', color: '#86efac' },
      ];

  const activeEmissionsTrend = isDemo
    ? mockEmissionsTrend
    : stats.emissions_trend.length > 0
    ? stats.emissions_trend
    : [{ month: 'Ingest Month', scope1: stats.emissions_sum['Scope 1'], scope2: stats.emissions_sum['Scope 2'], scope3: stats.emissions_sum['Scope 3'] }];

  const activeRecentIngestions = isDemo
    ? mockRecentIngestions
    : ingestions.map((src) => {
        let sourceName = 'Corporate Travel';
        let scopeName = 'Scope 3';
        if (src.source_type === 'SAP') {
          sourceName = 'SAP Fuel & Procurement';
          scopeName = 'Scope 1';
        } else if (src.source_type === 'UTILITY') {
          sourceName = 'Utility Electricity';
          scopeName = 'Scope 2';
        }
        return {
          id: `ING-${String(src.id).padStart(3, '0')}`,
          source: sourceName,
          scope: scopeName,
          recordCount: src.records_count,
          uploadedBy: 'Analyst',
          uploadedAt: new Date(src.uploaded_at).toLocaleString(),
          status: src.suspicious_count > 0 ? 'Flagged' : 'Approved',
        };
      });

  const totalEmissions = activeEmissionsData.reduce((s, d) => s + d.value, 0);
  const suspiciousCount = isDemo ? 2 : stats?.suspicious || 0;

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {suspiciousCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{suspiciousCount} records flagged</span> for review — anomalous values detected in data ingestion{' '}
            <Link to="/review" className="underline font-medium hover:text-amber-900">Review now →</Link>
          </p>
        </div>
      )}

      {isDemo && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Showing Demo Data</span>. Upload real CSV files in the <Link to="/upload" className="underline font-medium hover:text-blue-900">Upload page</Link> to view live stats.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {activeStatsData.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Emissions trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionHeader
            title="GHG Emissions Trend"
            subtitle="Monthly breakdown by scope (tCO₂e)"
            action={
              <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                FY 2026
              </span>
            }
          />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activeEmissionsTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="s1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="s2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="s3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#86efac" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#86efac" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="scope1" stroke="#16a34a" strokeWidth={2} fill="url(#s1)" name="Scope 1" />
              <Area type="monotone" dataKey="scope2" stroke="#4ade80" strokeWidth={2} fill="url(#s2)" name="Scope 2" />
              <Area type="monotone" dataKey="scope3" stroke="#86efac" strokeWidth={2} fill="url(#s3)" name="Scope 3" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            {[{ label: 'Scope 1', color: '#16a34a' }, { label: 'Scope 2', color: '#4ade80' }, { label: 'Scope 3', color: '#86efac' }].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scope distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionHeader title="Emissions by Scope" subtitle={`Total: ${totalEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e`} />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={activeEmissionsData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                dataKey="value"
              >
                {activeEmissionsData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {activeEmissionsData.map((d) => (
              <div key={d.scope} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-gray-600">{d.scope}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-800">{d.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                  <span className="text-xs text-gray-400 ml-1">tCO₂e</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent ingestions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionHeader
            title="Recent Ingestions"
            subtitle="Latest data batches processed"
            action={
              <Link to="/review" className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {['Batch ID', 'Source', 'Scope', 'Records', 'Uploaded By', 'Uploaded At', 'Status'].map((h) => (
                    <th key={h} className="text-left py-2 px-2 text-xs font-medium text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeRecentIngestions.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-2 font-mono text-xs text-gray-500 whitespace-nowrap">{row.id}</td>
                    <td className="py-3 px-2 text-gray-700 font-medium max-w-[180px] truncate">{row.source}</td>
                    <td className="py-3 px-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {row.scope}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-700 font-semibold">{row.recordCount.toLocaleString()}</td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{row.uploadedBy}</td>
                    <td className="py-3 px-2 text-gray-400 text-xs whitespace-nowrap">{row.uploadedAt || 'N/A'}</td>
                    <td className="py-3 px-2">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data quality */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionHeader title="Data Quality Overview" subtitle="Completeness of ingested records" />
          <div className="space-y-4 mt-2">
            {dataQuality.map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-50">
            <SectionHeader title="Records by Source" subtitle="Ingestion count distribution" />
            <ResponsiveContainer width="100%" height={130}>
              <BarChart
                data={
                  isDemo
                    ? [
                        { name: 'SAP Fuel', count: 4020 },
                        { name: 'Utility', count: 3204 },
                        { name: 'Travel', count: 1724 },
                        { name: 'Logistics', count: 487 },
                        { name: 'Other', count: 312 },
                      ]
                    : [
                        { name: 'SAP Fuel', count: stats.scope_breakdown['Scope 1'] },
                        { name: 'Utility', count: stats.scope_breakdown['Scope 2'] },
                        { name: 'Travel', count: stats.scope_breakdown['Scope 3'] },
                      ]
                }
                margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v.toLocaleString()} records`]} />
                <Bar dataKey="count" fill="#16a34a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

