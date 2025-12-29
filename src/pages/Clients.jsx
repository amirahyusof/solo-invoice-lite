
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
// Fix: Added missing Users icon to the import list
import { Plus, Search, User, Mail, Phone, MapPin, Edit2, Trash2, X, Users } from 'lucide-react';

export default function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  /** @type {[Client | null, Function]} */
  const [editingClient, setEditingClient] = useState(null);

  const clients = useLiveQuery(() => 
    db.clients
      .filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      )
      .toArray(), 
    [searchTerm]
  );

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    /** @type {Client} */
    const data = {
      name: /** @type {string} */ (formData.get('name')),
      company: /** @type {string} */ (formData.get('company')),
      email: /** @type {string} */ (formData.get('email')),
      phone: /** @type {string} */ (formData.get('phone')),
      address: /** @type {string} */ (formData.get('address')),
    };

    if (editingClient?.id) {
      await db.clients.update(editingClient.id, data);
    } else {
      await db.clients.add(data);
    }

    setIsModalOpen(false);
    setEditingClient(null);
  };

  /**
   * @param {number} id
   */
  const deleteClient = async (id) => {
    if (confirm('Are you sure you want to delete this client?')) {
      await db.clients.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-mate-dark">Clients</h2>
          <p className="text-[#3F4F44] opacity-80">Manage your business contacts</p>
        </div>
        <button 
          onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
          className="bg-[#A27B5C] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#A27B5C]/90 transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Plus size={20} />
          Add Client
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F4F44] opacity-50" size={20} />
        <input 
          type="text" 
          placeholder="Search clients..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-mate-cream bg-white focus:outline-none focus:ring-2 focus:ring-mate-brown/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients?.map(client => (
          <div key={client.id} className="bg-white p-6 rounded-xl border border-[#DCD7C9] shadow-sm hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-[#3F4F44]/10 rounded-full flex items-center justify-center text-[#3F4F44]">
                <User size={24} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                  className="p-2 text-[#3F4F44] hover:bg-[#DCD7C9] rounded-lg cursor-pointer"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => client.id && deleteClient(client.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-mate-dark">{client.name}</h3>
            {client.company && <p className="text-sm text-[#A27B5C] font-medium mb-4">{client.company}</p>}
            
            <div className="space-y-2 mt-4 text-sm text-[#3F4F44]">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-1 shrink-0" />
                  <span className="line-clamp-2">{client.address}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {clients?.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="bg-white/50 inline-block p-10 rounded-full mb-4">
              {/* Fix: Using the correct name for the Users icon */}
              <Users size={64} className="text-[#3F4F44] opacity-20 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-[#2C3930]">No clients found</h3>
            <p className="text-[#3F4F44] opacity-60">Add some clients to start invoicing!</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#DCD7C9] flex justify-between items-center bg-[#3F4F44] text-white">
              <h3 className="text-xl font-bold">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform cursor-pointer">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#2C3930] mb-1">Full Name *</label>
                <input required name="name" defaultValue={editingClient?.name} className="w-full px-4 py-2 rounded-lg border border-[#DCD7C9] focus:ring-2 focus:ring-[#A27B5C] outline-none" placeholder="Safura" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C3930] mb-1">Company (Optional)</label>
                <input name="company" defaultValue={editingClient?.company} className="w-full px-4 py-2 rounded-lg border border-[#DCD7C9] focus:ring-2 focus:ring-[#A27B5C] outline-none" placeholder="XYZ Company" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C3930] mb-1">Email Address</label>
                <input name="email" type="email" defaultValue={editingClient?.email} className="w-full px-4 py-2 rounded-lg border border-[#DCD7C9] focus:ring-2 focus:ring-[#A27B5C] outline-none" placeholder="safura@example.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C3930] mb-1">Phone Number</label>
                <input name="phone" defaultValue={editingClient?.phone} className="w-full px-4 py-2 rounded-lg border border-[#DCD7C9] focus:ring-2 focus:ring-[#A27B5C] outline-none" placeholder="+60123456789" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C3930] mb-1">Address</label>
                <textarea name="address" rows={3} defaultValue={editingClient?.address} className="w-full px-4 py-2 rounded-lg border border-[#DCD7C9] focus:ring-2 focus:ring-[#A27B5C] outline-none" placeholder="Address line..." />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-[#DCD7C9] rounded-lg font-bold text-[#2C3930] hover:bg-[#DCD7C9]/50 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#3F4F44] text-white rounded-lg font-bold hover:bg-[#2C3930] transition-colors cursor-pointer">
                  {editingClient ? 'Update' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}