import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden print:h-auto print:bg-white print:overflow-visible">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden print:overflow-visible print:block">
        <div className="print:hidden">
          <Navbar />
        </div>
        <main className="flex-1 overflow-y-auto print:overflow-visible print:h-auto">
          <div className="max-w-screen-xl mx-auto px-6 py-6 print:p-0 print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
