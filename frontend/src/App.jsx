import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import UploadData from './pages/UploadData';
import ReviewRecords from './pages/ReviewRecords';
import AuditLogs from './pages/AuditLogs';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/upload" element={<UploadData />} />
            <Route path="/review" element={<ReviewRecords />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

