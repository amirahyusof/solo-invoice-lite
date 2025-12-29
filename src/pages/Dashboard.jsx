
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus, 
  LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatter';

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {any} props.value
 * @param {any} props.icon
 * @param {string} props.colorClass
 */
const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-[#DCD7C9] flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-[#3F4F44] opacity-70 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-[#2C3930]">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

export default function Dashboard() {
  const invoices = useLiveQuery(() => db.invoices.toArray());
  const settings = useLiveQuery(() => db.settings.get(1));

  if (!invoices) return null;

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);

  const draftCount = invoices.filter(inv => inv.status === 'draft').length;
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;

  const currency = settings?.currency || 'MYR';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={20} className="text-[#A27B5C]" />
            <h2 className="text-3xl font-black text-[#2C3930] tracking-tight">Dashboard</h2>
          </div>
          <p className="text-[#3F4F44] font-medium opacity-80">Managing your business, <span className="font-bold">{settings?.businessName || 'Freelancer'}</span></p>
        </div>
        <Link 
          to="/invoices/new" 
          className="bg-[#A27B5C] text-white px-8 py-3 rounded-xl font-black hover:bg-mate-dark transition-all flex items-center gap-2 shadow-lg shadow-mate-forest/20 active:scale-95"
        >
          <Plus size={20} />
          New Invoice
        </Link>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Revenue" 
          value={formatCurrency(totalRevenue, currency)} 
          icon={CheckCircle2} 
          colorClass="bg-green-100 text-green-700"
        />
        <StatCard 
          title="Pending Payments" 
          value={formatCurrency(pendingAmount, currency)} 
          icon={Clock} 
          colorClass="bg-yellow-100 text-yellow-700"
        />
        <StatCard 
          title="Total Paid" 
          value={paidCount} 
          icon={FileText} 
          colorClass="bg-blue-100 text-blue-700"
        />
        <StatCard 
          title="Drafts" 
          value={draftCount} 
          icon={AlertCircle} 
          colorClass="bg-gray-100 text-gray-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-[#DCD7C9] shadow-sm">
          <h3 className="text-lg font-bold text-[#2C3930] mb-6 flex items-center gap-2">
            <Clock size={20}  className='text-[#A27B5C]'/>
            Recent Activity
          </h3>
          <div className="space-y-4">
            {invoices.slice(0, 5).reverse().map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-3 border-b border-mate-cream last:border-0 hover:bg-mate-cream/20 rounded">
                <div>
                  <p className="font-semibold text-[#2C3930]">{inv.invoiceNo}</p>
                  <p className="text-xs text-[#3F4F44]">{new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(inv.total, currency)}</p>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                    inv.status === 'sent' ? 'bg-yellow-100 text-yellow-700' :
                    inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="py-12 text-center text-[#3F4F44]/40">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">Awaiting first transaction...</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#3F4F44] text-white p-8 rounded-xl shadow-lg flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-4 leading-tight">Instant Receipt <br/>Generation</h3>
            <p className="mb-8 font-medium text-white/70 max-w-sm leading-relaxed text-lg">
              Mark any invoice as <span className="text-green-400 font-black">PAID</span> to unlock professional, Malaysia-compliant receipts instantly.
            </p>
            <Link 
              to="/invoices" 
              className="inline-flex items-center gap-2 bg-[#DCD7C9] text-[#A27B5C] px-8 py-4 rounded-2xl font-black hover:bg-mate-cream hover:text-mate-dark transition-all shadow-xl active:scale-95"
            >
              Manage Invoices
            </Link>
          </div>
          {/* Decorative Elements */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#3F4F44]/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <CheckCircle2 size={120} />
          </div>
        </div>
      </div>
    </div>
  );
}