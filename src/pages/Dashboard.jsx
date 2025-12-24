
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus
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
      <p className="text-sm font-medium text-mate-forest opacity-70 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-mate-dark">{value}</h3>
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
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-mate-dark">Dashboard</h2>
          <p className="text-mate-forest opacity-80">Welcome back, {settings?.businessName || 'Freelancer'}</p>
        </div>
        <Link 
          to="/invoices/new" 
          className="bg-[#A27B5C] text-white px-6 py-2 rounded-lg font-bold hover:bg-mate-brown/90 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Create Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Received" 
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
          title="Paid Invoices" 
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
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock size={20} />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {invoices.slice(0, 5).reverse().map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-3 border-b border-mate-cream last:border-0 hover:bg-mate-cream/20 rounded">
                <div>
                  <p className="font-semibold text-mate-dark">{inv.invoiceNo}</p>
                  <p className="text-xs text-mate-forest">{new Date(inv.createdAt).toLocaleDateString()}</p>
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
              <div className="py-8 text-center text-mate-forest opacity-60">
                No invoices yet. Create your first one!
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#3F4F44] text-white p-8 rounded-xl shadow-lg flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Need a Receipt?</h3>
            <p className="mb-6 opacity-80">Mark any invoice as "Paid" and we'll automatically generate a professional receipt for you to share with your client.</p>
            <Link 
              to="/invoices" 
              className="inline-block bg-[#DCD7C9] text-[#2C3930] px-6 py-3 rounded-lg font-bold hover:bg-white transition-colors"
            >
              View Invoices
            </Link>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#A27B5C]/20 rounded-full blur-2xl"></div>
        </div>
      </div>
    </div>
  );
}