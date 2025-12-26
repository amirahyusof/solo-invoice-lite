
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
  Loader2
} from 'lucide-react';

export default function Settings() {
  const settings = useLiveQuery(() => db.settings.get(1));
  const [success, setSuccess] = useState(false);
  /** @type {[string | undefined, Function]} */
  const [logoBase64, setLogoBase64] = useState(undefined);
  const [isSaving, setIsSaving] = useState(false);

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
  const inputClasses = "w-full px-5 py-3 rounded-2xl border-2 border-mate-forest/20 bg-white focus:ring-4 focus:ring-mate-brown/10 focus:border-mate-brown outline-none font-bold text-mate-dark transition-all placeholder:text-mate-forest/30 shadow-sm";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-mate-dark tracking-tight">Business Profile</h2>
          <p className="text-mate-forest font-medium opacity-70">Control how your brand appears on documents</p>
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
        <div className="bg-white rounded-3xl border border-mate-cream shadow-sm overflow-hidden">
          <div className="p-6 bg-mate-cream/20 border-b border-mate-cream flex items-center gap-3">
            <Building2 className="text-mate-brown" size={24} />
            <h3 className="text-lg font-black text-mate-dark uppercase tracking-tight">Identity & Branding</h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-mate-cream/50">
              <div className="relative group">
                {logoBase64 ? (
                  <div className="relative">
                    <img 
                      src={logoBase64} 
                      alt="Company Logo" 
                      className="w-40 h-40 object-contain rounded-2xl border-2 border-mate-cream bg-white p-4 shadow-inner" 
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
                  <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-mate-cream bg-white flex flex-col items-center justify-center text-mate-forest opacity-40 group-hover:bg-mate-cream/10 transition-colors">
                    <ImageIcon size={48} strokeWidth={1.5} />
                    <span className="text-[10px] font-black mt-2 uppercase tracking-widest">No Logo Uploaded</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <h4 className="text-base font-black text-mate-dark">Corporate Logo</h4>
                <p className="text-sm text-mate-forest leading-relaxed font-medium">
                  This logo will be displayed prominently on your invoices and receipts. 
                </p>
                <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-mate-brown text-white rounded-xl text-sm font-black cursor-pointer hover:bg-mate-brown/90 transition-all shadow-lg shadow-mate-brown/20 active:scale-95">
                  <Upload size={18} />
                  {logoBase64 ? 'Change Logo' : 'Upload Logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-mate-brown uppercase tracking-widest">Registered Business Name</label>
                <input 
                  required 
                  name="businessName" 
                  defaultValue={settings?.businessName} 
                  placeholder="e.g., Mirez Data Studio"
                  className={inputClasses} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-mate-brown uppercase tracking-widest">SSM Number (Malaysia)</label>
                <input 
                  name="ssmNo" 
                  defaultValue={settings?.ssmNo} 
                  placeholder="e.g., 202301012345 (Optional)"
                  className={inputClasses} 
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-mate-brown uppercase tracking-widest">Official Address</label>
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
                <label className="text-xs font-black text-mate-brown uppercase tracking-widest">Email Address</label>
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
                <label className="text-xs font-black text-mate-brown uppercase tracking-widest">Contact Number</label>
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
        <div className="bg-white rounded-3xl border border-mate-cream shadow-sm overflow-hidden">
          <div className="p-6 bg-mate-cream/20 border-b border-mate-cream flex items-center gap-3">
            <Landmark className="text-mate-brown" size={24} />
            <h3 className="text-lg font-black text-mate-dark uppercase tracking-tight">Financial & Bank Details</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-mate-brown uppercase tracking-widest">Bank Name</label>
              <input 
                required 
                name="bankName" 
                defaultValue={settings?.bankName} 
                placeholder="e.g., Maybank / CIMB"
                className={inputClasses} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-mate-brown uppercase tracking-widest">Account Holder Name</label>
              <input 
                required 
                name="bankAccountName" 
                defaultValue={settings?.bankAccountName} 
                className={inputClasses} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-mate-brown uppercase tracking-widest">Account Number</label>
              <input 
                required 
                name="bankAccountNo" 
                defaultValue={settings?.bankAccountNo} 
                className={inputClasses} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-mate-brown uppercase tracking-widest">Currency</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-mate-forest opacity-40" size={20} />
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
          className="w-full bg-[#3F4F44] text-white py-5 rounded-4xl font-black text-xl hover:bg-mate-dark transition-all flex items-center justify-center gap-3 shadow-2xl shadow-mate-forest/30 active:scale-[0.98] disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
          Persist Business Settings
        </button>
      </form>
    </div>
  );
}