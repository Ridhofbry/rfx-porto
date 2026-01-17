import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, addDoc, 
  deleteDoc, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Instagram, Youtube, Mail, ArrowRight, ChevronLeft, 
  ExternalLink, Trash2, Edit, X, Lock, Unlock, Sparkles, 
  Loader2, Camera, Play, Palette, Layout, Image as ImageIcon, Menu, Check, Save, Type, AlertCircle
} from 'lucide-react';

// --- UTILITAS ENVIRONMENT VARIABLES ---
const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    if (import.meta && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (e) {}
  return '';
};

// --- KONFIGURASI FIREBASE ---
let firebaseConfig;
try {
  const apiKey = getEnv('VITE_FIREBASE_API_KEY') || getEnv('REACT_APP_FIREBASE_API_KEY');
  if (apiKey) {
    firebaseConfig = {
      apiKey: apiKey,
      authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnv('VITE_FIREBASE_APP_ID')
    };
  } else if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  }
} catch (e) {}

const GEMINI_API_KEY = getEnv('VITE_GEMINI_API_KEY');
const finalFirebaseConfig = firebaseConfig && firebaseConfig.apiKey ? firebaseConfig : (typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {});
const app = initializeApp(finalFirebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "rfx-femmora-production";

// --- UTILITAS FIRESTORE ---
const getCollectionPath = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);
const getDocPath = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- HELPER YOUTUBE ID ---
const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// --- DATA STATIS ---
const dataKeahlian = [
  { nama: "Premiere Pro", level: 90 },
  { nama: "After Effects", level: 75 },
  { nama: "Capcut", level: 95 }, 
  { nama: "Lightroom", level: 80 }
];

const dataPengalaman = [
  { tahun: "2020", judul: "The Beginning", perusahaan: "Freelance", deskripsi: "Memulai eksplorasi visual dengan fokus pada dokumentasi acara lokal dan short movie indie di Malang." },
  { tahun: "2021-2022", judul: "Identity Formation", perusahaan: "RFX Visual", deskripsi: "Membangun gaya color grading 'moody' yang menjadi ciri khas, serta merambah ke musik video." },
  { tahun: "2023-Now", judul: "Visual Artist", perusahaan: "RFX Visual", deskripsi: "Full-time content creator dan videografer untuk berbagai brand fashion dan FnB." }
];

const kategoriKarya = ["Semua", "Video", "Foto", "Animasi"];

// --- FUNGSI GEMINI AI ---
const generateGeminiContent = async (prompt) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    if (response.status === 429) {
      return "Waduh, Rexa lagi pusing nih kebanyakan yang nanya 😵. Kuota otakku habis hari ini. Coba tanya lagi besok atau hubungi Admin manusia ya!";
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, Rexa lagi bingung mau jawab apa.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Gagal menghubungi Rexa. Cek koneksi kamu ya.";
  }
};

// --- KOMPONEN BACKGROUND DINAMIS ---
const FloatingShapes = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-red-600/5 rounded-full blur-[80px] animate-blob mix-blend-screen"></div>
    <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] bg-blue-600/5 rounded-full blur-[80px] animate-blob animation-delay-2000 mix-blend-screen"></div>
    <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] bg-zinc-600/5 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen"></div>
  </div>
);

// --- KOMPONEN UI ---
const SectionWrapper = ({ children, className = "" }) => {
  const [ref, setRef] = useState(null);
  const [terlihat, setTerlihat] = useState(false);
  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTerlihat(true);
        observer.disconnect(); 
      }
    }, { threshold: 0.15 });
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);
  return (
    <div ref={setRef} className={`${className} transition-all duration-1000 transform ${terlihat ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      {children}
    </div>
  );
};

const ItemKeahlian = ({ keahlian }) => {
  const [ref, setRef] = useState(null);
  const [terlihat, setTerlihat] = useState(false);
  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setTerlihat(true);
    }, { threshold: 0.1 });
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);
  return (
    <div ref={setRef} className="space-y-3 group relative z-10">
      <div className="flex justify-between items-end">
        <span className="text-xl font-black tracking-tighter uppercase group-hover:text-red-500 transition-colors duration-500 italic">{keahlian.nama}</span>
        <span className="text-xs font-mono text-zinc-500">{terlihat ? keahlian.level : 0}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
        <div className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-[2000ms] ease-out shadow-[0_0_15px_#dc2626]" style={{ width: terlihat ? `${keahlian.level}%` : '0%' }}></div>
      </div>
    </div>
  );
};

// --- NAVIGASI ---
const Navigasi = ({ pindahHalaman, halamanAktif, bukaModalAdmin, statusAdmin }) => {
  const [menuHpBuka, setMenuHpBuka] = useState(false);
  const tanganiMenuHp = (halaman) => {
    pindahHalaman(halaman);
    setMenuHpBuka(false);
  };
  return (
    <>
      <nav className="fixed w-full z-50 top-0 pt-6 px-4 md:px-6 pointer-events-none">
        <div className="pointer-events-auto max-w-6xl mx-auto flex justify-between items-center bg-black/60 backdrop-blur-xl border border-white/10 px-6 md:px-8 py-4 rounded-full transition-all duration-500 hover:border-red-600/30 shadow-2xl">
          <button onClick={() => pindahHalaman('beranda')} className="text-2xl md:text-3xl font-black italic tracking-tighter hover:scale-105 transition text-white group relative">
            RFX<span className="text-red-600 group-hover:animate-pulse">.</span>
          </button>
          <div className="hidden md:flex gap-10 text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
            {['beranda', 'portofolio', 'kontak'].map(item => (
              <button key={item} onClick={() => pindahHalaman(item)} className={`relative py-2 transition-all duration-300 hover:text-white ${halamanAktif === item ? 'text-red-600' : ''}`}>
                {item === 'beranda' ? 'Beranda' : item === 'portofolio' ? 'Karya' : 'Kontak'}
                {halamanAktif === item && <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-red-600 rounded-full shadow-[0_0_10px_#dc2626]"></span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => bukaModalAdmin(true)} className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${statusAdmin ? 'bg-red-600/20 border-red-600/50 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:border-white/30'}`}>
              {statusAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
            <button onClick={() => setMenuHpBuka(!menuHpBuka)} className="md:hidden w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/5 active:scale-95">
              {menuHpBuka ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
            </button>
          </div>
        </div>
      </nav>
      {menuHpBuka && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-300">
           {['beranda', 'portofolio', 'kontak'].map(item => (
              <button key={item} onClick={() => tanganiMenuHp(item)} className={`text-4xl font-black uppercase tracking-widest italic transition-all ${halamanAktif === item ? 'text-red-600 scale-110' : 'text-zinc-400 hover:text-white'}`}>
                {item === 'beranda' ? 'Beranda' : item === 'portofolio' ? 'Karya' : 'Kontak'}
              </button>
            ))}
            <button onClick={() => setMenuHpBuka(false)} className="absolute bottom-10 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-zinc-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
        </div>
      )}
    </>
  );
};

// --- HALAMAN BERANDA ---
const TampilanBeranda = ({ configSitus, pindahHalaman }) => (
  <div className="space-y-0 text-white pb-20 relative z-10">
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-0">
             <img src={configSitus.heroImage || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop"} className="w-full h-full object-cover opacity-40 scale-110 animate-[drift_30s_infinite_alternate]" alt="Hero Background" />
        </div>
        <div className="absolute inset-0 z-10 mix-blend-overlay opacity-80">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_60s_linear_infinite] opacity-50 bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#ff0000_100%)]"></div>
            <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] animate-[spin_45s_linear_infinite_reverse] opacity-30 bg-[conic-gradient(from_0deg_at_50%_50%,#00000000_50%,#0000ff_100%)]"></div>
        </div>
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
        <div className="absolute inset-0 z-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>
      <div className="relative z-30 text-center px-6 max-w-5xl mx-auto mt-20">
        <SectionWrapper>
          <div className="inline-flex items-center gap-3 px-6 py-2 border border-white/10 rounded-full bg-black/30 backdrop-blur-md mb-8 hover:bg-black/50 transition-colors shadow-2xl">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_#dc2626]"></span>
            <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-300 font-bold">Visual Artist • Malang</span>
          </div>
          <h1 className="text-6xl md:text-[120px] font-black tracking-tighter leading-[0.85] mb-10 italic drop-shadow-2xl">
            <span className="block text-zinc-500 opacity-60 relative z-0">RFX</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500 relative z-10 animate-gradient-text bg-[length:200%_auto]">VISUAL</span>
          </h1>
          <div className="flex justify-center">
            <button onClick={() => pindahHalaman('portofolio')} className="group bg-red-600 text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.25em] hover:bg-red-700 transition-all duration-300 flex items-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] active:scale-95">
              Lihat Karya <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </SectionWrapper>
      </div>
    </section>
    <section className="py-32 px-6 max-w-6xl mx-auto">
      <SectionWrapper className="grid md:grid-cols-2 gap-20 items-center">
        <div className="relative group">
          <div className="absolute inset-0 bg-red-600 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 animate-pulse"></div>
          <div className="relative rounded-[3rem] overflow-hidden border border-white/10 aspect-[3/4]">
             {/* REVISI MOBILE: Tambahkan 'active:' untuk efek di HP */}
            <img src={configSitus.aboutImage || "https://images.unsplash.com/photo-1542038784456-1ea0e93ca64b?q=80&w=1974&auto=format&fit=crop"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 active:grayscale-0 transition-all duration-[1.5s] group-hover:scale-110 active:scale-110" alt="Profile" />
          </div>
        </div>
        <div className="space-y-10 text-left">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic leading-none uppercase whitespace-pre-line">
            {configSitus.homeCaption || '"Tangkap momen,\nceritakan rasanya."'}
          </h2>
          <div className="text-zinc-400 leading-relaxed space-y-6 text-lg font-light whitespace-pre-line">
            {configSitus.homeDescription ? <p>{configSitus.homeDescription}</p> : (
               <>
                <p>Halo, saya <span className="text-white font-bold">Muhammad Ridho Febriyansyah</span>. Berkarya sejak 2020 dengan identitas <span className="text-red-500 font-bold">RFX Visual</span>.</p>
                <p>Setiap frame adalah kanvas. Saya tidak hanya merekam gambar, tapi mencoba menyusun emosi di dalamnya.</p>
               </>
            )}
          </div>
          <div className="pt-8 border-t border-white/5">
            <h3 className="text-xl font-black italic uppercase mb-6">Software</h3>
            <div className="space-y-6">
              {dataKeahlian.map((item) => <ItemKeahlian key={item.nama} keahlian={item} />)}
            </div>
          </div>
        </div>
      </SectionWrapper>
    </section>

    <section className="py-32 border-t border-white/5 bg-[#080808]/50 backdrop-blur-sm">
      <SectionWrapper className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8 text-left">
          <div className="space-y-2">
             <h3 className="text-xs font-black uppercase tracking-[0.5em] text-red-600 font-mono">My Journey</h3>
             <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">Pengalaman<span className="text-red-600">.</span></h2>
          </div>
          <p className="text-zinc-500 max-w-sm text-right md:text-left italic text-sm">"Proses tidak akan pernah mengkhianati hasil akhir."</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {dataPengalaman.map((exp, idx) => (
            <div key={idx} className="group relative p-8 md:p-10 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 hover:border-red-600/50 transition-all duration-500 hover:-translate-y-2 active:-translate-y-2 backdrop-blur-md">
              <div className="mb-8 flex justify-between items-start">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-red-600 group-active:bg-red-600 group-hover:text-white group-active:text-white transition-all duration-500 shadow-lg">
                   {idx === 0 ? <Camera className="w-5 h-5" /> : idx === 1 ? <Palette className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </div>
                <span className="text-[10px] font-black font-mono text-zinc-600 tracking-[0.2em] border border-zinc-800 px-3 py-1 rounded-full">{exp.tahun}</span>
              </div>
              <h4 className="text-xl font-black tracking-tighter mb-2 group-hover:text-red-500 group-active:text-red-500 transition-colors uppercase italic">{exp.judul}</h4>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-6">{exp.perusahaan}</p>
              <p className="text-zinc-400 leading-relaxed font-light text-sm">{exp.deskripsi}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </section>
  </div>
);

// --- HALAMAN PORTOFOLIO ---
const TampilanPortofolio = ({ daftarKarya, filter, setFilter, pindahHalaman }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-white min-h-screen relative z-10">
      <SectionWrapper className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-10 text-left">
        <div>
          <button onClick={() => pindahHalaman('beranda')} className="flex items-center gap-3 text-zinc-500 hover:text-red-600 transition-all text-[10px] uppercase tracking-[0.3em] font-black mb-6 group italic">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali
          </button>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none italic uppercase">Karya<span className="text-red-600">.</span></h2>
        </div>
        <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/80 rounded-2xl border border-white/5 backdrop-blur-xl">
          {kategoriKarya.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat === 'Semua' ? 'all' : cat.toLowerCase())} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${((filter === 'all' && cat === 'Semua') || filter === cat.toLowerCase()) ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
              {cat}
            </button>
          ))}
        </div>
      </SectionWrapper>

      {/* Grid Karya (Dengan OnClick untuk Modal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
        {daftarKarya.filter(item => filter === 'all' || item.category === filter).map((item) => (
          <SectionWrapper key={item.id}>
            <div 
                onClick={() => setSelectedItem(item)}
                className="group relative bg-zinc-950/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-red-600/50 h-full flex flex-col cursor-pointer active:scale-95 transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden bg-zinc-900 relative">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent z-10 transition-colors"></div>
                <img src={item.image} onError={(e) => e.target.src = "https://placehold.co/600x400/111/444?text=No+Image"} className="w-full h-full object-cover group-hover:scale-110 transition duration-[2s] opacity-80 group-hover:opacity-100" alt={item.title} />
              </div>
              <div className="p-8 flex flex-col flex-1 relative bg-[#0a0a0a]">
                <div className="absolute -top-6 right-8 w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-12 group-hover:rotate-0 transition-all duration-500 z-20">
                  {item.category === 'video' ? <Play className="w-5 h-5 fill-current"/> : item.category === 'photo' ? <Camera className="w-5 h-5"/> : <Layout className="w-5 h-5"/>}
                </div>
                <span className="text-[9px] font-black uppercase text-zinc-500 mb-3 block">{item.category}</span>
                <h3 className="text-2xl font-black tracking-tighter mb-4 uppercase italic text-white group-hover:text-red-500 line-clamp-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm font-light leading-relaxed line-clamp-3 mb-6">{item.description}</p>
              </div>
            </div>
          </SectionWrapper>
        ))}
      </div>
      
      {daftarKarya.length === 0 && (
          <div className="text-center py-32 border border-dashed border-white/10 rounded-[3rem] backdrop-blur-sm">
              <p className="text-zinc-600 italic">Belum ada karya yang ditampilkan.</p>
          </div>
      )}

      {/* DETAIL MODAL PORTOFOLIO */}
      {selectedItem && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
            <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header Modal */}
                <div className="absolute top-6 right-6 z-50">
                    <button onClick={() => setSelectedItem(null)} className="w-10 h-10 rounded-full bg-black/50 border border-white/20 text-white flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar">
                    {/* Media Display */}
                    <div className="w-full aspect-video bg-black relative">
                        {/* Jika ada YouTube URL dan kategori video/animasi, tampilkan embed */}
                        {selectedItem.youtubeUrl && (selectedItem.category === 'video' || selectedItem.category === 'animation') ? (
                           <iframe 
                             className="w-full h-full" 
                             src={`https://www.youtube.com/embed/${getYoutubeId(selectedItem.youtubeUrl)}?autoplay=1`} 
                             title={selectedItem.title}
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                             allowFullScreen
                           ></iframe>
                        ) : (
                           <img src={selectedItem.image} className="w-full h-full object-contain" alt={selectedItem.title} />
                        )}
                    </div>

                    {/* Content Details */}
                    <div className="p-8 md:p-12 space-y-6">
                        <div>
                             <span className="inline-block px-3 py-1 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">{selectedItem.category}</span>
                             <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-6">{selectedItem.title}</h3>
                             <div className="w-20 h-1 bg-red-600 rounded-full mb-8"></div>
                             <p className="text-zinc-300 leading-relaxed font-light text-base md:text-lg whitespace-pre-wrap">{selectedItem.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// --- HALAMAN KONTAK & AI ---
const TampilanKontak = ({ modalAiBuka, setModalAiBuka, kueriAi, setKueriAi, tanganiAi, sedangKonsultasi, responAi }) => (
  <div className="pt-40 pb-20 px-6 max-w-5xl mx-auto text-center text-white min-h-screen flex flex-col justify-center relative z-10">
    <SectionWrapper>
      <div className="inline-block px-4 py-1 border border-white/10 rounded-full bg-white/5 mb-8 backdrop-blur-sm">
        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-red-500">Open For Commission</span>
      </div>
      <h2 className="text-5xl md:text-9xl font-black tracking-tighter mb-16 italic uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-800">Mari Berkarya</h2>
      <div className="grid md:grid-cols-2 gap-6 text-left">
        <a href="mailto:ridhowork79@gmail.com" className="p-10 bg-zinc-900/50 backdrop-blur-md rounded-[3rem] border border-white/5 hover:border-red-600/50 hover:bg-zinc-900 transition-all duration-500 group relative overflow-hidden">
          <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:bg-red-600 transition-all duration-300 shadow-lg relative z-10"><Mail className="w-6 h-6" /></div>
          <p className="text-xl md:text-2xl font-black tracking-tighter italic relative z-10">ridhowork79@gmail.com</p>
        </a>
        <button onClick={() => setModalAiBuka(true)} className="p-10 bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-md rounded-[3rem] border border-white/5 hover:border-blue-500/50 transition-all duration-500 group text-left w-full relative overflow-hidden">
          <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-blue-400 mb-8 group-hover:bg-blue-600 transition-all duration-300 shadow-lg relative z-10"><Sparkles className="w-6 h-6" /></div>
          <p className="text-xl md:text-2xl font-black tracking-tighter italic relative z-10">Brainstorm Ide Visual</p>
        </button>
      </div>
    </SectionWrapper>
    {modalAiBuka && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setModalAiBuka(false)}>
        <div className="relative w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-[2.5rem] shadow-2xl p-6 md:p-10 space-y-6 max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <h3 className="text-lg font-black italic uppercase text-white">RFX Brainstorm</h3>
            <button onClick={() => setModalAiBuka(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
             {responAi ? (
                <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-6">
                  <p className="text-sm md:text-base leading-relaxed text-zinc-300 font-light whitespace-pre-wrap">{responAi}</p>
                </div>
             ) : <p className="text-zinc-600 italic text-center py-10">Tanyakan ide visual...</p>}
          </div>
          <form onSubmit={tanganiAi} className="relative pt-4 border-t border-white/5">
            <input className="w-full bg-zinc-900 border border-white/10 rounded-full px-6 py-4 text-white text-sm outline-none focus:border-blue-600" value={kueriAi} onChange={e => setKueriAi(e.target.value)} placeholder="Ide video..." disabled={sedangKonsultasi} />
            <button type="submit" disabled={sedangKonsultasi || !kueriAi} className="absolute right-2 top-[22px] w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
              {sedangKonsultasi ? <Loader2 className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    )}
  </div>
);

const PanelAdmin = ({ modalAdminBuka, setModalAdminBuka, statusAdmin, setStatusAdmin, inputKunciAdmin, setInputKunciAdmin, tanganiLoginAdmin, tabAdmin, setTabAdmin, itemBaru, setItemBaru, idEdit, setIdEdit, batalEdit, tanganiHapusKarya, mulaiEdit, daftarKarya, configSitus, setConfigSitus }) => {
  const [statusSimpan, setStatusSimpan] = useState('idle');
  const debouncedConfig = useDebounce(configSitus, 1500);
  useEffect(() => {
    if (!statusAdmin) return;
    const simpanConfig = async () => {
      try { await setDoc(getDocPath('site_config', 'home'), debouncedConfig, { merge: true }); } 
      catch (err) { setStatusSimpan('error'); }
    };
    simpanConfig();
  }, [debouncedConfig, statusAdmin]);
  const simpanConfigManual = async () => {
      setStatusSimpan('loading');
      try { await setDoc(getDocPath('site_config', 'home'), configSitus, { merge: true }); setStatusSimpan('success'); setTimeout(() => setStatusSimpan('idle'), 2000); } 
      catch (err) { setStatusSimpan('error'); setTimeout(() => setStatusSimpan('idle'), 4000); }
  };
  const handleSimpanItem = async (e) => {
    e?.preventDefault();
    if (!itemBaru.title || !itemBaru.image) return;
    setStatusSimpan('loading');
    try {
      if (idEdit) { await setDoc(getDocPath('portfolio', idEdit), itemBaru, { merge: true }); } 
      else { await addDoc(getCollectionPath('portfolio'), { ...itemBaru, createdAt: new Date().toISOString() }); }
      setItemBaru({ title: '', category: 'video', image: '', description: '', youtubeUrl: '' }); setIdEdit(null); setStatusSimpan('success'); setTimeout(() => setStatusSimpan('idle'), 2000);
    } catch (err) { setStatusSimpan('error'); setTimeout(() => setStatusSimpan('idle'), 4000); }
  };
  if (!modalAdminBuka) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-2xl">
      <div className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {statusAdmin && (
          <div className="absolute top-6 right-6 flex items-center gap-3 z-50 bg-black/50 px-4 py-2 rounded-full border border-white/10">
            {statusSimpan === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : statusSimpan === 'success' ? <Check className="w-3 h-3 text-green-500" /> : statusSimpan === 'error' ? <AlertCircle className="w-3 h-3 text-red-500" /> : null}
          </div>
        )}
        {!statusAdmin ? (
          <div className="relative p-10 text-center space-y-8 flex-1 flex flex-col justify-center items-center">
            <button onClick={() => setModalAdminBuka(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            <Lock className="w-10 h-10 text-red-600 animate-pulse" />
            <form onSubmit={tanganiLoginAdmin} className="w-full max-w-xs space-y-4">
              <input type="password" placeholder="Passkey..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center outline-none focus:border-red-600 text-white" value={inputKunciAdmin} onChange={e => setInputKunciAdmin(e.target.value)} />
              <button type="submit" className="w-full bg-red-600 py-4 rounded-2xl font-black uppercase text-xs text-white">Unlock</button>
            </form>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-black/40 p-6 flex md:flex-col gap-2">
              <button onClick={() => setTabAdmin('portofolio')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black ${tabAdmin === 'portofolio' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white bg-white/5'}`}><ImageIcon className="w-4 h-4"/> Karya</button>
              <button onClick={() => setTabAdmin('config')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black ${tabAdmin === 'config' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white bg-white/5'}`}><Layout className="w-4 h-4"/> Tampilan</button>
              <div className="md:mt-auto flex gap-2">
                  <button onClick={() => setStatusAdmin(false)} className="flex-1 py-3 rounded-xl text-[10px] font-black text-red-500 border border-red-900/20">Lock</button>
                  <button onClick={() => setModalAdminBuka(false)} className="flex-1 py-3 rounded-xl text-[10px] font-black text-zinc-500 border border-white/5">Close</button>
              </div>
            </div>
            <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar bg-[#050505]">
              {tabAdmin === 'portofolio' ? (
                <div className="flex flex-col xl:flex-row gap-10">
                  <div className="flex-1 space-y-8">
                    <form onSubmit={handleSimpanItem} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Judul Karya</label>
                        <input type="text" placeholder="Judul" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white" value={itemBaru.title} onChange={e => setItemBaru({...itemBaru, title: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-zinc-600">Kategori</label>
                            <select className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-red-600 text-xs font-bold uppercase" value={itemBaru.category} onChange={e => setItemBaru({...itemBaru, category: e.target.value})}>
                              <option value="video">Video</option><option value="photo">Foto</option><option value="animation">Animasi</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase text-zinc-600">Link Gambar (Thumbnail)</label>
                             <input type="url" placeholder="https://..." required className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white" value={itemBaru.image} onChange={e => setItemBaru({...itemBaru, image: e.target.value})} />
                        </div>
                      </div>

                      {/* --- UPDATE: INPUT LINK YOUTUBE KHUSUS VIDEO/ANIMASI --- */}
                      {(itemBaru.category === 'video' || itemBaru.category === 'animation') && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                             <label className="text-[10px] font-bold uppercase text-red-500">Link Youtube (Opsional)</label>
                             <input type="url" placeholder="https://youtube.com/watch?v=..." className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white" value={itemBaru.youtubeUrl || ''} onChange={e => setItemBaru({...itemBaru, youtubeUrl: e.target.value})} />
                             <p className="text-[9px] text-zinc-600">Jika diisi, video akan diputar saat detail dibuka.</p>
                          </div>
                      )}

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase text-zinc-600">Deskripsi</label>
                         <textarea placeholder="Deskripsi" rows="4" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none" value={itemBaru.description} onChange={e => setItemBaru({...itemBaru, description: e.target.value})} />
                      </div>
                      <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all"> {idEdit ? 'Simpan Perubahan' : 'Publikasikan'}</button>
                      {idEdit && <button onClick={batalEdit} type="button" className="w-full text-zinc-500 text-[10px] uppercase mt-2">Batal Edit</button>}
                    </form>
                  </div>
                  <div className="flex-1 space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {daftarKarya.map(item => (
                      <div key={item.id} className={`flex items-center gap-4 p-3 bg-zinc-900/50 rounded-2xl border ${idEdit === item.id ? 'border-red-600' : 'border-white/5'}`}>
                        <img src={item.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <div className="flex-1 truncate text-xs font-bold text-white uppercase">{item.title}</div>
                        <div className="flex gap-1">
                            <button onClick={() => mulaiEdit(item)} className="p-2 text-zinc-500 hover:text-white"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => tanganiHapusKarya(item.id)} className="p-2 text-zinc-500 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-10">
                  <div className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5 space-y-6">
                      <textarea className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white" rows="2" placeholder="Caption Utama" value={configSitus.homeCaption || ''} onChange={e => setConfigSitus({...configSitus, homeCaption: e.target.value})} />
                      <textarea className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white" rows="4" placeholder="Deskripsi Home" value={configSitus.homeDescription || ''} onChange={e => setConfigSitus({...configSitus, homeDescription: e.target.value})} />
                      <input type="url" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-5 py-2 text-white" placeholder="Hero Image URL" value={configSitus.heroImage} onChange={e => setConfigSitus({...configSitus, heroImage: e.target.value})} />
                      <input type="url" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-5 py-2 text-white" placeholder="About Image URL" value={configSitus.aboutImage} onChange={e => setConfigSitus({...configSitus, aboutImage: e.target.value})} />
                      <button onClick={simpanConfigManual} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all">Simpan Tampilan</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [halamanAktif, setHalamanAktif] = useState('beranda');
  const [filter, setFilter] = useState('all');
  const [sedangTransisi, setSedangTransisi] = useState(false);
  const [modalAdminBuka, setModalAdminBuka] = useState(false);
  const [statusAdmin, setStatusAdmin] = useState(false);
  const [inputKunciAdmin, setInputKunciAdmin] = useState('');
  const [pengguna, setPengguna] = useState(null);
  const [modalAiBuka, setModalAiBuka] = useState(false);
  const [kueriAi, setKueriAi] = useState('');
  const [responAi, setResponAi] = useState('');
  const [sedangKonsultasi, setSedangKonsultasi] = useState(false);
  const [daftarKarya, setDaftarKarya] = useState([]);
  const [configSitus, setConfigSitus] = useState({ heroImage: '', aboutImage: '', homeCaption: '', homeDescription: '' });
  const [tabAdmin, setTabAdmin] = useState('portofolio');
  const [itemBaru, setItemBaru] = useState({ title: '', category: 'video', image: '', description: '' });
  const [idEdit, setIdEdit] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } 
        else { await signInAnonymously(auth); }
      } catch (error) {}
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => setPengguna(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!pengguna) return;
    const unsubPorto = onSnapshot(getCollectionPath('portfolio'), (snap) => setDaftarKarya(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubConfig = onSnapshot(getDocPath('site_config', 'home'), (snap) => { if (snap.exists()) setConfigSitus(prev => ({...prev, ...snap.data()})); });
    return () => { unsubPorto(); unsubConfig(); };
  }, [pengguna]);

  const pindahHalaman = (h) => {
    if (h === halamanAktif) return;
    setSedangTransisi(true);
    setTimeout(() => { setHalamanAktif(h); window.scrollTo(0, 0); setSedangTransisi(false); }, 400);
  };
  const tanganiLoginAdmin = (e) => {
    e.preventDefault();
    if (inputKunciAdmin === "20810004") { setStatusAdmin(true); setInputKunciAdmin(''); } 
    else { setInputKunciAdmin(''); }
  };
  const tanganiHapusKarya = async (id) => {
    if (!pengguna || !statusAdmin) return;
    try { await deleteDoc(getDocPath('portfolio', id)); } catch (err) {}
  };
  const mulaiEdit = (item) => { setItemBaru({ title: item.title, category: item.category, image: item.image, description: item.description, youtubeUrl: item.youtubeUrl || '' }); setIdEdit(item.id); };
  const batalEdit = () => { setItemBaru({ title: '', category: 'video', image: '', description: '' }); setIdEdit(null); };
  const tanganiAi = async (e) => {
    e.preventDefault();
    if (!kueriAi.trim()) return;
    setSedangKonsultasi(true); setResponAi(""); 
    const j = await generateGeminiContent(`Jawab singkat: ${kueriAi}`);
    setResponAi(j); setSedangKonsultasi(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans tracking-tight overflow-x-hidden relative custom-scrollbar">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        @keyframes drift { 0% { transform: scale(1.1); } 100% { transform: scale(1.2) translate(-2%, -2%); } }
        .animate-blob { animation: blob 10s infinite; }
      `}</style>
      <FloatingShapes />
      <Navigasi pindahHalaman={pindahHalaman} halamanAktif={halamanAktif} bukaModalAdmin={setModalAdminBuka} statusAdmin={statusAdmin} />
      <main className={`transition-all duration-500 transform ${sedangTransisi ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100'}`}>
        {halamanAktif === 'beranda' && <TampilanBeranda configSitus={configSitus} pindahHalaman={pindahHalaman} />}
        {halamanAktif === 'portofolio' && <TampilanPortofolio daftarKarya={daftarKarya} filter={filter} setFilter={setFilter} pindahHalaman={pindahHalaman} />}
        {halamanAktif === 'kontak' && <TampilanKontak modalAiBuka={modalAiBuka} setModalAiBuka={setModalAiBuka} kueriAi={kueriAi} setKueriAi={setKueriAi} tanganiAi={tanganiAi} sedangKonsultasi={sedangKonsultasi} responAi={responAi} />}
      </main>
      <PanelAdmin modalAdminBuka={modalAdminBuka} setModalAdminBuka={setModalAdminBuka} statusAdmin={statusAdmin} setStatusAdmin={setStatusAdmin} inputKunciAdmin={inputKunciAdmin} setInputKunciAdmin={setInputKunciAdmin} tanganiLoginAdmin={tanganiLoginAdmin} tabAdmin={tabAdmin} setTabAdmin={setTabAdmin} itemBaru={itemBaru} setItemBaru={setItemBaru} idEdit={idEdit} setIdEdit={setIdEdit} batalEdit={batalEdit} tanganiHapusKarya={tanganiHapusKarya} mulaiEdit={mulaiEdit} daftarKarya={daftarKarya} configSitus={configSitus} setConfigSitus={setConfigSitus} />
      <footer className="py-20 border-t border-white/5 text-center bg-black/50 relative z-10">
        <SectionWrapper>
          <div className="text-2xl font-black italic mb-6 opacity-30">RFX<span className="text-red-600">.</span></div>
          <p className="text-[9px] text-zinc-700 uppercase tracking-[0.5em] font-black italic">&copy; 2026 RFX VISUAL</p>
        </SectionWrapper>
      </footer>
    </div>
  );
};

export default App;
