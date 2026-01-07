
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  CheckCircle, 
  Edit, 
  CreditCard,
  MessageCircle,
  Mail,
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatter';
import { generateInvoicePDF } from '../services/pdfService';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const invoice = useLiveQuery(() => db.invoices.get(Number(id)), [id]);
  const client = useLiveQuery(() => invoice ? db.clients.get(invoice.clientId) : null, [invoice]);
  const items = useLiveQuery(() => db.invoice_items.where({ invoiceId: Number(id) }).toArray(), [id]);
  const settings = useLiveQuery(() => db.settings.get(1));
  const receipt = useLiveQuery(() => db.receipts.where({ invoiceId: Number(id) }).first(), [id]);

  if (!invoice || !client || !items || !settings) return null;

  const currency = settings.currency || 'MYR';

  const handleDownloadPDF = () => {
    generateInvoicePDF(invoice, client, items, settings, receipt);
  };

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleMarkPaid = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await db.transaction('rw', [db.invoices, db.receipts, db.counters], async () => {
      const receiptCounter = await db.counters.get('receipt');
      const nextVal = (receiptCounter?.value || 0) + 1;
      const year = new Date().getFullYear();
      const receiptNo = `RCT-${year}-${nextVal.toString().padStart(3, '0')}`;

      await db.receipts.add({
        receiptNo,
        invoiceId: invoice.id,
        paidDate: /** @type {string} */ (formData.get('paidDate')),
        paymentMethod: /** @type {string} */ (formData.get('paymentMethod')),
        amountPaid: invoice.total,
        notes: /** @type {string} */ (formData.get('notes')),
      });

      await db.invoices.update(invoice.id, { status: 'paid' });
      await db.counters.update('receipt', { value: nextVal });
    });

    setIsReceiptModalOpen(false);
  };

  const shareWhatsApp = () => {
    const message = `Hello ${client.name}, here is the invoice ${invoice.invoiceNo} for ${formatCurrency(invoice.total, currency)}. Please let me know if you have any questions. Thanks!`;
    window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareEmail = () => {
    const subject = `Invoice ${invoice.invoiceNo} from ${settings.businessName}`;
    const body = `Hello ${client.name},\n\nPlease find attached the invoice ${invoice.invoiceNo} for your reference.\n\nTotal Amount: ${formatCurrency(invoice.total, currency)}\nDue Date: ${formatDate(invoice.dueDate)}\n\nThank you!`;
    window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="p-2 bg-white border border-[#DCD7C9] rounded-lg text-[#3F4F44] hover:bg-[#DCD7C9] transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-mate-dark">{invoice.invoiceNo}</h2>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {invoice.status}
              </span>
              <span className="text-sm text-mate-forest">Issued on {formatDate(invoice.issueDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status !== 'paid' && (
            <Link to={`/invoices/edit/${id}`} className="px-4 py-2 bg-white border border-[#DCD7C9] rounded-lg font-bold text-mate-dark flex items-center gap-2 hover:bg-[#DCD7C9] transition-colors">
              <Edit size={18} /> Edit
            </Link>
          )}
          <button onClick={handleDownloadPDF} className="px-4 py-2 bg-[#3F4F44] text-white rounded-lg font-bold flex items-center gap-2 hover:bg-[#2C3930] transition-colors cursor-pointer">
            <Download size={18} /> PDF
          </button>
          {invoice.status !== 'paid' && (
            <button onClick={() => setIsReceiptModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 transition-colors cursor-pointer">
              <CheckCircle size={18} /> Mark as Paid
            </button>
          )}
          {receipt && (
            <Link to={`/receipts/${receipt.id}`} className="px-4 py-2 bg-[#A27B5C] text-white rounded-lg font-bold flex items-center gap-2 hover:bg-[#A27B5C]/90 transition-colors">
              <CreditCard size={18} /> View Receipt
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#DCD7C9] shadow-xl rounded-2xl overflow-hidden min-h-150 flex flex-col">
            <div className="h-4 bg-[#3F4F44] w-full" />
            <div className="p-8 md:p-12 flex-1">
              <div className="flex flex-col md:flex-row justify-between mb-12">
                <div className="flex items-start gap-4">
                  {settings.logo && (
                    <img src={settings.logo} alt="Business Logo" className="w-20 h-20 object-contain rounded-lg border border-[#DCD7C9] bg-white p-2" />
                  )}
                  <div>
                    <h1 className="text-3xl font-black text-[#3F4F44] mb-2">{settings.businessName}</h1>
                    <p className="text-[#3F4F44]/60 text-sm whitespace-pre-line">{settings.address}</p>
                  </div>
                </div>
                <div className="text-left md:text-right mt-6 md:mt-0">
                  <h2 className="text-4xl font-bold text-mate-dark opacity-20 uppercase tracking-widest mb-4">Invoice</h2>
                  <p className="font-bold text-[#3F4F44]">{invoice.invoiceNo}</p>
                  <p className="text-sm text-[#3F4F44]/60">Date: {formatDate(invoice.issueDate)}</p>
                  <p className="text-sm text-[#3F4F44]/60 font-bold">Due: {formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 border-y border-[#DCD7C9] py-8">
                <div>
                  <h3 className="text-xs font-bold uppercase text-[#A27B5C] mb-2 tracking-wider">Bill To:</h3>
                  <p className="font-bold text-lg text-mate-dark">{client.name}</p>
                  {client.company && <p className="font-medium text-[#3F4F44]">{client.company}</p>}
                  <p className="text-sm text-[#3F4F44]/70 whitespace-pre-line">{client.address}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-[#A27B5C] mb-2 tracking-wider">Payment Info:</h3>
                  <p className="text-sm text-mate-forest font-medium capitalize ">{settings.bankName}</p>
                  <p className="text-sm text-mate-dark font-bold">Acc No: {settings.bankAccountNo}</p>
                </div>
              </div>

              <table className="w-full mb-12">
                <thead className="border-b-2 border-[#2C3930]">
                  <tr>
                    <th className="text-left py-3 text-sm font-black uppercase">Description</th>
                    <th className="text-right py-3 text-sm font-black uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCD7C9]/50">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-4 text-mate-dark font-medium capitalize">{item.description}</td>
                      <td className="py-4 text-right text-mate-dark font-bold">{formatCurrency(item.total, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-full md:w-64 space-y-3">
                  <div className="flex justify-between font-black text-2xl pt-3 border-t-2 border-[#3F4F44] text-mate-dark">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Share Layout Refinement */}
          <div className="bg-white p-8 rounded-2xl border border-[#DCD7C9] shadow-sm flex flex-col justify-between items-center">
            <h3 className="font-black text-mate-dark mb-4 flex items-center justify-center uppercase tracking-widest text-sm text-center">
              <Share2 size={20} className="text-[#A27B5C]" /> Quick Share
            </h3>
            <div className="flex flex-row gap-2 w-full max-w-fit">
              <button 
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl hover:bg-green-100 transition-all border-2 border-green-200 active:scale-95 shadow-sm"
                title="Share via WhatsApp"
              >
                <MessageCircle size={24} />
                <span className="font-black text-sm">WhatsApp</span>
              </button>
              <button 
                onClick={shareEmail}
                className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-all border-2 border-blue-200 active:scale-95 shadow-sm"
                title="Share via Email"
              >
                <Mail size={24} />
                <span className="font-black text-sm">Email</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#DCD7C9] shadow-sm">
            <h3 className="font-black text-xs uppercase text-[#A27B5C] mb-3 tracking-widest">Client Contact</h3>
            <p className="text-sm font-black text-mate-dark">{client.name}</p>
            <p className="text-sm text-mate-forest font-medium">{client.email || 'No email provided'}</p>
          </div>
        </div>
      </div>

      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#DCD7C9] flex justify-between items-center bg-green-600 text-white">
              <h3 className="text-xl font-bold">Confirm Payment</h3>
              <button onClick={() => setIsReceiptModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleMarkPaid} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-mate-dark mb-1">Paid Date *</label>
                <input required name="paidDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 rounded-xl border-2 border-[#3F4F44]/20 bg-white focus:ring-4 focus:ring-[#A27B5C]/20 outline-none font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-mate-dark mb-1">Method</label>
                <select name="paymentMethod" className="w-full px-4 py-3 rounded-xl border-2 border-[#3F4F44]/20 bg-white focus:ring-4 focus:ring-[#A27B5C]/20 outline-none font-bold">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsReceiptModalOpen(false)} className="flex-1 px-4 py-2 border border-[#DCD7C9] rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}