
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { ArrowLeft, Download, Share2, Printer, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatter';
import { generateReceiptPDF } from '../services/pdfService';

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const receipt = useLiveQuery(() => db.receipts.get(Number(id)), [id]);
  const invoice = useLiveQuery(() => receipt ? db.invoices.get(receipt.invoiceId) : null, [receipt]);
  const client = useLiveQuery(() => invoice ? db.clients.get(invoice.clientId) : null, [invoice]);
  const settings = useLiveQuery(() => db.settings.get(1));

  if (!receipt || !invoice || !client || !settings) return null;

  const currency = settings.currency || 'MYR';

  const handleDownloadPDF = () => {
    generateReceiptPDF(receipt, invoice, client, settings);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/invoices/${invoice.id}`)} className="p-2 bg-white border border-mate-cream rounded-lg text-mate-forest hover:bg-mate-cream transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-mate-dark">Receipt {receipt.receiptNo}</h2>
            <p className="text-sm text-mate-forest">Payment for Invoice {invoice.invoiceNo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadPDF} className="px-4 py-2 bg-[#3F4F44] text-white rounded-lg font-bold flex items-center gap-2 hover:bg-mate-dark transition-colors">
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white border border-mate-cream shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-mate-brown text-white p-8 text-center relative overflow-hidden">
          <CheckCircle2 className="mx-auto mb-4 opacity-30" size={64} />
          <h1 className="text-2xl font-black uppercase tracking-widest">Official Receipt</h1>
          <p className="opacity-80">Thank you for your business</p>
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        </div>

        <div className="p-8 space-y-8">
          <div className="flex justify-between border-b border-mate-cream pb-6">
            <div>
              <p className="text-xs font-bold text-mate-brown uppercase mb-1">From:</p>
              <p className="font-bold text-mate-dark">{settings.businessName}</p>
              <p className="text-xs text-mate-forest">{settings.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-mate-brown uppercase mb-1">To:</p>
              <p className="font-bold text-mate-dark">{client.name}</p>
              {client.company && <p className="text-xs text-mate-forest">{client.company}</p>}
            </div>
          </div>

          <div className="bg-mate-cream/30 p-8 rounded-2xl text-center space-y-4">
            <p className="text-sm text-mate-forest uppercase font-bold tracking-widest">Amount Received</p>
            <h2 className="text-4xl font-black text-mate-dark">{formatCurrency(receipt.amountPaid, currency)}</h2>
            <div className="flex justify-center gap-8 pt-4">
              <div>
                <p className="text-[10px] text-mate-forest uppercase font-bold">Paid Date</p>
                <p className="font-bold text-sm">{formatDate(receipt.paidDate)}</p>
              </div>
              <div>
                <p className="text-[10px] text-mate-forest uppercase font-bold">Method</p>
                <p className="font-bold text-sm">{receipt.paymentMethod}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-mate-forest font-medium">Receipt No:</span>
              <span className="text-mate-dark font-bold">{receipt.receiptNo}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-mate-forest font-medium">Reference Invoice:</span>
              <span className="text-mate-dark font-bold">{invoice.invoiceNo}</span>
            </div>
            {receipt.notes && (
              <div className="pt-4 border-t border-mate-cream">
                <p className="text-xs font-bold text-mate-brown uppercase mb-1">Notes:</p>
                <p className="text-sm text-mate-forest italic">"{receipt.notes}"</p>
              </div>
            )}
          </div>

          <div className="pt-12 flex flex-col items-center justify-center gap-4">
            <div className="w-32 h-0.5 bg-mate-dark" />
            <p className="text-xs font-bold text-mate-dark uppercase">Authorized Signature</p>
            <p className="text-[10px] text-mate-forest">This is a computer-generated receipt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}