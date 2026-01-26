import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient'; // Import koneksi Supabase
import {
  Instagram, Youtube, Mail, ArrowRight, ChevronLeft,
  ExternalLink, Trash2, Edit, X, Lock, Unlock, Sparkles,
  Loader2, Camera, Play, Palette, Layout, Image as ImageIcon, Menu, Check, AlertCircle
} from 'lucide-react';

// --- KONFIGURASI API ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- DATA STATIS (FALLBACK) ---
const defaultSkills = [
  { id: 1, title: "Premiere Pro", level: 90, category: "software" },
  { id: 2, title: "After Effects", level: 75, category: "software" },
  { id: 3, title: "Capcut", level: 95, category: "software" },
  { id: 4, title: "Lightroom", level: 80, category: "software" }
];

const defaultExperiences = [
  { id: 1, year: "2020", title: "The Beginning", company: "Freelance", description: "Memulai eksplorasi visual dengan fokus pada dokumentasi acara lokal dan short movie indie di Malang.", icon: "Camera" },
  { id: 2, year: "2021-2022", title: "Identity Formation", company: "RFX Visual", description: "Membangun gaya color grading 'moody' yang menjadi ciri khas, serta merambah ke musik video.", icon: "Palette" },
  { id: 3, year: "2023-Now", title: "Visual Artist", company: "RFX Visual", description: "Full-time content creator dan videografer untuk berbagai brand fashion dan FnB.", icon: "Play" }
];

const kategoriKarya = ["Semua", "Video", "Foto", "Animasi"];

// --- FUNGSI GEMINI AI ---
const generateGeminiContent = async (prompt) => {
  if (!GEMINI_API_KEY) return "API Key Gemini belum diatur.";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    if (response.status === 429) return "Waduh, Rexa lagi pusing nih (Limit Reached). Coba besok ya!";
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, Rexa lagi bingung mau jawab apa.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Gagal menghubungi Rexa. Cek koneksi kamu ya.";
  }
};

// --- HELPER YOUTUBE ID ---
const getYoutubeId = (url) => {
  if (!url) return null;
  // Support format kustom: https://youtube/ID
  if (url.includes('youtube/') && !url.includes('watch?')) {
    const parts = url.split('youtube/');
    return parts[1] ? parts[1].split('?')[0] : null;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const convertImageLink = (url) => {
  if (!url) return url;

  // 1. Cek Google Drive
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }

  // 2. Cek YouTube (Auto-Thumbnail)
  const ytId = getYoutubeId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
  }

  return url;
};

const convertToCustomYoutube = (url) => {
  if (!url) return '';
  // Jika sudah format kustom, biarkan
  if (url.includes('https://youtube/') && !url.includes('watch?')) return url;
  const id = getYoutubeId(url);
  return id ? `https://youtube/${id}` : url;
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
        <span className="text-xl font-black tracking-tighter uppercase group-hover:text-red-500 transition-colors duration-500 italic">{keahlian.title}</span>
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
          <div className="flex items-center gap-10">
            <div className="hidden md:flex gap-10 text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
              {['beranda', 'portofolio', 'kontak'].map(item => (
                <button key={item} onClick={() => pindahHalaman(item)} className={`relative py-2 transition-all duration-300 hover:text-white ${halamanAktif === item ? 'text-red-600' : ''}`}>
                  {item === 'beranda' ? 'Beranda' : item === 'portofolio' ? 'Karya' : 'Kontak'}
                  {halamanAktif === item && <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-red-600 rounded-full shadow-[0_0_10px_#dc2626]"></span>}
                </button>
              ))}
            </div>
            <button onClick={() => setMenuHpBuka(!menuHpBuka)} className="md:hidden w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/5 active:scale-95">
              {menuHpBuka ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
const TampilanBeranda = ({ configSitus, pindahHalaman, skills, experiences }) => (
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
            <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-300 font-bold">{configSitus.heroTagline || "Visual Artist • Malang"}</span>
          </div>
          <h1 className="text-6xl md:text-[120px] font-black tracking-tighter leading-[0.85] mb-10 italic drop-shadow-2xl">
            <span className="block text-zinc-500 opacity-60 relative z-0">{configSitus.heroTitle1 || "RFX"}</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500 relative z-10 animate-gradient-text bg-[length:200%_auto]">{configSitus.heroTitle2 || "VISUAL"}</span>
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
            <img src={configSitus.aboutImage || "https://cdn.discordapp.com/attachments/1425254107983384690/1461981878667182140/DSC08146_1.jpg?ex=696e827a&is=696d30fa&hm=8024f07f570228c065821fcde222e7f60310f3fd755d30869ae48bb3d482d2db&"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 active:grayscale-0 transition-all duration-[1.5s] group-hover:scale-110 active:scale-110" alt="Profile" />
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
              {skills.map((item) => <ItemKeahlian key={item.id} keahlian={item} />)}
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
          <p className="text-zinc-500 max-w-sm text-right md:text-left italic text-sm">"{configSitus.aboutQuote || 'Proses tidak akan pernah mengkhianati hasil akhir.'}"</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {experiences.map((exp) => (
            <div key={exp.id} className="group relative p-8 md:p-10 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 hover:border-red-600/50 transition-all duration-500 hover:-translate-y-2 active:-translate-y-2 backdrop-blur-md">
              <div className="mb-8 flex justify-between items-start">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-red-600 group-active:bg-red-600 group-hover:text-white group-active:text-white transition-all duration-500 shadow-lg">
                  {exp.icon === 'Camera' && <Camera className="w-5 h-5" />}
                  {exp.icon === 'Palette' && <Palette className="w-5 h-5" />}
                  {exp.icon === 'Play' && <Play className="w-5 h-5" />}
                  {!['Camera', 'Palette', 'Play'].includes(exp.icon) && <Sparkles className="w-5 h-5" />}
                </div>
                <span className="text-[10px] font-black font-mono text-zinc-600 tracking-[0.2em] border border-zinc-800 px-3 py-1 rounded-full">{exp.year}</span>
              </div>
              <h4 className="text-xl font-black tracking-tighter mb-2 group-hover:text-red-500 group-active:text-red-500 transition-colors uppercase italic">{exp.title}</h4>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-6">{exp.company}</p>
              <p className="text-zinc-400 leading-relaxed font-light text-sm">{exp.description}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </section>
  </div>
);

// --- HALAMAN PORTOFOLIO ---
const TampilanPortofolio = ({ daftarKarya, filter, setFilter, pindahHalaman, configSitus }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-white min-h-screen relative z-10">
      <SectionWrapper className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-10 text-left">
        <div>
          <button onClick={() => pindahHalaman('beranda')} className="flex items-center gap-3 text-zinc-500 hover:text-red-600 transition-all text-[10px] uppercase tracking-[0.3em] font-black mb-6 group italic">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali
          </button>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none italic uppercase">{configSitus.portfolioTitle || 'Karya'}<span className="text-red-600">.</span></h2>
        </div>
        <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/80 rounded-2xl border border-white/5 backdrop-blur-xl">
          {kategoriKarya.map((cat) => {
            let filterValue = 'all';
            if (cat === 'Video') filterValue = 'video';
            else if (cat === 'Foto') filterValue = 'photo';
            else if (cat === 'Animasi') filterValue = 'animation';
            const isActive = filter === filterValue;
            return (
              <button key={cat} onClick={() => setFilter(filterValue)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                {cat}
              </button>
            );
          })}
        </div>
      </SectionWrapper>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
        {daftarKarya.filter(item => filter === 'all' || item.category === filter).map((item) => (
          <SectionWrapper key={item.id}>
            <div onClick={() => setSelectedItem(item)} className="group relative bg-zinc-950/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-red-600/50 h-full flex flex-col cursor-pointer active:scale-95 transition-all duration-300">
              <div className="aspect-[4/3] overflow-hidden bg-zinc-900 relative">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent z-10 transition-colors"></div>
                <img src={item.image} onError={(e) => e.target.src = "https://placehold.co/600x400/111/444?text=No+Image"} className="w-full h-full object-cover group-hover:scale-110 transition duration-[2s] opacity-80 group-hover:opacity-100" alt={item.title} />
              </div>
              <div className="p-8 flex flex-col flex-1 relative bg-[#0a0a0a]">
                <div className="absolute -top-6 right-8 w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-12 group-hover:rotate-0 transition-all duration-500 z-20">
                  {item.category === 'video' ? <Play className="w-5 h-5 fill-current" /> : item.category === 'photo' ? <Camera className="w-5 h-5" /> : <Layout className="w-5 h-5" />}
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

      {selectedItem && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
          <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="absolute top-6 right-6 z-50">
              <button onClick={() => setSelectedItem(null)} className="w-10 h-10 rounded-full bg-black/50 border border-white/20 text-white flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar">
              <div className="w-full aspect-video bg-black relative">
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
const TampilanKontak = ({ modalAiBuka, setModalAiBuka, kueriAi, setKueriAi, tanganiAi, sedangKonsultasi, responAi, configSitus }) => (
  <div className="pt-40 pb-20 px-6 max-w-5xl mx-auto text-center text-white min-h-screen flex flex-col justify-center relative z-10">
    <SectionWrapper>
      <div className="inline-block px-4 py-1 border border-white/10 rounded-full bg-white/5 mb-8 backdrop-blur-sm">
        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-red-500">{configSitus.contactStatus || 'Open For Commission'}</span>
      </div>
      <h2 className="text-5xl md:text-9xl font-black tracking-tighter mb-16 italic uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-800">{configSitus.contactTitle || 'Mari Berkarya'}</h2>
      <div className="grid md:grid-cols-2 gap-6 text-left">
        <a href={`mailto:${configSitus.email || 'ridhowork79@gmail.com'}`} className="p-10 bg-zinc-900/50 backdrop-blur-md rounded-[3rem] border border-white/5 hover:border-red-600/50 hover:bg-zinc-900 transition-all duration-500 group relative overflow-hidden">
          <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:bg-red-600 transition-all duration-300 shadow-lg relative z-10"><Mail className="w-6 h-6" /></div>
          <p className="text-xl md:text-2xl font-black tracking-tighter italic relative z-10">{configSitus.email || 'ridhowork79@gmail.com'}</p>
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

// --- ADMIN PANEL (SUPABASE VERSION) ---
const PanelAdmin = ({
  modalAdminBuka, setModalAdminBuka, statusAdmin, setStatusAdmin,
  inputKunciAdmin, setInputKunciAdmin, tanganiLoginAdmin,
  tabAdmin, setTabAdmin, itemBaru, setItemBaru,
  idEdit, setIdEdit, batalEdit,
  tanganiHapusKarya, handleSimpanItem,
  daftarKarya, configSitus, setConfigSitus, handleSimpanConfig,
  // New Props
  skills, setSkills, experiences, setExperiences,
  handleSimpanSkill, tanganiHapusSkill,
  handleSimpanExperience, tanganiHapusExperience
}) => {

  // Local state for forms
  const [skillBaru, setSkillBaru] = useState({ title: '', level: 50, category: 'software' });
  const [expBaru, setExpBaru] = useState({ year: '', title: '', company: '', description: '', icon: 'Camera' });

  // Reset form helper
  const resetForms = () => {
    setSkillBaru({ title: '', level: 50, category: 'software' });
    setExpBaru({ year: '', title: '', company: '', description: '', icon: 'Camera' });
    setIdEdit(null);
  };

  if (!modalAdminBuka) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-2xl">
      <div className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[85vh]">
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
              <button onClick={() => { setTabAdmin('portofolio'); resetForms(); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black ${tabAdmin === 'portofolio' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white bg-white/5'}`}><ImageIcon className="w-4 h-4" /> Karya</button>
              <button onClick={() => { setTabAdmin('skills'); resetForms(); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black ${tabAdmin === 'skills' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white bg-white/5'}`}><Sparkles className="w-4 h-4" /> Skills</button>
              <button onClick={() => { setTabAdmin('journey'); resetForms(); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black ${tabAdmin === 'journey' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white bg-white/5'}`}><Play className="w-4 h-4" /> Journey</button>
              <button onClick={() => { setTabAdmin('config'); resetForms(); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black ${tabAdmin === 'config' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white bg-white/5'}`}><Layout className="w-4 h-4" /> Tampilan</button>
              <div className="md:mt-auto flex gap-2">
                <button onClick={() => setStatusAdmin(false)} className="flex-1 py-3 rounded-xl text-[10px] font-black text-red-500 border border-red-900/20">Lock</button>
                <button onClick={() => setModalAdminBuka(false)} className="flex-1 py-3 rounded-xl text-[10px] font-black text-zinc-500 border border-white/5">Close</button>
              </div>
            </div>
            <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar bg-[#050505]">
              {tabAdmin === 'portofolio' && (
                <div className="flex flex-col xl:flex-row gap-10">
                  <div className="flex-1 space-y-8">
                    <form onSubmit={handleSimpanItem} className="space-y-5">
                      <h4 className="text-white font-bold uppercase tracking-widest text-xs">Tambah/Edit Karya</h4>
                      <input type="text" placeholder="Judul" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={itemBaru.title} onChange={e => setItemBaru({ ...itemBaru, title: e.target.value })} />
                      <div className="grid grid-cols-2 gap-4">
                        <select className="bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={itemBaru.category} onChange={e => setItemBaru({ ...itemBaru, category: e.target.value })}><option value="video">Video</option><option value="photo">Foto</option><option value="animation">Animasi</option></select>
                        <input type="url" placeholder="Thumbnail URL" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={itemBaru.image} onChange={e => setItemBaru({ ...itemBaru, image: e.target.value })} onBlur={e => setItemBaru({ ...itemBaru, image: convertImageLink(e.target.value) })} />
                      </div>
                      {(itemBaru.category === 'video' || itemBaru.category === 'animation') && (
                        <input type="url" placeholder="Youtube URL" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={itemBaru.youtubeUrl || ''} onChange={e => setItemBaru({ ...itemBaru, youtubeUrl: e.target.value })} onBlur={e => setItemBaru({ ...itemBaru, youtubeUrl: convertToCustomYoutube(e.target.value) })} />
                      )}
                      <textarea placeholder="Deskripsi" rows="3" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={itemBaru.description} onChange={e => setItemBaru({ ...itemBaru, description: e.target.value })} />
                      <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all"> {idEdit ? 'Simpan Perubahan' : 'Publikasikan'}</button>
                      {idEdit && <button onClick={() => { batalEdit(); resetForms(); }} type="button" className="w-full text-zinc-500 text-[10px] uppercase mt-2">Batal Edit</button>}
                    </form>
                  </div>
                  <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {daftarKarya.map(item => (
                      <div key={item.id} className={`flex items-center gap-4 p-3 bg-zinc-900/50 rounded-2xl border ${idEdit === item.id ? 'border-red-600' : 'border-white/5'}`}>
                        <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <div className="flex-1 truncate text-xs font-bold text-white uppercase">{item.title}</div>
                        <div className="flex gap-1">
                          <button onClick={() => { setItemBaru(item); setIdEdit(item.id); }} className="p-2 text-zinc-500 hover:text-white"><Edit className="w-3 h-3" /></button>
                          <button onClick={() => tanganiHapusKarya(item.id)} className="p-2 text-zinc-500 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tabAdmin === 'skills' && (
                <div className="flex flex-col md:flex-row gap-10">
                  <div className="flex-1 space-y-6">
                    <form onSubmit={(e) => { e.preventDefault(); handleSimpanSkill(skillBaru, idEdit, resetForms); }} className="space-y-4">
                      <h4 className="text-white font-bold uppercase tracking-widest text-xs">Tambah/Edit Skill</h4>
                      <input type="text" placeholder="Nama Software (e.g. Photoshop)" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={skillBaru.title} onChange={e => setSkillBaru({ ...skillBaru, title: e.target.value })} required />
                      <div className="flex items-center gap-4">
                        <input type="range" min="0" max="100" className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600" value={skillBaru.level} onChange={e => setSkillBaru({ ...skillBaru, level: parseInt(e.target.value) })} />
                        <span className="text-white font-bold text-xs w-10">{skillBaru.level}%</span>
                      </div>
                      <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all"> {idEdit ? 'Simpan Skill' : 'Tambah Skill'}</button>
                      {idEdit && <button onClick={resetForms} type="button" className="w-full text-zinc-500 text-[10px] uppercase mt-2">Batal Edit</button>}
                    </form>
                  </div>
                  <div className="flex-1 space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {skills.map(item => (
                      <div key={item.id} className={`flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border ${idEdit === item.id ? 'border-red-600' : 'border-white/5'}`}>
                        <div>
                          <div className="text-xs font-bold text-white uppercase">{item.title}</div>
                          <div className="text-[10px] text-zinc-500">{item.level}% Mastery</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setSkillBaru(item); setIdEdit(item.id); }} className="text-zinc-500 hover:text-white"><Edit className="w-3 h-3" /></button>
                          <button onClick={() => tanganiHapusSkill(item.id)} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tabAdmin === 'journey' && (
                <div className="flex flex-col md:flex-row gap-10">
                  <div className="flex-1 space-y-6">
                    <form onSubmit={(e) => { e.preventDefault(); handleSimpanExperience(expBaru, idEdit, resetForms); }} className="space-y-4">
                      <h4 className="text-white font-bold uppercase tracking-widest text-xs">Tambah/Edit Journey</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Tahun (e.g. 2023-Now)" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={expBaru.year} onChange={e => setExpBaru({ ...expBaru, year: e.target.value })} required />
                        <select className="bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={expBaru.icon} onChange={e => setExpBaru({ ...expBaru, icon: e.target.value })}><option value="Camera">Camera Icon</option><option value="Palette">Palette Icon</option><option value="Play">Play Icon</option><option value="Other">Other</option></select>
                      </div>
                      <input type="text" placeholder="Posisi / Judul" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={expBaru.title} onChange={e => setExpBaru({ ...expBaru, title: e.target.value })} required />
                      <input type="text" placeholder="Perusahaan / Tempat" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={expBaru.company} onChange={e => setExpBaru({ ...expBaru, company: e.target.value })} required />
                      <textarea placeholder="Deskripsi Singkat" rows="3" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs" value={expBaru.description} onChange={e => setExpBaru({ ...expBaru, description: e.target.value })} />
                      <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all"> {idEdit ? 'Simpan Journey' : 'Tambah Journey'}</button>
                      {idEdit && <button onClick={resetForms} type="button" className="w-full text-zinc-500 text-[10px] uppercase mt-2">Batal Edit</button>}
                    </form>
                  </div>
                  <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {experiences.map(item => (
                      <div key={item.id} className={`p-4 bg-zinc-900/50 rounded-2xl border ${idEdit === item.id ? 'border-red-600' : 'border-white/5'} hover:bg-zinc-900 transition-colors`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black font-mono text-zinc-500 border border-white/10 px-2 py-0.5 rounded-full">{item.year}</span>
                          <div className="flex gap-2">
                            <button onClick={() => { setExpBaru(item); setIdEdit(item.id); }} className="text-zinc-500 hover:text-white"><Edit className="w-3 h-3" /></button>
                            <button onClick={() => tanganiHapusExperience(item.id)} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <h4 className="text-xs font-black text-white uppercase italic">{item.title}</h4>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">{item.company}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tabAdmin === 'config' && (
                <div className="max-w-2xl mx-auto space-y-8 pb-10">
                  <div className="p-8 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 space-y-6">
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs border-b border-white/5 pb-4 mb-4">Global Text Config</h4>

                    <div className="space-y-4">
                      <div className="space-y-1"><label className="text-[10px] text-zinc-500 uppercase font-bold">Navbar & Footer</label>
                        <input type="email" placeholder="Email Contact" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" value={configSitus.email || ''} onChange={e => setConfigSitus({ ...configSitus, email: e.target.value })} />
                      </div>
                      <div className="space-y-1"><label className="text-[10px] text-zinc-500 uppercase font-bold">Home: Hero Section</label>
                        <input type="text" placeholder="Tagline (e.g. Visual Artist • Malang)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" value={configSitus.heroTagline || ''} onChange={e => setConfigSitus({ ...configSitus, heroTagline: e.target.value })} />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Title 1 (RFX)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" value={configSitus.heroTitle1 || ''} onChange={e => setConfigSitus({ ...configSitus, heroTitle1: e.target.value })} />
                          <input type="text" placeholder="Title 2 (VISUAL)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" value={configSitus.heroTitle2 || ''} onChange={e => setConfigSitus({ ...configSitus, heroTitle2: e.target.value })} />
                        </div>
                        <input type="url" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" placeholder="Hero Image URL" value={configSitus.heroImage} onChange={e => setConfigSitus({ ...configSitus, heroImage: e.target.value })} onBlur={e => setConfigSitus({ ...configSitus, heroImage: convertImageLink(e.target.value) })} />
                      </div>

                      <div className="space-y-1"><label className="text-[10px] text-zinc-500 uppercase font-bold">Home: About Section</label>
                        <textarea className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" rows="2" placeholder="Caption Utama" value={configSitus.homeCaption || ''} onChange={e => setConfigSitus({ ...configSitus, homeCaption: e.target.value })} />
                        <textarea className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" rows="3" placeholder="Deskripsi Home" value={configSitus.homeDescription || ''} onChange={e => setConfigSitus({ ...configSitus, homeDescription: e.target.value })} />
                        <input type="url" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" placeholder="About Image URL" value={configSitus.aboutImage} onChange={e => setConfigSitus({ ...configSitus, aboutImage: e.target.value })} onBlur={e => setConfigSitus({ ...configSitus, aboutImage: convertImageLink(e.target.value) })} />
                        <input type="text" placeholder="Quote Bawah (Proses...)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" value={configSitus.aboutQuote || ''} onChange={e => setConfigSitus({ ...configSitus, aboutQuote: e.target.value })} />
                      </div>

                      <div className="space-y-1"><label className="text-[10px] text-zinc-500 uppercase font-bold">Pages Titles</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Portfolio Title (Karya)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" value={configSitus.portfolioTitle || ''} onChange={e => setConfigSitus({ ...configSitus, portfolioTitle: e.target.value })} />
                          <input type="text" placeholder="Contact Title (Mari Berkarya)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" value={configSitus.contactTitle || ''} onChange={e => setConfigSitus({ ...configSitus, contactTitle: e.target.value })} />
                        </div>
                        <input type="text" placeholder="Contact Status (Open For Commission)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" value={configSitus.contactStatus || ''} onChange={e => setConfigSitus({ ...configSitus, contactStatus: e.target.value })} />
                      </div>
                    </div>

                    <button onClick={handleSimpanConfig} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all">Simpan Konfigurasi</button>
                    <p className="text-[10px] text-zinc-600 italic text-center">Pastikan tabel 'site_config' sudah update di database.</p>
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

// --- MAIN COMPONENT ---
const App = () => {
  const [halamanAktif, setHalamanAktif] = useState('beranda');
  const [filter, setFilter] = useState('all');
  const [sedangTransisi, setSedangTransisi] = useState(false);
  const [modalAdminBuka, setModalAdminBuka] = useState(false);
  const [statusAdmin, setStatusAdmin] = useState(false);
  const [inputKunciAdmin, setInputKunciAdmin] = useState('');

  // State AI
  const [modalAiBuka, setModalAiBuka] = useState(false);
  const [kueriAi, setKueriAi] = useState('');
  const [responAi, setResponAi] = useState('');
  const [sedangKonsultasi, setSedangKonsultasi] = useState(false);

  // State Data (Supabase)
  const [daftarKarya, setDaftarKarya] = useState([]);
  const [skills, setSkills] = useState(defaultSkills);
  const [experiences, setExperiences] = useState(defaultExperiences);
  const [configSitus, setConfigSitus] = useState({
    heroImage: '', aboutImage: '', homeCaption: '', homeDescription: '',
    heroTagline: '', heroTitle1: '', heroTitle2: '', aboutQuote: '',
    contactStatus: '', contactTitle: '', email: '', portfolioTitle: ''
  });

  // State Form Admin
  const [tabAdmin, setTabAdmin] = useState('portofolio');
  const [itemBaru, setItemBaru] = useState({ title: '', category: 'video', image: '', description: '', youtubeUrl: '' });
  const [idEdit, setIdEdit] = useState(null);

  // --- FETCH DATA DARI SUPABASE ---
  const ambilData = useCallback(async () => {
    try {
      const { data: projects, error: errProjects } = await supabase.from('projects').select('*').order('id', { ascending: false });
      if (projects) setDaftarKarya(projects);
      if (errProjects) console.error("Error projects:", errProjects.message);

      const { data: config, error: errConfig } = await supabase.from('site_config').select('*').limit(1).single();
      if (config) setConfigSitus(prev => ({ ...prev, ...config }));
      if (errConfig) console.error("Error config:", errConfig.message);

      const { data: dataSkills, error: errSkills } = await supabase.from('skills').select('*').order('level', { ascending: false });
      if (dataSkills && dataSkills.length > 0) setSkills(dataSkills);
      if (errSkills) console.error("Error skills:", errSkills.message);

      const { data: dataExp, error: errExp } = await supabase.from('experiences').select('*').order('id', { ascending: true });
      if (dataExp && dataExp.length > 0) setExperiences(dataExp);
      if (errExp) console.error("Error experiences:", errExp.message);

    } catch (error) {
      console.log("Supabase fetch error:", error.message);
    }
  }, []);

  useEffect(() => {
    ambilData();
  }, [ambilData]);

  // --- HANDLERS ---
  const pindahHalaman = (h) => {
    if (h === halamanAktif) return;
    setSedangTransisi(true);
    setTimeout(() => { setHalamanAktif(h); window.scrollTo(0, 0); setSedangTransisi(false); }, 400);
  };

  const tanganiLoginAdmin = (e) => {
    e.preventDefault();
    if (inputKunciAdmin === "20810004") { setStatusAdmin(true); setInputKunciAdmin(''); }
    else { alert("Salah sandi!"); setInputKunciAdmin(''); }
  };

  // --- CRUD SUPABASE ---
  const tanganiHapusKarya = async (id) => {
    if (!statusAdmin || !window.confirm("Yakin hapus karya ini?")) return;
    try {
      await supabase.from('projects').delete().eq('id', id);
      setDaftarKarya(prev => prev.filter(item => item.id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleSimpanItem = async (e) => {
    e.preventDefault();
    try {
      if (idEdit) {
        await supabase.from('projects').update(itemBaru).eq('id', idEdit);
      } else {
        await supabase.from('projects').insert([itemBaru]);
      }
      ambilData();
      setItemBaru({ title: '', category: 'video', image: '', description: '', youtubeUrl: '' });
      setIdEdit(null);
      alert("Berhasil!");
    } catch (err) { alert(err.message); }
  };

  const handleSimpanConfig = async () => {
    try {
      await supabase.from('site_config').upsert({ id: 1, ...configSitus });
      alert("Tampilan tersimpan!");
    } catch (err) { alert(err.message); }
  };

  const batalEdit = () => {
    setItemBaru({ title: '', category: 'video', image: '', description: '', youtubeUrl: '' });
    setIdEdit(null);
  };

  const handleSimpanSkill = async (skillData, editId, onSuccess) => {
    try {
      if (editId) {
        await supabase.from('skills').update(skillData).eq('id', editId);
      } else {
        await supabase.from('skills').insert([skillData]);
      }
      ambilData(); onSuccess(); alert("Skill saved!");
    } catch (err) { alert(err.message); }
  };

  const tanganiHapusSkill = async (id) => {
    if (!window.confirm("Delete skill?")) return;
    try {
      await supabase.from('skills').delete().eq('id', id);
      setSkills(prev => prev.filter(item => item.id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleSimpanExperience = async (expData, editId, onSuccess) => {
    try {
      if (editId) {
        await supabase.from('experiences').update(expData).eq('id', editId);
      } else {
        await supabase.from('experiences').insert([expData]);
      }
      ambilData(); onSuccess(); alert("Experience saved!");
    } catch (err) { alert(err.message); }
  };

  const tanganiHapusExperience = async (id) => {
    if (!window.confirm("Delete journey?")) return;
    try {
      await supabase.from('experiences').delete().eq('id', id);
      setExperiences(prev => prev.filter(item => item.id !== id));
    } catch (err) { alert(err.message); }
  };


  const tanganiAi = async (e) => {
    e.preventDefault();
    if (!kueriAi.trim()) return;
    setSedangKonsultasi(true); setResponAi("");
    const j = await generateGeminiContent(`Jawab singkat (style anak muda visual artist): ${kueriAi}`);
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
        {halamanAktif === 'beranda' && <TampilanBeranda configSitus={configSitus} pindahHalaman={pindahHalaman} skills={skills} experiences={experiences} />}
        {halamanAktif === 'portofolio' && <TampilanPortofolio daftarKarya={daftarKarya} filter={filter} setFilter={setFilter} pindahHalaman={pindahHalaman} configSitus={configSitus} />}
        {halamanAktif === 'kontak' && <TampilanKontak modalAiBuka={modalAiBuka} setModalAiBuka={setModalAiBuka} kueriAi={kueriAi} setKueriAi={setKueriAi} tanganiAi={tanganiAi} sedangKonsultasi={sedangKonsultasi} responAi={responAi} configSitus={configSitus} />}
      </main>

      <PanelAdmin
        modalAdminBuka={modalAdminBuka} setModalAdminBuka={setModalAdminBuka}
        statusAdmin={statusAdmin} setStatusAdmin={setStatusAdmin}
        inputKunciAdmin={inputKunciAdmin} setInputKunciAdmin={setInputKunciAdmin}
        tanganiLoginAdmin={tanganiLoginAdmin} tabAdmin={tabAdmin} setTabAdmin={setTabAdmin}
        itemBaru={itemBaru} setItemBaru={setItemBaru}
        idEdit={idEdit} setIdEdit={setIdEdit} batalEdit={batalEdit}
        tanganiHapusKarya={tanganiHapusKarya} handleSimpanItem={handleSimpanItem}
        daftarKarya={daftarKarya}
        configSitus={configSitus} setConfigSitus={setConfigSitus} handleSimpanConfig={handleSimpanConfig}
        skills={skills} setSkills={setSkills} experiences={experiences} setExperiences={setExperiences}
        handleSimpanSkill={handleSimpanSkill} tanganiHapusSkill={tanganiHapusSkill}
        handleSimpanExperience={handleSimpanExperience} tanganiHapusExperience={tanganiHapusExperience}
      />

      <footer className="py-20 border-t border-white/5 text-center bg-black/50 relative z-10">
        <SectionWrapper>
          <div className="text-2xl font-black italic mb-6 opacity-30">RFX<span className="text-red-600">.</span></div>
          <p onClick={() => setModalAdminBuka(true)} className="text-[9px] text-zinc-700 uppercase tracking-[0.5em] font-black italic cursor-pointer hover:text-zinc-500 transition-colors">&copy; {new Date().getFullYear()} RFX VISUAL</p>
        </SectionWrapper>
      </footer>
    </div>
  );
};

export default App;
