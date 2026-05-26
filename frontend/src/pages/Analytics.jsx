import SectionHeader from '../components/SectionHeader';
import { emissionsTrend, intensityData, categoryBreakdown } from '../data/mockData';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#16a34a', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'];

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Carbon Intensity', value: '37.4', unit: 'tCO₂e / $M revenue', delta: '↓ 5.8%', positive: true },
          { label: 'YoY Reduction', value: '−12.3%', unit: 'vs. FY 2023 baseline', delta: 'On track', positive: true },
          { label: 'Scope 3 Share', value: '61%', unit: 'of total footprint', delta: '↑ 2pp', positive: false },
          { label: 'Offset Portfolio', value: '4,200', unit: 'tCO₂e retired', delta: '+800 this Q', positive: true },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className="text-xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.unit}</p>
            <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${k.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {k.delta}
            </span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Intensity trend */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">
          <SectionHeader title="Carbon Intensity Trend" subtitle="tCO₂e per $M revenue by quarter" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={intensityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} tCO₂e / $M`]} />
              <Line
                type="monotone"
                dataKey="intensity"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scope 3 breakdown */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">
          <SectionHeader title="Scope 3 Category Breakdown" subtitle="tCO₂e by upstream / downstream category" />
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v.toLocaleString()} tCO₂e`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryBreakdown.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                    <span className="text-xs text-gray-600 leading-tight">{c.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{c.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly all scopes */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 lg:col-span-2">
          <SectionHeader title="Monthly Emissions by Scope" subtitle="tCO₂e — full year breakdown" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={emissionsTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="scope1" name="Scope 1" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="scope2" name="Scope 2" stackId="a" fill="#4ade80" />
              <Bar dataKey="scope3" name="Scope 3" stackId="a" fill="#86efac" radius={[3, 3, 0, 0]} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', color: '#6b7280', paddingTop: '12px' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
