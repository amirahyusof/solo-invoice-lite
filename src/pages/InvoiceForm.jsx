
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  Eye,
  Edit3,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Settings as SettingsIcon,
  Users
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatter';

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  /** @type {[number | null, Function]} */
  const [activeInvoiceId, setActiveInvoiceId] = useState(id ? Number(id) : null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  /** @type {[Date | null, Function]} */
  const [lastSaved, setLastSaved] = useState(null);

  const clients = useLiveQuery(() => db.clients.toArray());
  const settings = useLiveQuery(() => db.settings.get(1));
  
  /** @type {[number, Function]} */
  const [clientId, setClientId] = useState(0);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  /** @type {[Partial<InvoiceItem>[], Function]} */
  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [notes, setNotes] = useState('');

  const selectedClient = clients?.find(c => c.id === clientId);
  
  // Validation for missing prerequisites
  const hasBusinessProfile = !!settings?.businessName;
  const hasClients = (clients?.length || 0) > 0;
  const isPrerequisiteMissing = !hasBusinessProfile || !hasClients;

  useEffect(() => {
    if (isEditing) {
      db.invoices.get(Number(id)).then(async inv => {
        if (inv) {
          setClientId(inv.clientId);
          setInvoiceNo(inv.invoiceNo);
          setIssueDate(inv.issueDate);
          setDueDate(inv.dueDate);
          setNotes(inv.notes || '');
          const existingItems = await db.invoice_items.where({ invoiceId: inv.id }).toArray();
          setItems(existingItems);
        }
      });
    } else {
      db.counters.get('invoice').then(counter => {
        const nextVal = (counter?.value || 0) + 1;
        const year = new Date().getFullYear();
        const formattedNo = `INV-${year}-${nextVal.toString().padStart(3, '0')}`;
        setInvoiceNo(formattedNo);
      });
      const date = new Date();
      date.setDate(date.getDate() + 14);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (!settings || clientId === 0 || isPrerequisiteMissing) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
      
      /** @type {Partial<Invoice>} */
      const invoiceData = {
        invoiceNo,
        clientId,
        issueDate,
        dueDate,
        status: isEditing ? undefined : 'draft',
        notes,
        subtotal,
        total: subtotal,
        createdAt: isEditing ? undefined : Date.now(),
      };

      try {
        await db.transaction('rw', [db.invoices, db.invoice_items, db.counters], async () => {
          let currentId = activeInvoiceId;
          
          if (currentId) {
            await db.invoices.update(currentId, invoiceData);
            await db.invoice_items.where({ invoiceId: currentId }).delete();
          } else {
            currentId = await db.invoices.add(/** @type {Invoice} */ (invoiceData));
            setActiveInvoiceId(currentId);
          }

          const itemsToSave = /** @type {InvoiceItem[]} */ (items.map(item => ({
            ...item,
            invoiceId: currentId,
          })));
          
          await db.invoice_items.bulkAdd(itemsToSave);
        });
        setLastSaved(new Date());
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [clientId, items, notes, issueDate, dueDate, settings, activeInvoiceId, isEditing, invoiceNo, isPrerequisiteMissing]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  /**
   * @param {number} index
   */
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  /**
   * @param {number} index
   * @param {keyof InvoiceItem} field
   * @param {any} value
   */
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const item = newItems[index];
    /** @type {any} */
    (item)[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const total = subtotal;
  const currency = settings?.currency || 'MYR';

  /**
   * @param {React.FormEvent} e
   */
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (isPrerequisiteMissing) return;
    if (clientId === 0) return alert('Please select a client');

    setIsSaving(true);
    try {
      await db.transaction('rw', [db.invoices, db.invoice_items, db.counters], async () => {
        /** @type {any} */
        const invoiceData = {
          invoiceNo,
          clientId,
          issueDate,
          dueDate,
          status: 'sent',
          notes,
          subtotal,
          total,
        };

        let finalId = activeInvoiceId;
        if (finalId) {
          await db.invoices.update(finalId, invoiceData);
          await db.invoice_items.where({ invoiceId: finalId }).delete();
          if (!isEditing) {
             const counter = await db.counters.get('invoice');
             await db.counters.update('invoice', { value: (counter?.value || 0) + 1 });
          }
        } else {
          finalId = await db.invoices.add({ ...invoiceData, createdAt: Date.now() });
          const counter = await db.counters.get('invoice');
          await db.counters.update('invoice', { value: (counter?.value || 0) + 1 });
        }

        const itemsToSave = /** @type {InvoiceItem[]} */ (items.map(item => ({ ...item, invoiceId: finalId })));
        await db.invoice_items.bulkAdd(itemsToSave);
        navigate(`/invoices/${finalId}`);
      });
    } catch (err) {
      alert('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  // Improved text input readability classes
  const inputClasses = "w-full px-4 py-3 rounded-xl border-2 border-[#3F4F44]/20 bg-white focus:ring-4 focus:ring-[#A27B5C]/20 focus:border-[#A27B5C] outline-none font-bold text-mate-dark transition-all placeholder:text-[#3F4F44]/20 shadow-sm";

  return (
    <div className="space-y-6 pb-20">
      {/* Configuration Warnings Banner */}
      {isPrerequisiteMissing && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-black text-red-900 mb-1">Setup Required</h3>
            <p className="text-sm text-red-800 font-medium leading-relaxed">
              Invoices cannot be created yet. You must first complete your <strong>Business Profile</strong> and add at least one <strong>Client</strong>.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            {!hasBusinessProfile && (
              <Link to="/settings" className="flex items-center justify-center gap-2 bg-[#3F4F44] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-mate-dark transition-all text-sm whitespace-nowrap shadow-lg">
                <SettingsIcon size={18} /> Setup Business Profile
              </Link>
            )}
            {!hasClients && (
              <Link to="/clients" className="flex items-center justify-center gap-2 bg-mate-brown text-white px-6 py-2.5 rounded-xl font-bold hover:bg-mate-brown/90 transition-all text-sm whitespace-nowrap shadow-lg">
                <Users size={18} /> Add Your First Client
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-mate-cream rounded-lg text-mate-forest hover:bg-mate-cream transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-mate-dark tracking-tight">{isEditing ? 'Edit Invoice' : 'New Invoice'}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-semibold text-mate-forest bg-mate-cream/40 px-2 py-0.5 rounded">{invoiceNo}</span>
              {lastSaved && !isSaving && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-green-700">
                  <CheckCircle size={12} /> Auto-saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-mate-cream lg:hidden shadow-sm">
          <button 
            onClick={() => setShowPreview(false)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${!showPreview ? 'bg-[#3F4F44] text-white' : 'text-mate-forest hover:bg-mate-cream/30'}`}
          >
            <Edit3 size={16} /> Edit
          </button>
          <button 
            onClick={() => setShowPreview(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${showPreview ? 'bg-[#3F4F44] text-white' : 'text-mate-forest hover:bg-mate-cream/30'}`}
          >
            <Eye size={16} /> Preview
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start ${isPrerequisiteMissing ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
        <form 
          onSubmit={handleFinalSubmit} 
          className={`lg:col-span-7 space-y-6 ${showPreview ? 'hidden lg:block' : 'block'}`}
        >
          <div className="bg-white p-7 rounded-2xl border border-[#DCD7C9] shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-mate-dark mb-2 uppercase tracking-wide opacity-90">Select Client *</label>
                <select 
                  required
                  className={inputClasses}
                  value={clientId}
                  onChange={(e) => setClientId(Number(e.target.value))}
                >
                  <option value={0}>-- Choose Client --</option>
                  {clients?.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C3930] mb-2 uppercase tracking-wide opacity-90">Invoice No</label>
                <input readOnly value={invoiceNo} className="w-full px-4 py-3 rounded-xl border border-[#DCD7C9] bg-[#DCD7C9]/20 outline-none text-mate-forest font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C3930] mb-2 uppercase tracking-wide opacity-90">Issue Date</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C3930] mb-2 uppercase tracking-wide opacity-90">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClasses} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCD7C9] shadow-sm overflow-hidden">
            <div className="p-5 bg-[#DCD7C9]/40 border-b border-[#DCD7C9] flex justify-between items-center">
              <h3 className="font-extrabold text-mate-forest uppercase text-sm tracking-widest">Billing Summary</h3>
              <button type="button" onClick={addItem} className="bg-[#3F4F44] text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-mate-dark transition-all shadow-md active:scale-95">
                <Plus size={16} /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#DCD7C9]/10 text-[11px] uppercase font-bold text-mate-forest">
                  <tr>
                    <th className="px-5 py-4 min-w-55">Description</th>
                    <th className="px-5 py-4 w-24">Qty</th>
                    <th className="px-5 py-4 w-36">Price</th>
                    <th className="px-5 py-4 w-36">Total</th>
                    <th className="px-5 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCD7C9]/40">
                  {items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-[#DCD7C9]/5 transition-colors">
                      <td className="px-5 py-3 align-top">
                        <textarea 
                          rows={2}
                          required
                          placeholder="Service description..." 
                          className="w-full border-none focus:ring-0 outline-none p-0 text-sm font-bold bg-transparent resize-none leading-relaxed text-mate-dark placeholder:text-mate-forest/20"
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-3 align-top">
                        <input 
                          type="number" 
                          min="0"
                          className="w-full border-none focus:ring-0 outline-none p-0 text-sm font-black bg-transparent text-mate-dark"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-3 align-top">
                        <div className="flex items-center gap-1.5 text-sm font-black text-[#2C3930]">
                          <span className="text-[#3F4F44]/40">{currency}</span>
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full border-none focus:ring-0 outline-none p-0 bg-transparent"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3 align-top font-black text-[#2C3930] text-sm">
                        {formatCurrency(item.total || 0, currency)}
                      </td>
                      <td className="px-5 py-3 align-top">
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-300 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 p-1">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-[#DCD7C9] shadow-sm">
            <label className="block text-sm font-bold text-mate-dark mb-3 uppercase tracking-widest opacity-90">Terms & Payment Instructions</label>
            <textarea 
              rows={4} 
              className="w-full px-4 py-3 rounded-xl border-2 border-[#3F4F44]/10 focus:ring-4 focus:ring-[#A27B5C]/20 focus:border-[#A27B5C] outline-none bg-white text-sm font-bold leading-relaxed text-mate-dark"
              placeholder="Bank transfer details, payment terms, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 sticky bottom-8 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-mate-cream shadow-2xl lg:static lg:bg-transparent lg:shadow-none lg:p-0">
             <button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 bg-[#3F4F44] text-white py-4 rounded-xl font-black text-xl hover:bg-mate-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-mate-forest/20 disabled:opacity-70 active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                {isEditing ? 'Save Changes' : 'Generate & Share'}
              </button>
          </div>
        </form>

        <div className={`lg:col-span-5 sticky top-8 space-y-6 ${!showPreview ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-4xl border-2 border-[#3F4F44]/10 shadow-2xl overflow-hidden flex flex-col min-h-160">
            <div className="h-4 bg-[#3F4F44] w-full" />
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-4">
                  {settings?.logo && <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain" />}
                  <div>
                    <h4 className="text-lg font-black text-[#3F4F44] leading-tight">{settings?.businessName || 'Brand Name'}</h4>
                    <p className="text-[10px] text-[#3F4F44]/60 uppercase">{settings?.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h5 className="text-[10px] font-black text-[#A27B5C] uppercase tracking-widest">Invoice</h5>
                  <p className="text-sm font-black text-mate-dark">{invoiceNo}</p>
                </div>
              </div>
              <div className="flex-1">
                <table className="w-full">
                  <thead className="border-b-2 border-[#2C3930]/10">
                    <tr>
                      <th className="text-left py-2 text-[10px] font-black uppercase">Service</th>
                      <th className="text-right py-2 text-[10px] font-black uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCD7C9]/40">
                    {items.filter(i => i.description || i.total).map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 pr-4">
                          <p className="text-sm font-bold text-mate-dark leading-tight">{item.description || 'Untitled'}</p>
                        </td>
                        <td className="py-3 text-right font-black text-mate-dark text-sm">
                          {formatCurrency(item.total || 0, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-10 pt-6 border-t-4 border-[#3F4F44]">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-mate-dark uppercase">Grand Total Due</span>
                  <span className="text-3xl font-black text-mate-dark">{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#3F4F44] text-white/50 text-[10px] font-black text-center uppercase tracking-[0.2em]">Preview Mode</div>
          </div>
        </div>
      </div>
    </div>
  );
}