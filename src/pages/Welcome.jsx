
import React from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  FileText, 
  ShieldCheck, 
  WifiOff, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  Settings as SettingsIcon
} from 'lucide-react';

/**
 * @param {Object} props
 * @param {any} props.icon
 * @param {string} props.title
 * @param {string} props.description
 */
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white/50 backdrop-blur-sm p-8 rounded-[2.5rem] border border-[#DCD7C9] shadow-sm hover:shadow-xl hover:bg-white transition-all group">
    <div className="w-14 h-14 bg-[#3F4F44] text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-black text-[#2C3930] mb-3 uppercase tracking-tight">{title}</h3>
    <p className="text-[#3F4F44]/70 font-medium leading-relaxed">{description}</p>
  </div>
);

export default function Welcome() {
  const settings = useLiveQuery(() => db.settings.get(1));
  const hasSettings = !!settings?.businessName;

  return (
    <div className="min-h-screen bg-[#DCD7C9] selection:bg-[#A27B5C] selection:text-white overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-125 h-125 bg-[#A27B5C]/10 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-100 h-100 bg-[#3F4F44]/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10">
        {/* Navbar-ish Logo */}
        <div className="flex items-center gap-3 mb-24 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-12 h-12 bg-[#3F4F44] text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-[#3F4F44]/20">
            SI
          </div>
          <span className="text-2xl font-black text-mate-dark tracking-tighter">Solo Invoice</span>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#A27B5C]/10 text-[#A27B5C] rounded-full text-xs font-black uppercase tracking-[0.2em]">
              <Sparkles size={14} /> Built for Solo Freelancers
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-mate-dark leading-[1.1] tracking-tighter">
              Professional Billing, <span className="text-[#3F4F44] italic">Simplified.</span>
            </h1>
            <p className="text-xl text-[#3F4F44]/80 font-medium max-w-lg leading-relaxed">
              Cipta invois dan resit profesional dalam beberapa saat. Tanpa akaun, tanpa yuran bulanan, dan berfungsi 100% luar talian.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link 
                to="/dashboard" 
                className="w-full sm:w-auto flex items-center justify-center gap-3 p-5 bg-[#3F4F44] text-white rounded-4xl font-black hover:bg-[#2C3930] transition-all shadow-2xl shadow-[#3F4F44]/30 active:scale-95 group"
              >
                Pergi ke Dashboard
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
              {!hasSettings && (
                <Link 
                  to="/settings" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 p-4 bg-white border-2 border-[#3F4F44]/10 text-[#3F4F44] rounded-4xl font-black hover:bg-[#DCD7C9]/30 transition-all active:scale-95"
                >
                  <SettingsIcon size={20} />
                  Sediakan Profil Perniagaan
                </Link>
              )}
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            <div className="bg-white p-6 rounded-[3rem] border-4 border-white shadow-2xl rotate-3 relative z-10">
              <div className="bg-[#DCD7C9]/20 rounded-4xl p-8 aspect-4/5 flex flex-col">
                <div className="flex justify-between mb-12">
                  <div className="w-16 h-4 bg-[#3F4F44]/20 rounded-full" />
                  <div className="w-8 h-8 bg-[#A27B5C]/20 rounded-lg" />
                </div>
                <div className="space-y-4 mb-12">
                  <div className="w-full h-8 bg-[#2C3930]/10 rounded-xl" />
                  <div className="w-3/4 h-8 bg-[#2C3930]/5 rounded-xl" />
                </div>
                <div className="mt-auto pt-6 border-t border-[#DCD7C9] flex justify-between items-center">
                  <div className="w-20 h-4 bg-[#3F4F44]/20 rounded-full" />
                  <div className="w-12 h-12 bg-[#3F4F44] rounded-xl" />
                </div>
              </div>
            </div>
            {/* Background elements for visual weight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#A27B5C]/5 rounded-full blur-[80px]" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#A27B5C] rounded-3xl -rotate-12 animate-bounce-slow" />
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <FeatureCard 
            icon={ShieldCheck}
            title="Private by Default"
            description="Data anda tidak pernah meninggalkan peranti anda. Segala-galanya disimpan secara tempatan dalam penyemak imbas anda untuk privasi maksimum."
          />
          <FeatureCard 
            icon={WifiOff}
            title="Berfungsi di Mana-mana"
            description="Tiada internet? Tiada masalah. InvoiceMate adalah luar talian terlebih dahulu, jadi anda boleh mengebil pelanggan anda di mana-mana, bila-bila."
          />
          <FeatureCard 
            icon={FileText}
            title="PDF Profesional"
            description="Hasilkan invois dan resit berkualiti tinggi yang diformat mengikut piawaian perniagaan Malaysia."
          />
        </div>

        {/* Call to Action Footer */}
        <div className="bg-[#2C3930] text-white p-12 md:p-20 rounded-[3rem] text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[#3F4F44]/10" />
          <h2 className="text-4xl md:text-5xl font-black relative z-10 leading-tight">
            Sedia untuk menyelaraskan pengebilan <br className="hidden md:block" /> perniagaan anda?
          </h2>
          <div className="relative z-10 pt-4">
            <Link 
              to="/invoices/new" 
              className="inline-flex items-center gap-3 p-6 bg-[#A27B5C] text-white rounded-[2.5rem] font-black text-lg hover:bg-[#A27B5C]/90 transition-all shadow-xl active:scale-95"
            >
              Cipta Invois Pertama Saya <ChevronRight />
            </Link>
          </div>
        </div>
      </div>

      <footer className="max-w-7xl mx-auto px-6 pb-12 text-center">
        <p className="text-[#3F4F44]/40 font-bold text-sm uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Solo Invoice • Mirez Data Studio
        </p>
      </footer>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(-20px) rotate(-12deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}