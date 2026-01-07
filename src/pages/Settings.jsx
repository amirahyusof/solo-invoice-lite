
import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Save, 
  Building2, 
  Landmark, 
  Globe, 
  CheckCircle2, 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  Loader2,
  Download,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Settings() {
  const settings = useLiveQuery(() => db.settings.get(1));
  const [success, setSuccess] = useState(false);
  /** @type {[string | undefined, Function]} */
  const [logoBase64, setLogoBase64] = useState(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (settings?.logo) {
      setLogoBase64(settings.logo);
    }
  }, [settings]);

  /**
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large. Please select a file smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(/** @type {string} */ (reader.result));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoBase64(undefined);
  };

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    /** @type {BusinessSettings} */
    const data = {
      id: 1,
      businessName: /** @type {string} */ (formData.get('businessName')),
      ssmNo: /** @type {string} */ (formData.get('ssmNo')),
      address: /** @type {string} */ (formData.get('address')),
      email: /** @type {string} */ (formData.get('email')),
      phone: /** @type {string} */ (formData.get('phone')),
      bankName: /** @type {string} */ (formData.get('bankName')),
      bankAccountName: /** @type {string} */ (formData.get('bankAccountName')),
      bankAccountNo: /** @type {string} */ (formData.get('bankAccountNo')),
      currency: /** @type {string} */ (formData.get('currency')),
      logo: logoBase64,
    };

    try {
      await db.settings.put(data);
      setSuccess(true);
      // Display pop-up as requested
      alert("Business details successfully saved and persisted locally!");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced input classes for readability
  const inputClasses = "w-full px-5 py-3 rounded-2xl border-2 border-[#3F4F44]/20 bg-gray/80 focus:ring-4 focus:ring-[#A27B5C]/10 focus:border-[#A27B5C] outline-none font-bold text-mate-dark transition-all placeholder:text-[#3F4F44]/30 shadow-sm";

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const clients = await db.clients.toArray();
      const invoices = await db.invoices.toArray();
      const receipts = await db.receipts.toArray();

      const workbook = XLSX.utils.book_new();

      // Clients Sheet
      const clientsData = clients.map(client => ({
        'Name': client.name,
        'Company': client.company || '',
        'Email': client.email || '',
        'Phone': client.phone || '',
        'Address': client.address || '',
        'Tax ID': client.taxId || '',
      }));
      const clientsSheet = XLSX.utils.json_to_sheet(clientsData);
      XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clients');

      // Invoices Sheet
      const invoicesData = invoices.map(invoice => ({
        'Invoice No': invoice.invoiceNo,
        'Client ID': invoice.clientId,
        'Client Name': clients.find(c => c.id === invoice.clientId)?.name || '',
        'Amount': invoice.total || 0,
        'Issue Date': invoice.issueDate || '',
        'Due Date': invoice.dueDate || '',
        'Status': invoice.status || 'Pending',
        'Notes': invoice.notes || '',
      }));
      const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
      XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Invoices');

      // Receipts Sheet
      const receiptsData = receipts.map(receipt => ({
        'Receipt No': receipt.receiptNo,
        'Invoice No': invoices.find(i => i.id === receipt.invoiceId)?.invoiceNo || '',
        'Amount Paid': receipt.amountPaid || 0,
        'Payment Method': receipt.paymentMethod || '',
        'Paid Date': receipt.paidDate || '',
        'Notes': receipt.notes || '',
      }));
      const receiptsSheet = XLSX.utils.json_to_sheet(receiptsData);
      XLSX.utils.book_append_sheet(workbook, receiptsSheet, 'Receipts');

      // Generate file
      XLSX.writeFile(workbook, `invoice-data-${new Date().toISOString().split('T')[0]}.xlsx`);
      alert("Data exported successfully!");
    } catch (err) {
      console.error("Failed to export data", err);
      alert("Error exporting data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    const confirmDelete = window.confirm(
      "⚠️ WARNING: This will delete ALL data including clients, invoices, and receipts. This action cannot be undone. Are you sure?"
    );
    
    if (!confirmDelete) return;

    const doubleConfirm = window.confirm(
      "This is your LAST chance. Click OK only if you're absolutely sure you want to delete everything."
    );
    
    if (!doubleConfirm) return;

    setIsDeleting(true);
    try {
      await db.clients.clear();
      await db.invoices.clear();
      await db.invoice_items.clear();
      await db.receipts.clear();
      // Reset counters to start from 0
      await db.counters.update('invoice', { value: 0 });
      await db.counters.update('receipt', { value: 0 });
      alert("All data has been deleted successfully! Invoice and Receipt numbers have been reset.");
    } catch (err) {
      console.error("Failed to delete data", err);
      alert("Error deleting data. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetCounters = async () => {
    const confirmReset = window.confirm(
      "⚠️ This will reset the invoice and receipt numbering back to 1. Are you sure?"
    );
    
    if (!confirmReset) return;

    setIsDeleting(true);
    try {
      await db.counters.update('invoice', { value: 0 });
      await db.counters.update('receipt', { value: 0 });
      alert("Invoice and Receipt numbers have been reset! The next invoice will start from INV-2026-001 and receipt from RCT-2026-001.");
    } catch (err) {
      console.error("Failed to reset counters", err);
      alert("Error resetting counters. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-mate-dark tracking-tight">Business Profile</h2>
          <p className="text-[#3F4F44] font-medium opacity-70">Control how your brand appears on documents</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={18} />
            Saved Successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identity Section */}
        <div className="bg-white rounded-3xl border border-[#DCD7C9] shadow-sm overflow-hidden">
          <div className="p-6 bg-[#DCD7C9]/20 border-b border-[#DCD7C9] flex items-center gap-3">
            <Building2 className="text-[#A27B5C]" size={24} />
            <h3 className="text-lg font-black text-mate-dark uppercase tracking-tight">Identity & Branding</h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-[#DCD7C9]/50">
              <div className="relative group">
                {logoBase64 ? (
                  <div className="relative">
                    <img 
                      src={logoBase64} 
                      alt="Company Logo" 
                      className="w-40 h-40 object-contain rounded-2xl border-2 border-[#DCD7C9] bg-white p-4 shadow-inner" 
                    />
                    <button 
                      type="button" 
                      onClick={removeLogo}
                      className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-xl hover:bg-red-600 transition-all hover:scale-110 active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-[#DCD7C9] bg-white flex flex-col items-center justify-center text-[#3F4F44] opacity-40 group-hover:bg-[#DCD7C9]/10 transition-colors">
                    <ImageIcon size={48} strokeWidth={1.5} />
                    <span className="text-[10px] font-black mt-2 uppercase tracking-widest">No Logo Uploaded</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <h4 className="text-base font-black text-mate-dark">Corporate Logo</h4>
                <p className="text-sm text-[#3F4F44] leading-relaxed font-medium">
                  This logo will be displayed prominently on your invoices and receipts. 
                </p>
                <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#A27B5C] text-white rounded-xl text-sm font-black cursor-pointer hover:bg-[#A27B5C]/90 transition-all shadow-lg shadow-[#A27B5C]/20 active:scale-95">
                  <Upload size={18} />
                  {logoBase64 ? 'Change Logo' : 'Upload Logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-[#A27B5C] uppercase tracking-widest">Registered Business Name</label>
                <input 
                  required 
                  name="businessName" 
                  defaultValue={settings?.businessName} 
                  placeholder="e.g., Sapura Solutions"
                  className={inputClasses} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-[#A27B5C] uppercase tracking-widest">SSM Number (Malaysia)</label>
                <input 
                  name="ssmNo" 
                  defaultValue={settings?.ssmNo} 
                  placeholder="e.g., 202301012345 (Optional)"
                  className={inputClasses} 
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-[#A27B5C] uppercase tracking-widest">Official Address</label>
                <textarea 
                  required 
                  name="address" 
                  rows={3}
                  defaultValue={settings?.address} 
                  placeholder="Your full business address..."
                  className={`${inputClasses} resize-none`} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-[#A27B5C] uppercase tracking-widest">Email Address</label>
                <input 
                  required 
                  type="email" 
                  name="email" 
                  defaultValue={settings?.email} 
                  placeholder="hello@yourbusiness.com"
                  className={inputClasses} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-[#A27B5C] uppercase tracking-widest">Contact Number</label>
                <input 
                  required 
                  name="phone" 
                  defaultValue={settings?.phone} 
                  placeholder="e.g., +6012-345 6789"
                  className={inputClasses} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Section */}
        <div className="bg-white rounded-3xl border border-[#DCD7C9] shadow-sm overflow-hidden">
          <div className="p-6 bg-[#DCD7C9]/20 border-b border-[#DCD7C9] flex items-center gap-3">
            <Landmark className="text-[#A27B5C]" size={24} />
            <h3 className="text-lg font-black text-mate-dark uppercase tracking-tight">Financial & Bank Details</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-[#A27B5C] uppercase tracking-widest">Bank Name</label>
              <input 
                required 
                name="bankName" 
                defaultValue={settings?.bankName} 
                placeholder="e.g., Maybank / CIMB"
                className={inputClasses} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-[#A27B5C] uppercase tracking-widest">Account Holder Name</label>
              <input 
                required 
                name="bankAccountName" 
                defaultValue={settings?.bankAccountName} 
                className={inputClasses} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-[#A27B5C] uppercase tracking-widest">Account Number</label>
              <input 
                required 
                name="bankAccountNo" 
                defaultValue={settings?.bankAccountNo} 
                className={inputClasses} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-[#A27B5C] uppercase tracking-widest">Currency</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3F4F44] opacity-40" size={20} />
                <select 
                  name="currency" 
                  defaultValue={settings?.currency || 'MYR'} 
                  className={`${inputClasses} pl-12 pr-5 appearance-none bg-white`}
                >
                  <option value="MYR">Malaysian Ringgit (MYR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="SGD">Singapore Dollar (SGD)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full bg-[#3F4F44] cursor-pointer text-white py-5 rounded-4xl font-black text-xl hover:bg-[#2C3930] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#3F4F44]/30 active:scale-[0.98] disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
          Persist Business Settings
        </button>
      </form>

      {/* Data Management Section */}
      <div className="bg-white rounded-3xl border border-[#DCD7C9] shadow-sm overflow-hidden">
        <div className="p-6 bg-[#DCD7C9]/20 border-b border-[#DCD7C9] flex items-center gap-3">
          <AlertCircle className="text-[#A27B5C]" size={24} />
          <h3 className="text-lg font-black text-mate-dark uppercase tracking-tight">Data Management</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-black text-mate-dark mb-2">Export Your Data</h4>
              <p className="text-sm text-[#3F4F44] leading-relaxed font-medium mb-4">
                Download all your clients, invoices, and receipts as an Excel file for backup or analysis purposes.
              </p>
              <button 
                type="button"
                onClick={handleExportToExcel}
                disabled={isExporting}
                className="w-full bg-[#A27B5C] cursor-pointer text-white py-4 rounded-2xl font-black text-lg hover:bg-[#8B6349] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#A27B5C]/20 active:scale-[0.98] disabled:opacity-70"
              >
                {isExporting ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                Export Data to Excel
              </button>
            </div>

            <div className="border-t border-[#DCD7C9] pt-6">
              <h4 className="text-base font-black text-mate-dark mb-2 flex items-center gap-2">
                <span className="text-orange-500">🔄</span> Reset Billing Numbers
              </h4>
              <p className="text-sm text-[#3F4F44] leading-relaxed font-medium mb-4">
                Reset the invoice and receipt numbering sequence. The next invoice will start from INV-2026-001 and receipt from RCT-2026-001. Use this when starting a new fiscal year or business cycle.
              </p>
              <button 
                type="button"
                onClick={handleResetCounters}
                disabled={isDeleting}
                className="w-full bg-orange-500 cursor-pointer text-white py-4 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-70"
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                Reset Invoice & Receipt Numbers
              </button>
            </div>

            <div className="border-t border-[#DCD7C9] pt-6">
              <h4 className="text-base font-black text-mate-dark mb-2 flex items-center gap-2">
                <span className="text-red-500">⚠️</span> Delete All Data
              </h4>
              <p className="text-sm text-[#3F4F44] leading-relaxed font-medium mb-4">
                This will permanently delete all clients, invoices, and receipts. This action cannot be undone. We recommend exporting your data first.
              </p>
              <button 
                type="button"
                onClick={handleDeleteAllData}
                disabled={isDeleting}
                className="w-full bg-red-600 cursor-pointer text-white py-4 rounded-2xl font-black text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-600/20 active:scale-[0.98] disabled:opacity-70"
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={20} />}
                Delete All Data Permanently
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}