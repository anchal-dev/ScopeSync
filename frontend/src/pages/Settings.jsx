import SectionHeader from '../components/SectionHeader';
import { Check, Globe, Users, Bell, Key, Link } from 'lucide-react';

const integrations = [
  { name: 'SAP S/4HANA', desc: 'ERP — Fuel & Procurement', connected: true },
  { name: 'SAP Concur', desc: 'Corporate Travel Management', connected: true },
  { name: 'National Grid API', desc: 'Electricity & Steam data', connected: true },
  { name: 'Salesforce', desc: 'CRM — Revenue data for intensity', connected: false },
  { name: 'Snowflake', desc: 'Data Warehouse integration', connected: false },
];

const users = [
  { name: 'Sarah Mitchell', email: 'sarah.m@acme.com', role: 'ESG Auditor', status: 'Active' },
  { name: 'James Okafor', email: 'james.o@acme.com', role: 'Data Analyst', status: 'Active' },
  { name: 'Priya Nair', email: 'priya.n@acme.com', role: 'Sustainability Lead', status: 'Active' },
  { name: 'Daniel Brooks', email: 'daniel.b@acme.com', role: 'ESG Auditor', status: 'Active' },
  { name: 'Mei-Ling Zhou', email: 'mei.z@acme.com', role: 'Data Analyst', status: 'Inactive' },
];

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Org settings */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
        <SectionHeader title="Organisation Settings" subtitle="Reporting entity, fiscal year, and regulatory standards" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { label: 'Legal Entity Name', value: 'Acme Corporation Ltd.' },
            { label: 'Headquarters', value: 'London, United Kingdom' },
            { label: 'Reporting Standard', value: 'GHG Protocol Corporate Standard' },
            { label: 'Fiscal Year Start', value: 'January 1' },
            { label: 'Base Currency', value: 'USD ($)' },
            { label: 'Emission Factor Database', value: 'IPCC AR6 (2023)' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="text-xs font-medium text-gray-400 block mb-1">{label}</label>
              <input
                defaultValue={value}
                className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all"
              />
            </div>
          ))}
        </div>
        <button className="mt-5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
          Save Changes
        </button>
      </div>

      {/* Integrations */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
        <SectionHeader title="Connected Integrations" subtitle="Manage data source connections" action={
          <button className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 border border-green-200 px-3 py-1.5 rounded-lg">
            <Link className="w-3.5 h-3.5" /> Add Connection
          </button>
        } />
        <div className="space-y-3">
          {integrations.map((i) => (
            <div key={i.name} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i.connected ? 'bg-green-50' : 'bg-gray-100'}`}>
                  <Globe className={`w-4 h-4 ${i.connected ? 'text-green-600' : 'text-gray-400'}`} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{i.name}</p>
                  <p className="text-xs text-gray-400">{i.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {i.connected ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <button className="text-xs font-medium text-gray-600 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
        <SectionHeader title="Team Members" subtitle="Manage user access and roles" action={
          <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
            <Users className="w-3.5 h-3.5" /> Invite User
          </button>
        } />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Email', 'Role', 'Status', ''].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.email} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-500">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">{u.role}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
        <SectionHeader title="Notification Preferences" subtitle="Choose when and how you receive alerts" />
        <div className="space-y-3">
          {[
            { label: 'Anomaly detection alerts', desc: 'Notify when records exceed 2× facility average', enabled: true },
            { label: 'Batch ingestion complete', desc: 'Email summary after each upload job finishes', enabled: true },
            { label: 'Pending review reminders', desc: 'Daily digest of records awaiting approval', enabled: false },
            { label: 'Audit log exports', desc: 'Monthly audit report delivered by email', enabled: true },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">{n.label}</p>
                <p className="text-xs text-gray-400">{n.desc}</p>
              </div>
              <button
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${n.enabled ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${n.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
