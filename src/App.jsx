import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, addDoc, 
  deleteDoc, onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Instagram, Youtube, Mail, ArrowRight, ChevronLeft, 
  ExternalLink, Trash2, Edit3, X, Lock, Unlock, Sparkles, 
  Loader2, Camera, Play, Palette, Layout, Image as ImageIcon, Menu, Check, Save
} from 'lucide-react';

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyDdQfQAxvkfsAW64rF2Ku0c0o1mJXt_b8w",
      authDomain: "rfx-visual-world.firebaseapp.com",
      databaseURL: "https://rfx-visual-world-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "rfx-visual-world",
      storageBucket: "rfx-visual-world.firebasestorage.app",
      messagingSenderId: "212260328761",
      appId: "1:212260328761:web:d07cb234027ac977e844e8"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'rfx-visual-prod';

const apiKey = "gen-lang-client-0649806898"; 

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

/**
 * --- INTEGRASI GEMINI AI ---
 */
const panggilGemini = async (prompt, instruksiSistem = "") => {
  const modelName = "gemini-1.5-flash"; 
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: instruksiSistem ? { parts: [{ text: instruksiSistem }] } : undefined
      })
    });
    const hasil = await response.json();
    if (!response.ok) throw new Error(hasil.error?.message || "Kesalahan API");
    return hasil.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak memberikan respons.";
  } catch (err) {
    console.error("Koneksi AI Gagal:", err);
    return `Error: ${err.message}`;
  }
};

/**
 * --- DATA STATIS ---
 */
const dataKeahlian = [
  { nama: "Premiere Pro", level: 80 },
  { nama: "After Effects", level: 60 },
  { nama: "Capcut", level: 75 },
  { nama: "Lightroom", level: 70 }
];

const dataPengalaman = [
  { tahun: "2020", judul: "Langkah Awal", perusahaan: "Freelance", deskripsi: "Memulai eksplorasi visual dengan fokus pada dokumentasi acara lokal di Malang." },
  { tahun: "2021-2022", judul: "Pembentukan Identitas", perusahaan: "RFX Visual", deskripsi: "Membangun gaya sinematik yang kuat dan mulai merambah ke dunia animasi edukasi." },
  { tahun: "2023-Sekarang", judul: "Seniman Visual", perusahaan: "RFX Visual", deskripsi: "Fokus pada pembuatan konten visual berdampak tinggi bagi brand dan platform digital." }
];

const kategoriKarya = ["Semua", "Video", "Foto", "Animasi"];

/**
 * --- KOMPONEN UI ---
 */
const SectionWrapper = ({ children, className = "" }) => {
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
    <div ref={setRef} className="space-y-4 group">
      <div className="flex justify-between items-end">
        <span className="text-lg font-black tracking-tighter uppercase group-hover:text-red-500 transition-colors duration-500">{keahlian.nama}</span>
        <span className="text-xs font-mono text-zinc-600">{terlihat ? keahlian.level : 0}%</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div 
          className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-[1500ms] ease-out"
          style={{ width: terlihat ? `${keahlian.level}%` : '0%' }}
        ></div>
      </div>
    </div>
  );
};

/**
 * --- NAVIGASI ---
 */
const Navigasi = ({ pindahHalaman, halamanAktif, bukaModalAdmin, statusAdmin }) => {
  const [menuHpBuka, setMenuHpBuka] = useState(false);

  const tanganiMenuHp = (halaman) => {
    pindahHalaman(halaman);
    setMenuHpBuka(false);
  };

  return (
    <>
      <nav className="fixed w-full z-50 top-6 px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center bg-black/80 backdrop-blur-2xl border border-white/10 px-6 md:px-8 py-4 md:py-5 rounded-3xl transition-all duration-500 hover:border-white/20 shadow-2xl">
          <button onClick={() => pindahHalaman('beranda')} className="text-2xl md:text-4xl font-black italic tracking-tighter hover:scale-105 transition text-white group z-50">
            RFX<span className="text-red-600 group-hover:animate-pulse font-bold">.</span>
          </button>
          
          <div className="hidden md:flex gap-12 text-sm md:text-base font-bold uppercase tracking-[0.25em] text-zinc-400">
            {['beranda', 'portofolio', 'kontak'].map(item => (
              <button key={item} onClick={() => pindahHalaman(item)} className={`relative py-2 transition-all duration-300 hover:text-white hover:scale-105 ${halamanAktif === item ? 'text-red-600' : ''}`}>
                {item === 'beranda' ? 'Beranda' : item === 'portofolio' ? 'Karya' : 'Kontak'}
                {halamanAktif === item && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-red-600 rounded-full shadow-[0_0_15px_#dc2626]"></span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 z-50">
            <button onClick={() => bukaModalAdmin(true)} className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-300 ${statusAdmin ? 'bg-red-600/20 border-red-600/50 text-red-500' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}>
              {statusAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>
            <button onClick={() => pindahHalaman('kontak')} className="hidden md:block bg-white text-black px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 hover:bg-red-600 hover:text-white active:scale-95 shadow-lg">
              Rekrut Saya
            </button>
            <button onClick={() => setMenuHpBuka(!menuHpBuka)} className="md:hidden w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform border border-white/5">
              {menuHpBuka ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
            </button>
          </div>
        </div>
      </nav>

      {menuHpBuka && (
        <div className="fixed inset-0 z-40 bg-black/98 backdrop-blur-xl flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-300">
           {['beranda', 'portofolio', 'kontak'].map(item => (
              <button key={item} onClick={() => tanganiMenuHp(item)} className={`text-3xl font-black uppercase tracking-widest transition-all ${halamanAktif === item ? 'text-red-600 scale-110' : 'text-white hover:text-red-600'}`}>
                {item === 'beranda' ? 'Beranda' : item === 'portofolio' ? 'Karya' : 'Kontak'}
              </button>
            ))}
            <button onClick={() => tanganiMenuHp('kontak')} className="bg-red-600 text-white px-10 py-5 rounded-full text-base font-black uppercase tracking-widest mt-10 shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-95 transition-transform">
              Rekrut Saya
            </button>
        </div>
      )}
    </>
  );
};

const TampilanBeranda = ({ configSitus, pindahHalaman }) => (
  <div className="space-y-0 text-white">
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#050505] z-10"></div>
        <img src={configSitus.heroImage} className="w-full h-full object-cover scale-105 opacity-60" alt="Hero" />
      </div>
      <div className="relative z-20 text-center px-6 space-y-10">
        <SectionWrapper>
          <div className="inline-block px-5 py-2 border border-white/10 rounded-full text-[9px] uppercase tracking-[0.5em] mb-6 bg-white/5 backdrop-blur-md text-zinc-400 font-bold">Seniman Visual • Malang, Indonesia</div>
          <h1 className="text-7xl md:text-[130px] font-black tracking-tighter leading-[0.8] mb-12 italic">
            <span className="block opacity-30">RFX</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-white to-red-600 bg-[length:200%_auto] animate-[gradient_5s_linear_infinite] font-black uppercase text-white">VISUAL</span>
          </h1>
          <div className="flex justify-center">
            <button onClick={() => pindahHalaman('portofolio')} className="group bg-white text-black px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all duration-500 flex items-center gap-4">
              Eksplorasi Karya <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </SectionWrapper>
      </div>
    </section>

    <section className="py-40 px-6 max-w-6xl mx-auto">
      <SectionWrapper className="grid md:grid-cols-2 gap-24 items-center">
        <div className="relative rounded-[3rem] overflow-hidden border border-white/10 aspect-[4/5]">
          <img src={configSitus.aboutImage} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[1.5s] hover:scale-110" alt="Tentang Saya" />
        </div>
        <div className="space-y-10 text-left">
          <h2 className="text-5xl font-black tracking-tighter italic leading-none uppercase">"Tangkap momen,<br/><span className="text-red-600">ceritakan kisahnya.</span>"</h2>
          <div className="text-zinc-500 leading-relaxed space-y-6 text-xl font-light italic">
            <p>Halo, saya <span className="text-white font-black italic">Muhammad Ridho Febriyansyah</span>. Berkarya sejak 2020 dengan identitas <span className="text-red-500 font-black">RFX Visual</span>.</p>
            <p>Berasal dari Malang, saya menjelajahi setiap detail visual untuk menangkap suasana sinematik yang emosional.</p>
          </div>
        </div>
      </SectionWrapper>
    </section>

    <section className="py-40 border-t border-white/5 bg-[#080808]">
      <SectionWrapper className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-12 text-left">
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 font-mono italic">Perjalanan</h3>
             <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Pengalaman Singkat<span className="text-red-600">.</span></h2>
          </div>
          <p className="text-zinc-600 max-w-sm italic text-lg font-light">"Setiap langkah adalah proses pendewasaan dalam melihat dunia melalui lensa."</p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {dataPengalaman.map((exp, idx) => (
            <div key={idx} className="group relative p-12 bg-zinc-950 rounded-[3rem] border border-white/5 hover:border-red-600/30 transition-all duration-700 text-left">
              <div className="mb-10 flex justify-between items-start">
                <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 shadow-2xl">
                   {idx === 0 ? <Camera className="w-6 h-6" /> : idx === 1 ? <Palette className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </div>
                <span className="text-xs font-black font-mono text-zinc-700 tracking-[0.2em]">{exp.tahun}</span>
              </div>
              <h4 className="text-2xl font-black tracking-tighter mb-3 group-hover:text-red-500 transition-colors uppercase italic">{exp.judul}</h4>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-black mb-8">{exp.perusahaan}</p>
              <p className="text-zinc-400 leading-relaxed font-light text-sm italic">{exp.deskripsi}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </section>

    <section className="py-40 px-6 bg-black relative overflow-hidden">
      <SectionWrapper className="max-w-6xl mx-auto">
        <h2 className="text-6xl font-black tracking-tighter italic uppercase leading-none mb-24 text-left">Keahlian Saya<span className="text-red-600">.</span></h2>
        <div className="grid gap-16 max-w-4xl">
          {dataKeahlian.map((item) => (
            <ItemKeahlian key={item.nama} keahlian={item} />
          ))}
        </div>
      </SectionWrapper>
    </section>
  </div>
);

const TampilanPortofolio = ({ daftarKarya, filter, setFilter, pindahHalaman }) => (
  <div className="pt-48 pb-20 px-6 max-w-7xl mx-auto text-white">
    <SectionWrapper className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12 text-left">
      <div>
        <button onClick={() => pindahHalaman('beranda')} className="flex items-center gap-3 text-zinc-600 hover:text-red-600 transition-all text-[10px] uppercase tracking-[0.4em] font-black mb-6 group italic">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" /> Kembali ke Beranda
        </button>
        <h2 className="text-7xl font-black tracking-tighter leading-none mb-6 italic uppercase">Karya Terpilih<span className="text-red-600">.</span></h2>
      </div>
      <div className="flex flex-wrap gap-3 p-2 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-xl">
        {kategoriKarya.map((cat) => (
          <button 
            key={cat} 
            onClick={() => setFilter(cat === 'Semua' ? 'all' : cat.toLowerCase())} 
            className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${((filter === 'all' && cat === 'Semua') || filter === cat.toLowerCase()) ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </SectionWrapper>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 text-left">
      {daftarKarya.filter(item => filter === 'all' || item.category === filter).map((item) => (
        <SectionWrapper key={item.id}>
          <div className="group relative bg-zinc-950 rounded-[3.5rem] overflow-hidden border border-white/5 hover:border-red-600/30 transition-all duration-1000">
            <div className="aspect-[4/5] overflow-hidden bg-zinc-900">
              <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-[2s] opacity-70 group-hover:opacity-100" alt={item.title} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-12 flex flex-col justify-end text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 mb-4 italic">{item.category}</span>
              <h3 className="text-4xl font-black tracking-tighter mb-4 uppercase italic">{item.title}</h3>
              <p className="text-zinc-400 text-sm opacity-0 group-hover:opacity-100 transition-all duration-700 italic">{item.description}</p>
            </div>
          </div>
        </SectionWrapper>
      ))}
      {daftarKarya.length === 0 && <p className="col-span-full text-center text-zinc-500 py-20 italic">Belum ada karya. Silakan tambah via Admin Panel.</p>}
    </div>
  </div>
);

const TampilanKontak = ({ 
  modalAiBuka, setModalAiBuka, kueriAi, setKueriAi, 
  tanganiAi, sedangKonsultasi, responAi 
}) => (
  <div className="pt-48 pb-20 px-6 max-w-4xl mx-auto text-center text-white">
    <SectionWrapper>
      <h2 className="text-6xl md:text-[120px] font-black tracking-tighter mb-10 italic opacity-10 uppercase select-none">Mari Berkarya</h2>
      <div className="grid md:grid-cols-2 gap-8 text-left">
        <a href="mailto:ridhowork79@gmail.com" className="p-12 bg-white/5 rounded-[3rem] border border-white/10 hover:border-red-600/50 transition-all duration-700 group">
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 mb-10 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
            <Mail className="w-8 h-8" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4 italic">Email Langsung</h4>
          <p className="text-2xl font-black tracking-tighter italic">ridhowork79@gmail.com</p>
        </a>
        <button 
          onClick={() => setModalAiBuka(true)}
          className="p-12 bg-white/5 rounded-[3rem] border border-white/10 hover:border-red-600/50 transition-all duration-700 group text-left w-full"
        >
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 mb-10 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
            <Sparkles className="w-8 h-8" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4 italic">Konsultan AI</h4>
          <p className="text-2xl font-black tracking-tighter italic">Brainstorm Konsep</p>
        </button>
      </div>
    </SectionWrapper>

    {modalAiBuka && (
      <div 
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300"
        onClick={() => setModalAiBuka(false)} 
      >
        <div 
          className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-3xl p-8 md:p-12 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="sticky top-0 z-10 flex justify-between items-center bg-[#0a0a0a]/90 backdrop-blur-md py-2 -mt-2 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_20px_#dc2626] animate-pulse">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">RFX AI Consultant</h3>
            </div>
            <button onClick={() => setModalAiBuka(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-zinc-500 italic text-left text-base font-light">
            Jelaskan ide project Anda, asisten kami akan menyarankan gaya visual dan moodboard terbaik.
          </p>

          <form onSubmit={tanganiAi} className="space-y-6">
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-6 py-5 text-white text-base outline-none focus:border-red-600 h-32 resize-none shadow-inner"
              value={kueriAi} onChange={e => setKueriAi(e.target.value)}
              placeholder="Saya ingin buat video profil brand sepatu lokal dengan nuansa vintage urban..."
            />
            <button type="submit" disabled={sedangKonsultasi} className="w-full bg-red-600 py-5 rounded-[2rem] font-black uppercase text-xs text-white shadow-2xl shadow-red-900/30 flex items-center justify-center gap-3 active:scale-95 transition-all">
              {sedangKonsultasi ? <Loader2 className="animate-spin w-4 h-4" /> : "Buat Konsep"}
            </button>
          </form>

          {responAi && (
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 mt-4 shadow-inner">
              <p className="text-base leading-relaxed text-zinc-300 font-light italic whitespace-pre-wrap">{responAi}</p>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

const PanelAdmin = ({ 
  modalAdminBuka, setModalAdminBuka, statusAdmin, setStatusAdmin,
  inputKunciAdmin, setInputKunciAdmin, tanganiLoginAdmin,
  tabAdmin, setTabAdmin,
  itemBaru, setItemBaru, idEdit, setIdEdit, batalEdit,
  tanganiHapusKarya, mulaiEdit,
  daftarKarya, configSitus, setConfigSitus,
}) => {
  const [statusSimpan, setStatusSimpan] = useState('idle');
  const [isFirstRunConfig, setIsFirstRunConfig] = useState(true);
  const [isFirstRunEdit, setIsFirstRunEdit] = useState(true);

  const debouncedConfig = useDebounce(configSitus, 1500);
  const debouncedItemBaru = useDebounce(itemBaru, 1500);

  useEffect(() => {
    if (isFirstRunConfig) { setIsFirstRunConfig(false); return; }
    if (!statusAdmin) return;

    const simpanConfig = async () => {
      setStatusSimpan('loading');
      try {
        await setDoc(getDocPath('site_config', 'home'), debouncedConfig, { merge: true });
        setStatusSimpan('success');
        setTimeout(() => setStatusSimpan('idle'), 2000);
      } catch (err) {
        console.error("Gagal autosave config:", err);
        setStatusSimpan('idle');
      }
    };
    simpanConfig();
  }, [debouncedConfig]);

  useEffect(() => {
    if (isFirstRunEdit) { setIsFirstRunEdit(false); return; }
    if (!statusAdmin || !idEdit) return; // Hanya jalan kalau sedang edit

    const simpanItemEdit = async () => {
      setStatusSimpan('loading');
      try {
        await setDoc(getDocPath('portfolio', idEdit), debouncedItemBaru, { merge: true });
        setStatusSimpan('success');
        setTimeout(() => setStatusSimpan('idle'), 2000);
      } catch (err) {
        console.error("Gagal autosave item:", err);
        setStatusSimpan('idle');
      }
    };
    simpanItemEdit();
  }, [debouncedItemBaru]);

  const handleInputBaru = async (e, force = false) => {
    if (force || e.key === 'Enter') {
      if (!itemBaru.title || !itemBaru.image) return; // Validasi minimal
      
      setStatusSimpan('loading');
      try {
        await addDoc(getCollectionPath('portfolio'), itemBaru);
        setItemBaru({ title: '', category: 'video', image: '', description: '' });
        setStatusSimpan('success');
        setTimeout(() => setStatusSimpan('idle'), 2000);
      } catch (err) {
        console.error("Gagal tambah:", err);
        setStatusSimpan('idle');
      }
    }
  };

  if (!modalAdminBuka) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[4rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Indikator Status Simpan (Pojok Kanan Atas) */}
        {statusAdmin && (
          <div className="absolute top-8 right-8 flex items-center gap-2 z-50">
            {statusSimpan === 'loading' && <span className="text-zinc-500 text-xs uppercase tracking-widest flex gap-2 items-center"><Loader2 className="w-3 h-3 animate-spin"/> Menyimpan...</span>}
            {statusSimpan === 'success' && <span className="text-green-500 text-xs uppercase tracking-widest flex gap-2 items-center"><Check className="w-3 h-3"/> Tersimpan</span>}
          </div>
        )}

        {!statusAdmin ? (
          <div className="p-24 text-center space-y-12 flex-1 flex flex-col justify-center">
            <div className="w-24 h-24 bg-red-600/10 rounded-[2rem] flex items-center justify-center text-red-600 mx-auto shadow-2xl"><Lock className="w-12 h-12" /></div>
            <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter">Akses Terbatas</h2>
            <form onSubmit={tanganiLoginAdmin} className="max-w-md mx-auto space-y-6 w-full">
              <input 
                type="password" placeholder="Masukkan Kunci Admin" 
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-10 py-6 text-center outline-none focus:border-red-600 text-white text-xl"
                value={inputKunciAdmin} onChange={e => setInputKunciAdmin(e.target.value)}
              />
              <button type="submit" className="w-full bg-red-600 py-6 rounded-3xl font-black uppercase tracking-widest text-xs text-white active:scale-95 transition shadow-2xl">Buka Dashboard</button>
              <button type="button" onClick={() => setModalAdminBuka(false)} className="text-zinc-700 text-[10px] uppercase font-black tracking-[0.3em] hover:text-white transition italic">Batal</button>
            </form>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Admin */}
            <div className="w-72 border-r border-white/5 bg-black/40 p-12 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 mb-12 italic">Kokpit</h3>
              <button onClick={() => setTabAdmin('portofolio')} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-sm font-black transition-all ${tabAdmin === 'portofolio' ? 'bg-red-600 text-white shadow-2xl' : 'text-zinc-600 hover:text-white'}`}><ImageIcon className="w-5 h-5"/> Portofolio</button>
              <button onClick={() => setTabAdmin('config')} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-sm font-black transition-all ${tabAdmin === 'config' ? 'bg-red-600 text-white shadow-2xl' : 'text-zinc-600 hover:text-white'}`}><Layout className="w-5 h-5"/> Konfigurasi</button>
              <div className="pt-20 border-t border-white/5"><button onClick={() => setStatusAdmin(false)} className="flex items-center gap-4 text-[10px] font-black text-red-600 uppercase tracking-[0.3em] hover:text-red-400 transition italic"><Lock className="w-4 h-4"/> Keluar</button></div>
              <button onClick={() => setModalAdminBuka(false)} className="flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] hover:text-white transition italic mt-4"><X className="w-4 h-4"/> Tutup</button>
            </div>

            {/* Konten Admin */}
            <div className="flex-1 p-16 overflow-y-auto custom-scrollbar">
              {tabAdmin === 'portofolio' ? (
                <div className="flex gap-16">
                  {/* Form Tambah/Edit (TANPA TOMBOL UPLOAD) */}
                  <div className="flex-[1.5] space-y-10">
                    <div className="flex justify-between items-center">
                      <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter text-left">
                        {idEdit ? 'Edit Mode (Autosave)' : 'Tambah Cepat'}
                      </h3>
                      {idEdit && <button onClick={batalEdit} className="text-xs text-red-500 font-bold uppercase tracking-widest hover:text-red-400">Selesai Edit</button>}
                    </div>
                    
                    <div className="space-y-6 text-left">
                      <p className="text-xs text-zinc-500 italic mb-4">
                        {idEdit ? "Perubahan disimpan otomatis saat mengetik." : "Isi data dan tekan ENTER untuk menambahkan karya baru."}
                      </p>

                      <input 
                        type="text" placeholder="Judul Mahakarya" required 
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-10 py-6 text-white text-lg outline-none focus:border-red-600 shadow-inner transition-all" 
                        value={itemBaru.title} 
                        onChange={e => setItemBaru({...itemBaru, title: e.target.value})}
                        onKeyDown={(e) => !idEdit && handleInputBaru(e)}
                      />
                      <div className="grid grid-cols-2 gap-6">
                        <select 
                          className="bg-zinc-900 border border-white/10 rounded-[2rem] px-10 py-6 text-white outline-none focus:border-red-600 appearance-none italic font-black text-xs uppercase tracking-widest" 
                          value={itemBaru.category} 
                          onChange={e => setItemBaru({...itemBaru, category: e.target.value})}
                        >
                          <option value="video">Video</option><option value="photo">Foto</option><option value="animation">Animasi</option>
                        </select>
                        <input 
                          type="url" placeholder="Paste Link Foto Disini..." required 
                          className="bg-white/5 border border-white/10 rounded-[2rem] px-10 py-6 text-white outline-none focus:border-red-600 shadow-inner" 
                          value={itemBaru.image} 
                          onChange={e => setItemBaru({...itemBaru, image: e.target.value})}
                          onKeyDown={(e) => !idEdit && handleInputBaru(e)}
                          onBlur={(e) => !idEdit && handleInputBaru(e, true)} // Auto simpan saat keluar dari kolom link
                        />
                      </div>
                      <textarea 
                        placeholder="Deskripsi singkat..." required rows="4" 
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-10 py-8 text-white outline-none resize-none shadow-inner italic font-light text-lg" 
                        value={itemBaru.description} 
                        onChange={e => setItemBaru({...itemBaru, description: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  {/* Daftar Karya */}
                  <div className="flex-1 space-y-6 text-left">
                    <h4 className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.5em] italic">Arsip ({daftarKarya.length})</h4>
                    <div className="grid gap-4 overflow-y-auto pr-4 max-h-[600px] custom-scrollbar">
                      {daftarKarya.map(item => (
                        <div key={item.id} className={`flex items-center gap-5 p-5 bg-white/5 rounded-3xl border group transition-all duration-500 shadow-xl ${idEdit === item.id ? 'border-red-600 bg-red-600/10' : 'border-white/5 hover:border-red-600/30'}`}>
                          <img src={item.image} className="w-14 h-14 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                          <div className="flex-1 min-w-0"><h5 className="font-black truncate text-sm text-white italic group-hover:text-red-500 transition-colors">{item.title}</h5><span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 italic">{item.category}</span></div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => mulaiEdit(item)} className="p-3 text-zinc-600 hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button><button onClick={() => tanganiHapusKarya(item.id)} className="p-3 text-zinc-600 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl space-y-12 text-left">
                  <div className="space-y-4 text-left"><h3 className="text-4xl font-black italic text-white uppercase tracking-tighter">Media Global</h3><p className="text-zinc-600 text-lg font-light italic">Paste link baru, otomatis tersimpan.</p></div>
                  <div className="space-y-10 text-left">
                    <div className="space-y-4 text-left"><label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 px-4">URL Background Hero</label>
                      <input 
                        type="url" 
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-10 py-6 text-white outline-none focus:border-red-600 shadow-inner" 
                        value={configSitus.heroImage} 
                        onChange={e => setConfigSitus({...configSitus, heroImage: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-4 text-left"><label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 px-4">URL Foto Profil</label>
                      <input 
                        type="url" 
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-10 py-6 text-white outline-none focus:border-red-600 shadow-inner" 
                        value={configSitus.aboutImage} 
                        onChange={e => setConfigSitus({...configSitus, aboutImage: e.target.value})} 
                      />
                    </div>
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
  const [configSitus, setConfigSitus] = useState({
    heroImage: 'https://drive.google.com/uc?export=download&id=1vG4LkRFU6r03-eieQfIWOo-nBwzk9cOD',
    aboutImage: 'https://drive.google.com/uc?export=download&id=1Ghg9q02BHysbI_V7nhbjKOpypbFQIRTs'
  });

  const [tabAdmin, setTabAdmin] = useState('portofolio');
  const [itemBaru, setItemBaru] = useState({ title: '', category: 'video', image: '', description: '' });
  const [idEdit, setIdEdit] = useState(null);

  const KUNCI_ADMIN = "RFX2026"; 

  useEffect(() => {
    const initAutentikasi = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Gagal inisialisasi autentikasi:", error);
      }
    };
    initAutentikasi();
    const batalLangganan = onAuthStateChanged(auth, (user) => {
      setPengguna(user);
    });
    return () => batalLangganan();
  }, []);

  // Langkah 2: Sinkronisasi Data Firestore (Jalur Sederhana)
  useEffect(() => {
    if (!pengguna) return;

    // Menggunakan path sederhana: 'portfolio' dan 'site_config'
    const kolPortofolio = getCollectionPath('portfolio');
    const unsubPortofolio = onSnapshot(kolPortofolio, 
      (snapshot) => {
        setDaftarKarya(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, 
      (error) => console.error("Error portofolio snapshot:", error)
    );

    const docConfig = getDocPath('site_config', 'home');
    const unsubConfig = onSnapshot(docConfig, 
      (docSnap) => {
        if (docSnap.exists()) setConfigSitus(docSnap.data());
      },
      (error) => console.error("Error config snapshot:", error)
    );

    return () => { unsubPortofolio(); unsubConfig(); };
  }, [pengguna]);

  const pindahHalaman = (halaman) => {
    if (halaman === halamanAktif) return;
    setSedangTransisi(true);
    setTimeout(() => {
      setHalamanAktif(halaman);
      window.scrollTo(0, 0);
      setSedangTransisi(false);
    }, 400);
  };

  const tanganiLoginAdmin = (e) => {
    e.preventDefault();
    if (inputKunciAdmin === KUNCI_ADMIN) {
      setStatusAdmin(true);
      setInputKunciAdmin('');
    } else {
      alert("Kunci Admin Salah!");
    }
  };

  const tanganiHapusKarya = async (id) => {
    if (!pengguna || !statusAdmin) return;
    if(!confirm("Hapus permanen?")) return;
    try { 
      await deleteDoc(getDocPath('portfolio', id)); 
    } catch (err) { console.error(err); }
  };

  const mulaiEdit = (item) => {
    setItemBaru({ title: item.title, category: item.category, image: item.image, description: item.description });
    setIdEdit(item.id);
    const formElement = document.querySelector('form');
    if(formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const batalEdit = () => {
    setItemBaru({ title: '', category: 'video', image: '', description: '' });
    setIdEdit(null);
  };

  const tanganiAi = async (e) => {
    e.preventDefault();
    if (!kueriAi) return;
    setSedangKonsultasi(true);
    try {
      const prompt = `Pengguna ingin saran konsep visual: "${kueriAi}". Berikan saran kreatif yang puitis dan teknis dalam bahasa Indonesia yang keren.`;
      const hasil = await panggilGemini(prompt, "RFX Visual Konsultan AI - Ahli Video & Fotografi.");
      setResponAi(hasil);
    } catch (err) { 
      setResponAi("Terjadi kesalahan saat menghubungi asisten AI."); 
    } finally { 
      setSedangKonsultasi(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-600/30 font-sans tracking-tight overflow-x-hidden custom-scrollbar">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>

      <Navigasi 
        pindahHalaman={pindahHalaman} 
        halamanAktif={halamanAktif} 
        bukaModalAdmin={setModalAdminBuka} 
        statusAdmin={statusAdmin} 
      />
      
      <main className={`transition-all duration-500 transform ${sedangTransisi ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100'}`}>
        {halamanAktif === 'beranda' && <TampilanBeranda configSitus={configSitus} pindahHalaman={pindahHalaman} />}
        {halamanAktif === 'portofolio' && <TampilanPortofolio daftarKarya={daftarKarya} filter={filter} setFilter={setFilter} pindahHalaman={pindahHalaman} />}
        {halamanAktif === 'kontak' && (
          <TampilanKontak 
            modalAiBuka={modalAiBuka} setModalAiBuka={setModalAiBuka}
            kueriAi={kueriAi} setKueriAi={setKueriAi}
            tanganiAi={tanganiAi} sedangKonsultasi={sedangKonsultasi}
            responAi={responAi}
          />
        )}
      </main>

      {/* PANEL ADMIN LENGKAP */}
      <PanelAdmin 
        modalAdminBuka={modalAdminBuka} setModalAdminBuka={setModalAdminBuka}
        statusAdmin={statusAdmin} setStatusAdmin={setStatusAdmin}
        inputKunciAdmin={inputKunciAdmin} setInputKunciAdmin={setInputKunciAdmin}
        tanganiLoginAdmin={tanganiLoginAdmin}
        tabAdmin={tabAdmin} setTabAdmin={setTabAdmin}
        itemBaru={itemBaru} setItemBaru={setItemBaru}
        idEdit={idEdit} setIdEdit={setIdEdit} batalEdit={batalEdit}
        tanganiHapusKarya={tanganiHapusKarya}
        mulaiEdit={mulaiEdit}
        daftarKarya={daftarKarya}
        configSitus={configSitus} setConfigSitus={setConfigSitus}
      />

      <footer className="py-32 border-t border-white/5 text-center mt-40 bg-black">
        <SectionWrapper>
          <div className="text-3xl font-black italic tracking-tighter mb-8 text-white uppercase italic">RFX<span className="text-red-600">.</span></div>
          <p className="text-[9px] text-zinc-700 uppercase tracking-[0.8em] font-black italic">&copy; 2026 RFX VISUAL • CLOUD INTEGRATED V2.0</p>
        </SectionWrapper>
      </footer>
    </div>
  );
};

export default App;