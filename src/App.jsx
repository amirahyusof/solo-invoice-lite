
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  Menu, 
  X,
  PlusCircle
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetail from './pages/InvoiceDetail';
import ReceiptDetail from './pages/ReceiptDetail';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.toggle
 */
const Sidebar = ({ isOpen, toggle }) => {
  const location = useLocation();
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Invoices', icon: FileText, path: '/invoices' },
    { name: 'Clients', icon: Users, path: '/clients' },
    { name: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  const activeClass = "bg-[#3F4F44] text-white";
  const inactiveClass = "text-[#2C3930] hover:bg-[#A27B5C]/20";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggle}
        />
      )}
      
      {/* Sidebar Content */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-30 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[#DCD7C9] flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#2C3930] flex items-center gap-2">
            Solo Invoice
          </h1>
          <button onClick={toggle} className="lg:hidden border rounded-full p-1 text-[#2C3930] hover:bg-[#E2E8F0]">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && toggle()}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? activeClass : inactiveClass}`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

/**
 * @param {Object} props
 * @param {() => void} props.toggleSidebar
 */
const Header = ({ toggleSidebar }) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#DCD7C9] p-4 flex items-center justify-between lg:hidden">
      <button onClick={toggleSidebar} className="p-2 text-[#2C3930]">
        <Menu size={24} />
      </button>
      <span className="font-bold text-lg text-[#2C3930]">Solo Invoice</span>
      <div className="w-10" /> {/* Spacer */}
    </header>
  );
};

const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <Header toggleSidebar={toggleSidebar} />
        <div className="max-w-6xl mx-auto mt-4 lg:mt-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/edit/:id" element={<InvoiceForm />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/receipts/:id" element={<ReceiptDetail />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
