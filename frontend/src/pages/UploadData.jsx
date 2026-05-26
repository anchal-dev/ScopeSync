import { useState, useEffect } from 'react';
import UploadCard from '../components/UploadCard';
import SectionHeader from '../components/SectionHeader';
import Spinner from '../components/Spinner';
import { fetchDataSources } from '../services/api';
import { Fuel, Zap, Plane, Info } from 'lucide-react';

const uploadSources = [
  {
    title: 'SAP Fuel & Procurement',
    subtitle: 'Scope 1 — Direct combustion & purchased fuels',
    icon: Fuel,
    acceptedFormats: '.csv',
    source: 'SAP S/4HANA ERP',
    type: 'sap',
  },
  {
    title: 'Utility Electricity Data',
    subtitle: 'Scope 2 — Grid electricity & steam consumption',
    icon: Zap,
    acceptedFormats: '.csv',
    source: 'National Grid API / Manual',
    type: 'utility',
  },
  {
    title: 'Corporate Travel Data',
    subtitle: 'Scope 3 — Air, rail, hotel & car rental',
    icon: Plane,
    acceptedFormats: '.csv',
    source: 'SAP Concur / Egencia',
    type: 'travel',
  },
];

export default function UploadData() {
  const [ingestions, setIngestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUploads = () => {
    fetchDataSources()
      .then((data) => {
        setIngestions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching uploads history:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadUploads();
  }, []);

  return (
    <div className="space-y-6">
      {/* Info bar */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <span className="font-semibold">Supported formats:</span> CSV files containing raw energy or travel activity data. Maximum file size: 50 MB per upload.
          Files are validated against GHG Protocol emission factors automatically upon ingestion.
        </div>
      </div>

      {/* Upload cards */}
      <div>
        <SectionHeader
          title="Upload Emission Activity Data"
          subtitle="Select a data source below to ingest emission records into ScopeSync."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {uploadSources.map((s) => (
            <UploadCard key={s.title} {...s} onUploadSuccess={loadUploads} />
          ))}
        </div>
      </div>

      {/* Recent uploads */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionHeader title="Recent Uploads" subtitle="Last 5 batch ingestion jobs" />
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Batch ID', 'Source Type', 'File Name', 'Records Ingested', 'Flagged Suspicious', 'Date & Time', 'Status'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ingestions.slice(0, 5).map((row) => {
                  let sourceName = 'Corporate Travel';
                  if (row.source_type === 'SAP') sourceName = 'SAP Fuel';
                  else if (row.source_type === 'UTILITY') sourceName = 'Utility API';

                  const status = row.suspicious_count > 0 ? 'Flagged' : 'Approved';
                  const statusColors = {
                    Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                    Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
                    Flagged: 'bg-orange-50 text-orange-700 ring-orange-200',
                    Rejected: 'bg-red-50 text-red-700 ring-red-200',
                  };

                  return (
                    <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs text-gray-500">ING-{String(row.id).padStart(3, '0')}</td>
                      <td className="py-3 px-3 text-gray-700 font-medium">{sourceName}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs truncate max-w-[180px]">{row.file_name}</td>
                      <td className="py-3 px-3 text-gray-800 font-semibold">{row.records_count.toLocaleString()}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs font-semibold text-amber-600">
                        {row.suspicious_count > 0 ? `${row.suspicious_count} records` : '0'}
                      </td>
                      <td className="py-3 px-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(row.uploaded_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-0.5 ring-1 ${statusColors[status]}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {ingestions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                      No upload batches found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
