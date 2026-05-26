import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { uploadSAP, uploadUtility, uploadTravel } from '../services/api';
import { useToastNotification } from '../context/ToastContext';

export default function UploadCard({
  title,
  subtitle,
  icon: Icon = UploadCloud,
  acceptedFormats = '.csv',
  source,
  type,
  onUploadSuccess,
}) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const addToast = useToastNotification();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleUpload = () => {
    if (!file) return;

    // Validate only CSV is allowed by backend
    if (!file.name.endsWith('.csv')) {
      addToast('Only CSV files are supported currently.', 'error');
      return;
    }

    setUploading(true);

    let uploadFn;
    if (type === 'sap') uploadFn = uploadSAP;
    else if (type === 'utility') uploadFn = uploadUtility;
    else if (type === 'travel') uploadFn = uploadTravel;

    if (!uploadFn) {
      addToast('Unknown upload source type.', 'error');
      setUploading(false);
      return;
    }

    uploadFn(file)
      .then((data) => {
        setResult(data);
        setUploading(false);
        setDone(true);
        addToast(`Uploaded ${file.name} successfully!`, 'success');
        if (onUploadSuccess) onUploadSuccess();
        window.dispatchEvent(new Event('recordsUpdated'));
      })
      .catch((err) => {
        console.error(err);
        addToast(err.message || 'File upload failed.', 'error');
        setUploading(false);
      });
  };

  const reset = () => {
    setFile(null);
    setDone(false);
    setResult(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Card header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 ring-1 ring-green-100 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-green-600" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {done ? (
          <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
            <CheckCircle className="w-10 h-10 text-green-500" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-gray-800">Upload complete</p>
            <div className="text-xs text-gray-500 space-y-1 mt-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 w-full">
              <p className="truncate font-medium text-gray-700">{file?.name}</p>
              <div className="flex items-center justify-around pt-1">
                <div>
                  <span className="block font-bold text-gray-800 text-sm">
                    {result?.records_created ?? 0}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase">Records</span>
                </div>
                {result?.suspicious_records_flagged > 0 && (
                  <div>
                    <span className="block font-bold text-amber-600 text-sm flex items-center justify-center gap-0.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      {result.suspicious_records_flagged}
                    </span>
                    <span className="text-[10px] text-amber-500 uppercase font-semibold">Flagged</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={reset} className="mt-2 text-xs text-green-600 underline hover:text-green-700 font-medium">
              Upload another file
            </button>
          </div>
        ) : (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={clsx(
                'border-2 border-dashed rounded-lg px-6 py-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-150',
                dragging
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
              )}
            >
              <UploadCloud
                className={clsx('w-8 h-8', dragging ? 'text-green-500' : 'text-gray-300')}
                strokeWidth={1.25}
              />
              {file ? (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 text-center">
                    <span className="font-medium text-green-600">Click to browse</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">{acceptedFormats}</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={acceptedFormats}
                onChange={handleFile}
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={clsx(
                'w-full py-2 rounded-lg text-sm font-medium transition-all duration-150',
                file && !uploading
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading…
                </span>
              ) : (
                'Upload & Validate'
              )}
            </button>

            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
              Connected to: <span className="font-medium text-gray-600 ml-1">{source}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
