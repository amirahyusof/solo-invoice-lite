
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Trash2,
  FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatter';

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');
  /** @type {[string, Function]} */
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const invoices = useLiveQuery(async () => {
    let collection = db.invoices.toCollection();
    
    const results = await collection.reverse().sortBy('createdAt');
    const enriched = await Promise.all(results.map(async inv => {
      const client = await db.clients.get(inv.clientId);
      return { ...inv, clientName: client?.name || 'Unknown Client' };
    }));

    return enriched.filter(inv => {
      const matchesSearch = inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const settings = useLiveQuery(() => db.settings.get(1));
  const currency = settings?.currency || 'MYR';

  /**
   * @param {number} id
   */
  const deleteInvoice = async (id) => {
    if (confirm('Delete this invoice? This will also delete all items associated with it.')) {
      // Execute transaction to ensure atomic deletion of invoice and its items
      await db.transaction('rw', [db.invoices, db.invoice_items], async () => {
        await db.invoice_items.where({ invoiceId: id }).delete();
        await db.invoices.delete(id);
      });
    }
  };

  /** @type {Record<InvoiceStatus, string>} */
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    sent: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    paid: 'bg-green-50 text-green-700 border-green-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-mate-dark">Invoices</h2>
          <p className="text-[#3F4F44] opacity-80">Track your billing and payments</p>
        </div>
        <Link 
          to="/invoices/new" 
          className="bg-[#A27B5C] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#A27B5C]/90 transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <Plus size={20} />
          Create Invoice
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#DCD7C9] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#DCD7C9] opacity-50" size={18} />
          <input 
            type="text" 
            placeholder="Search by invoice # or client..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-[#3F4F44] text-[#DCD7C9]  border-[#DCD7C9] outline-none focus:ring-2 focus:ring-[#A27B5C]/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[#3F4F44] opacity-50" />
          <select 
            className="px-6 py-2 rounded-lg border bg-[#3F4F44] text-[#DCD7C9] border-[#DCD7C9] outline-none focus:ring-2 focus:ring-[#A27B5C]/30"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCD7C9] shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#DCD7C9]/30 text-mate-dark font-bold text-sm uppercase">
            <tr>
              <th className="px-6 py-4">Invoice No</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCD7C9]">
            {invoices?.map(inv => (
              <tr 
                key={inv.id} 
                className="hover:bg-[#DCD7C9]/10 transition-colors cursor-pointer"
                onClick={() => navigate(`/invoices/${inv.id}`)}
              >
                <td className="px-6 py-4">
                  <span className="font-bold text-[#3F4F44]">{inv.invoiceNo}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-mate-dark">{inv.clientName}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-mate-dark">{formatCurrency(inv.total, currency)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-[#3F4F44]">{new Date(inv.issueDate).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full border ${statusColors[inv.status]}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/invoices/${inv.id}`} className="p-2 text-[#3F4F44] hover:bg-[#DCD7C9] rounded-lg" title="View Detail">
                      <Eye size={18} />
                    </Link>
                    <button 
                      onClick={() => inv.id && deleteInvoice(inv.id)} 
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices?.length === 0 && (
          <div className="py-20 text-center">
            <FileText size={48} className="mx-auto text-[#DCD7C9] mb-4" />
            <h3 className="text-lg font-bold text-mate-dark">No invoices found</h3>
            <p className="text-sm text-[#3F4F44]">Try a different search or create a new invoice</p>
          </div>
        )}
      </div>
    </div>
  );
}