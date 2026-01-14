import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, addDoc, 
  deleteDoc, onSnapshot, getDoc, query 
} from 'firebase/firestore';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Zap, Instagram, Youtube, Mail, MapPin, 
  ArrowRight, ChevronLeft, ExternalLink, Briefcase, 
  Trash2, Edit3, X, Lock, Unlock, Save, Image as ImageIcon,
  Layout, Sparkles, MessageSquare, Loader2, Camera, Play, Palette
} from 'lucide-react';

/**
 * --- KONFIGURASI SISTEM ---
 * Mendeteksi apakah berjalan di sandbox (Canvas) atau lokal (Vite/GitHub)
 */
cconst firebaseConfig = {
  apiKey: "AIzaSyDdQfQAxvkfsAW64rF2Ku0c0o1mJXt_b8w",
  authDomain: "rfx-visual-world.firebaseapp.com",
  projectId: "rfx-visual-world",
  storageBucket: "rfx-visual-world.firebasestorage.app",
  messagingSenderId: "212260328761",
  appId: "1:212260328761:web:d07cb234027ac977e844e8",
  measurementId: "G-5D57C15ENN"
  };
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'rfx-visual-prod';

// API Key Gemini (Kosongkan jika menggunakan env lokal)
const apiKey = ""; 

/**
 * --- FUNGSI GEMINI AI ---
 */
const callGemini = async (prompt, systemInstruction = "") => {
  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "API Error");
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (err) {
      if (i === 4) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
};

/**
 * --- DATA STATIS & KONFIGURASI VISUAL ---
 */
const skillsData = [
  { name: "Premiere Pro", level: 80 },
  { name: "After Effects", level: 60 },
  { name: "Capcut", level: 75 },
  { name: "Lightroom Mobile", level: 70 },
  { name: "Adobe Illustrator", level: 50 }
];

const experiences = [
  { year: "2020", title: "Langkah Awal", company: "Freelance", desc: "Memulai eksplorasi visual dengan fokus pada dokumentasi acara lokal di Malang." },
  { year: "2021-2022", title: "Pembentukan Identitas", company: "RFX Visual", desc: "Membangun gaya sinematik yang kuat dan mulai merambah ke dunia animasi edukasi." },
  { year: "2023-Now", title: "Visual Artist", company: "RFX Visual", desc: "Fokus pada pembuatan konten visual berdampak tinggi bagi brand dan platform digital." }
];

/**
 * --- KOMPONEN ATOMIK (Untuk Stabilitas Performa) ---
 */

const SectionWrapper = ({ children, className = "" }) => {
  const [ref, setRef] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.1 });
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div ref={setRef} className={`${className} transition-all duration-1000 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      {children}
    </div>
  );
};

const SkillItem = ({ skill }) => {
  const [ref, setRef] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.1 });
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div ref={setRef} className="space-y-4 group">
      <div className="flex justify-between items-end">
        <span className="text-lg font-black tracking-tighter uppercase group-hover:text-red-500 transition-colors duration-500">{skill.name}</span>
        <span className="text-xs font-mono text-zinc-600">{visible ? skill.level : 0}%</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div 
          className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-[1500ms] ease-out shadow-[0_0_15px_rgba(220,38,38,0.5)]"
          style={{ width: visible ? `${skill.level}%` : '0%' }}
        ></div>
      </div>
    </div>
  );
};

/**
 * --- SUB-VIEWS (Halaman) ---
 */

const Navbar = ({ navigateTo, currentPage, setShowAdminModal, isAdminAuthenticated }) => (
  <nav className="fixed w-full z-50 top-6 px-6">
    <div className="max-w-6xl mx-auto flex justify-between items-center bg-black/40 backdrop-blur-2xl border border-white/10 px-8 py-5 rounded-3xl shadow-2xl transition-all duration-500 hover:border-white/20">
      <button onClick={() => navigateTo('home')} className="text-3xl font-black italic tracking-tighter hover:scale-105 transition active:scale-95 text-white group">
        RFX<span className="text-red-600 group-hover:animate-pulse font-bold">.</span>
      </button>
      <div className="hidden md:flex gap-10 text-[10px] uppercase tracking-[0.4em] font-black text-white/50">
        {['home', 'portfolio', 'contact'].map(item => (
          <button key={item} onClick={() => navigateTo(item)} className={`relative py-2 transition-all duration-300 hover:text-white ${currentPage === item ? 'text-red-600' : ''}`}>
            {item}{currentPage === item && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 rounded-full shadow-[0_0_10px_#dc2626]"></span>}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setShowAdminModal(true)} className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 ${isAdminAuthenticated ? 'bg-red-600/20 border-red-600/50 text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}>
          {isAdminAuthenticated ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        </button>
        <button onClick={() => navigateTo('contact')} className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:bg-red-600 hover:text-white active:scale-95 shadow-xl">
          Hire Me
        </button>
      </div>
    </div>
  </nav>
);

const HomeView = ({ siteConfig, navigateTo }) => (
  <div className="space-y-0 text-white">
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#050505] z-10"></div>
        <img src={siteConfig.heroImage} className="w-full h-full object-cover scale-105 animate-[pulse_10s_infinite] opacity-60" alt="Hero" />
      </div>
      <div className="relative z-20 text-center px-6 space-y-10">
        <SectionWrapper>
          <div className="inline-block px-5 py-2 border border-white/10 rounded-full text-[9px] uppercase tracking-[0.5em] mb-6 bg-white/5 backdrop-blur-md text-zinc-400 font-bold">Visual Artist • Malang, Indonesia</div>
          <h1 className="text-7xl md:text-[130px] font-black tracking-tighter leading-[0.8] mb-12 italic">
            <span className="block opacity-30">RFX</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-white to-red-600 bg-[length:200%_auto] animate-[gradient_5s_linear_infinite] font-black uppercase">VISUAL</span>
          </h1>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <button onClick={() => navigateTo('portfolio')} className="group bg-white text-black px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all duration-500 flex items-center gap-4 shadow-2xl">
              Lihat Portofolio <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </SectionWrapper>
      </div>
    </section>

    <section className="py-40 px-6 max-w-6xl mx-auto">
      <SectionWrapper className="grid md:grid-cols-2 gap-24 items-center">
        <div className="relative group">
          <div className="absolute -inset-10 bg-red-600/10 blur-[100px] rounded-full group-hover:bg-red-600/20 transition-all duration-1000"></div>
          <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl aspect-[4/5]">
            <img src={siteConfig.aboutImage} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[1.5s] hover:scale-110" alt="About" />
          </div>
        </div>
        <div className="space-y-10 text-left">
          <h2 className="text-5xl font-black tracking-tighter italic leading-none uppercase">"Capture moments,<br/><span className="text-red-600">tell the story.</span>"</h2>
          <div className="text-zinc-500 leading-relaxed space-y-6 text-xl font-light italic">
            <p>Halo, saya <span className="text-white font-black italic">Muhammad Ridho Febriyansyah</span>. Berkarya sejak 2020 dengan identitas <span className="text-red-500 font-black">RFX Visual</span>.</p>
            <p>Berawal dari Malang, saya menjelajahi setiap detail visual untuk menangkap suasana sinematik yang emosional dan bermakna.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-6">
            <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:border-red-600/30 transition-all duration-500 group">
              <div className="text-5xl font-black text-white mb-2 italic group-hover:text-red-600 transition-colors">4+</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-black">Tahun Pengalaman</div>
            </div>
            <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:border-red-600/30 transition-all duration-500 group">
              <div className="text-5xl font-black text-white mb-2 italic group-hover:text-red-600 transition-colors">50+</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-black">Project Selesai</div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </section>

    <section className="py-40 border-t border-white/5 bg-[#080808]">
      <SectionWrapper className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-12">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 font-mono italic">Expertise Stack</h3>
            <h2 className="text-6xl font-black tracking-tighter italic uppercase leading-none">Keahlian Saya<span className="text-red-600">.</span></h2>
          </div>
          <p className="text-zinc-600 max-w-sm italic text-lg font-light leading-relaxed">"Penguasaan alat produksi terbaik untuk menghasilkan mahakarya visual yang tajam dan bernyawa."</p>
        </div>
        <div className="grid gap-16 max-w-4xl">
          {skillsData.map((skill) => (
            <SkillItem key={skill.name} skill={skill} />
          ))}
        </div>
      </SectionWrapper>
    </section>

    <section className="py-40 px-6 bg-black relative overflow-hidden">
      <SectionWrapper className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-12 text-left">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 font-mono italic">The Journey</h3>
            <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Pengalaman Singkat<span className="text-red-600">.</span></h2>
          </div>
          <p className="text-zinc-600 max-w-sm italic text-lg font-light">"Setiap langkah adalah proses pendewasaan dalam melihat dunia melalui lensa."</p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {experiences.map((exp, idx) => (
            <div key={idx} className="group relative p-12 bg-zinc-950 rounded-[3rem] border border-white/5 hover:border-red-600/30 transition-all duration-700 text-left">
              <div className="mb-10 flex justify-between items-start">
                <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 shadow-2xl">
                  {idx === 0 ? <Camera className="w-6 h-6" /> : idx === 1 ? <Palette className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </div>
                <span className="text-xs font-black font-mono text-zinc-700 tracking-[0.2em]">{exp.year}</span>
              </div>
              <h4 className="text-3xl font-black tracking-tighter mb-3 group-hover:text-red-500 transition-colors uppercase italic">{exp.title}</h4>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-black mb-8">{exp.company}</p>
              <p className="text-zinc-400 leading-relaxed font-light text-lg italic">{exp.desc}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </section>
  </div>
);

const PortfolioView = ({ portfolioItems, filter, setFilter, navigateTo }) => (
  <div className="pt-48 pb-20 px-6 max-w-7xl mx-auto text-white">
    <SectionWrapper className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12 text-left">
      <div className="flex-1">
        <button onClick={() => navigateTo('home')} className="flex items-center gap-3 text-zinc-600 hover:text-red-600 transition-all text-[10px] uppercase tracking-[0.4em] font-black mb-6 group italic">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" /> Back to home
        </button>
        <h2 className="text-7xl md:text-9xl font-black tracking-tighter leading-none mb-6 italic uppercase">Selected Works<span className="text-red-600">.</span></h2>
        <p className="text-zinc-600 max-w-xl italic text-xl font-light leading-relaxed">"Kumpulan narasi visual yang diabadikan dengan ketajaman rasa dan teknik sinematik."</p>
      </div>
      <div className="flex flex-wrap gap-3 p-2 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-xl self-start md:self-end">
        {['all', 'video', 'photo', 'animation'].map((cat) => (
          <button 
            key={cat} 
            onClick={() => setFilter(cat)} 
            className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${filter === cat ? 'bg-red-600 text-white shadow-[0_10px_30px_rgba(220,38,38,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </SectionWrapper>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      {portfolioItems.filter(item => filter === 'all' || item.category === filter).map((item) => (
        <SectionWrapper key={item.id}>
          <div className="group relative bg-zinc-950 rounded-[3.5rem] overflow-hidden border border-white/5 hover:border-red-600/30 transition-all duration-1000 shadow-2xl">
            <div className="aspect-[4/5] overflow-hidden bg-zinc-900 shadow-inner">
              <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-[2s] opacity-70 group-hover:opacity-100" alt={item.title} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-12 flex flex-col justify-end transform transition-all duration-700 text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 mb-4 italic">{item.category}</span>
              <h3 className="text-4xl font-black tracking-tighter mb-4 leading-none group-hover:text-white transition-colors uppercase italic">{item.title}</h3>
              <p className="text-zinc-400 text-sm opacity-0 group-hover:opacity-100 transition-all duration-700 leading-relaxed translate-y-6 group-hover:translate-y-0 line-clamp-3 italic">
                {item.description}
              </p>
              <div className="mt-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-6 group-hover:translate-y-0 delay-200">
                <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-red-600 transition-colors">
                  Details <ArrowRight className="w-3 h-3" />
                </button>
                <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-500 shadow-2xl cursor-pointer">
                  <ExternalLink className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </SectionWrapper>
      ))}
    </div>
  </div>
);

const ContactView = ({ 
  isAiConsultantOpen, setIsAiConsultantOpen, aiConsultQuery, setAiConsultQuery, 
  handleAiConsult, isConsulting, aiConsultResponse 
}) => (
  <div className="pt-48 pb-20 px-6 max-w-4xl mx-auto text-center text-white">
    <SectionWrapper>
      <h2 className="text-6xl md:text-[120px] font-black tracking-tighter mb-10 italic opacity-10 uppercase select-none">Let's Create</h2>
      <div className="space-y-16">
        <p className="text-2xl text-zinc-500 italic font-light">"Punya ide besar yang ingin diwujudkan secara visual?"</p>
        <div className="grid md:grid-cols-2 gap-8 text-left">
          <a href="mailto:ridhowork79@gmail.com" className="p-12 bg-white/5 rounded-[3rem] border border-white/10 hover:border-red-600/50 transition-all duration-700 group shadow-2xl">
            <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 mb-10 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 shadow-xl">
              <Mail className="w-8 h-8" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4 font-mono italic">Email Direct</h4>
            <p className="text-2xl font-black tracking-tighter italic">ridhowork79@gmail.com</p>
          </a>
          <button 
            onClick={() => setIsAiConsultantOpen(true)}
            className="p-12 bg-white/5 rounded-[3rem] border border-white/10 hover:border-red-600/50 transition-all duration-700 group block text-left w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 mb-10 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4 font-mono italic text-left">AI Consultant</h4>
            <p className="text-2xl font-black tracking-tighter italic text-left">Brainstorm Concept</p>
          </button>
        </div>
        <div className="flex justify-center gap-12 pt-10">
          {[{ icon: <Instagram />, label: "Instagram" }, { icon: <Youtube />, label: "YouTube" }].map((social, i) => (
            <a key={i} href="#" className="flex flex-col items-center gap-5 text-zinc-600 hover:text-white transition-all duration-500 group">
              <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-red-600 transition-all transform group-hover:-translate-y-3 shadow-2xl">
                {social.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-0 group-hover:opacity-100 transition-all italic">{social.label}</span>
            </a>
          ))}
        </div>
      </div>
    </SectionWrapper>

    {isAiConsultantOpen && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
        <div className="relative w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-[4rem] shadow-3xl p-16 space-y-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_20px_#dc2626] animate-pulse"><Sparkles className="text-white w-6 h-6" /></div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">RFX AI Consultant</h3>
            </div>
            <button onClick={() => setIsAiConsultantOpen(false)} className="w-12 h-12 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"><X /></button>
          </div>
          <p className="text-zinc-500 italic text-left text-lg font-light">Jelaskan ide project Anda, asisten kami akan menyarankan gaya visual dan moodboard terbaik.</p>
          <form onSubmit={handleAiConsult} className="space-y-6">
            <textarea 
              placeholder="Saya ingin buat video profil brand sepatu lokal dengan nuansa vintage urban..."
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-white text-lg outline-none focus:border-red-600 transition-all h-40 resize-none shadow-inner"
              value={aiConsultQuery} onChange={e => setAiConsultQuery(e.target.value)}
            />
            <button type="submit" disabled={isConsulting} className="w-full bg-red-600 py-6 rounded-[2rem] font-black uppercase text-xs text-white flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95 transition-all shadow-2xl shadow-red-900/30">
              {isConsulting ? <Loader2 className="animate-spin" /> : <><MessageSquare className="w-5 h-5" /> Generate Konsep Visual</>}
            </button>
          </form>
          {aiConsultResponse && (
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 max-h-[350px] overflow-y-auto text-left space-y-6 animate-in slide-in-from-bottom-8 shadow-inner custom-scrollbar">
              <p className="text-lg leading-relaxed text-zinc-300 font-light italic whitespace-pre-wrap">{aiConsultResponse}</p>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

const AdminPanel = ({ 
  showAdminModal, setShowAdminModal, isAdminAuthenticated, setIsAdminAuthenticated,
  adminKeyInput, setAdminKeyInput, handleAdminLogin, 
  adminTab, setAdminTab, editingId, setEditingId,
  handleAddItem, newItem, setNewItem, generateAiDescription, isGeneratingDesc,
  portfolioItems, startEdit, deleteItem,
  handleUpdateSiteConfig, siteConfig, setSiteConfig
}) => {
  if (!showAdminModal) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[4rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {!isAdminAuthenticated ? (
          <div className="p-24 text-center space-y-12 flex-1 flex flex-col justify-center">
            <div className="w-24 h-24 bg-red-600/10 rounded-[2rem] flex items-center justify-center text-red-600 mx-auto shadow-2xl"><Lock className="w-12 h-12" /></div>
            <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter">Secure Access</h2>
            <form onSubmit={handleAdminLogin} className="max-w-md mx-auto space-y-6 w-full">
              <input 
                type="password" placeholder="Masukkan Admin Key" 
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-10 py-6 text-center outline-none focus:border-red-600 text-white text-xl"
                value={adminKeyInput} onChange={e => setAdminKeyInput(e.target.value)}
              />
              <button type="submit" className="w-full bg-red-600 py-6 rounded-3xl font-black uppercase tracking-widest text-xs text-white active:scale-95 transition shadow-2xl shadow-red-900/40">Unlock Dashboard</button>
              <button type="button" onClick={() => setShowAdminModal(false)} className="text-zinc-700 text-[10px] uppercase font-black tracking-[0.3em] hover:text-white transition italic">Cancel</button>
            </form>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-72 border-r border-white/5 bg-black/40 p-12 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 mb-12 italic">The Cockpit</h3>
              <button onClick={() => setAdminTab('portfolio')} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-sm font-black transition-all ${adminTab === 'portfolio' ? 'bg-red-600 text-white shadow-2xl' : 'text-zinc-600 hover:text-white'}`}><ImageIcon className="w-5 h-5"/> Portfolio</button>
              <button onClick={() => setAdminTab('media')} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-sm font-black transition-all ${adminTab === 'media' ? 'bg-red-600 text-white shadow-2xl' : 'text-zinc-600 hover:text-white'}`}><Layout className="w-5 h-5"/> Static Media</button>
              <div className="pt-20 border-t border-white/5"><button onClick={() => setIsAdminAuthenticated(false)} className="flex items-center gap-4 text-[10px] font-black text-red-600 uppercase tracking-[0.3em] hover:text-red-400 transition italic"><Lock className="w-4 h-4"/> Logout</button></div>
            </div>

            <div className="flex-1 p-16 overflow-y-auto custom-scrollbar">
              {adminTab === 'portfolio' ? (
                <div className="flex gap-16">
                  <div className="flex-[1.5] space-y-10">
                    <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter text-left">{editingId ? 'Edit Karya' : 'Terbitkan Karya Baru'}</h3>
                    <form onSubmit={handleAddItem} className="space-y-6 text-left">
                      <input type="text" placeholder="Judul Mahakarya" required className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-10 py-6 text-white text-lg outline-none focus:border-red-600 shadow-inner" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                      <div className="grid grid-cols-2 gap-6">
                        <select className="bg-zinc-900 border border-white/10 rounded-[2rem] px-10 py-6 text-white outline-none focus:border-red-600 appearance-none italic font-black text-xs uppercase tracking-widest" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                          <option value="video">Video</option><option value="photo">Photo</option><option value="animation">Animation</option>
                        </select>
                        <input type="url" placeholder="Direct URL Foto" required className="bg-white/5 border border-white/10 rounded-[2rem] px-10 py-6 text-white outline-none focus:border-red-600 shadow-inner" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
                      </div>
                      <div className="space-y-3 relative text-left">
                        <div className="flex justify-between items-center px-4"><label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Storyline</label><button type="button" onClick={generateAiDescription} disabled={isGeneratingDesc} className="text-[10px] font-black uppercase text-red-500 flex items-center gap-2 hover:text-white transition-colors">{isGeneratingDesc ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} AI Assist</button></div>
                        <textarea placeholder="Gunakan asisten AI untuk deskripsi puitis..." required rows="4" className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-10 py-8 text-white outline-none resize-none shadow-inner italic font-light text-lg" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                      </div>
                      <button type="submit" className="w-full bg-red-600 py-8 rounded-[2rem] font-black uppercase text-xs text-white shadow-3xl shadow-red-900/30 active:scale-95 transition-all">Save To Cloud Database</button>
                    </form>
                  </div>
                  <div className="flex-1 space-y-6 text-left">
                    <h4 className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.5em] italic">Archive ({portfolioItems.length})</h4>
                    <div className="grid gap-4 overflow-y-auto pr-4 max-h-[600px] custom-scrollbar">
                      {portfolioItems.map(item => (
                        <div key={item.id} className="flex items-center gap-5 p-5 bg-white/5 rounded-3xl border border-white/5 group hover:border-red-600/30 transition-all duration-500 shadow-xl">
                          <img src={item.image} className="w-14 h-14 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                          <div className="flex-1 min-w-0"><h5 className="font-black truncate text-sm text-white italic group-hover:text-red-500 transition-colors">{item.title}</h5><span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 italic">{item.category}</span></div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => startEdit(item)} className="p-3 text-zinc-600 hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button><button onClick={() => deleteItem(item.id)} className="p-3 text-zinc-600 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl space-y-12 text-left">
                  <div className="space-y-4 text-left"><h3 className="text-4xl font-black italic text-white uppercase tracking-tighter">Global Media</h3><p className="text-zinc-600 text-lg font-light italic">Konfigurasi visual utama website yang tersimpan di server awan.</p></div>
                  <form onSubmit={handleUpdateSiteConfig} className="space-y-10 text-left">
                    <div className="space-y-4 text-left"><label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 px-4">Hero Section Background</label><input type="url" className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-10 py-6 text-white outline-none focus:border-red-600 shadow-inner" value={siteConfig.heroImage} onChange={e => setSiteConfig({...siteConfig, heroImage: e.target.value})} /></div>
                    <div className="space-y-4 text-left"><label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 px-4">About Section Profile</label><input type="url" className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-10 py-6 text-white outline-none focus:border-red-600 shadow-inner" value={siteConfig.aboutImage} onChange={e => setSiteConfig({...siteConfig, aboutImage: e.target.value})} /></div>
                    <button type="submit" className="w-full bg-red-600 py-8 rounded-[2rem] font-black uppercase text-xs text-white shadow-3xl shadow-red-900/30 active:scale-95 transition-all">Update Cloud Config</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * --- APP ROOT ---
 */

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [filter, setFilter] = useState('all');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [user, setUser] = useState(null);
  const [isAiConsultantOpen, setIsAiConsultantOpen] = useState(false);

  // AI States
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [aiConsultQuery, setAiConsultQuery] = useState('');
  const [aiConsultResponse, setAiConsultResponse] = useState('');
  const [isConsulting, setIsConsulting] = useState(false);

  // Firestore States
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [siteConfig, setSiteConfig] = useState({
    heroImage: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1920',
    aboutImage: 'https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?auto=format&fit=crop&w=800'
  });
  
  const [newItem, setNewItem] = useState({ title: '', category: 'video', image: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [adminTab, setAdminTab] = useState('portfolio');

  const ADMIN_PASSWORD = "RFX2026"; 

  // Init Auth
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Sync Cloud
  useEffect(() => {
    if (!user) return;
    const portfolioCol = collection(db, 'artifacts', appId, 'public', 'data', 'portfolio');
    const unsubPortfolio = onSnapshot(portfolioCol, (snapshot) => {
      setPortfolioItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error(err));

    const configDoc = doc(db, 'artifacts', appId, 'public', 'data', 'site_config', 'home');
    const unsubConfig = onSnapshot(configDoc, (docSnap) => {
      if (docSnap.exists()) setSiteConfig(docSnap.data());
    }, (err) => console.error(err));

    return () => { unsubPortfolio(); unsubConfig(); };
  }, [user]);

  // Handlers
  const navigateTo = (page) => {
    if (page === currentPage) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'instant' });
      setIsTransitioning(false);
    }, 400);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminKeyInput === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setAdminKeyInput('');
    } else {
      alert("Admin Key Salah!");
    }
  };

  const generateAiDescription = async () => {
    if (!newItem.title) return alert("Isi judul dulu!");
    setIsGeneratingDesc(true);
    try {
      const prompt = `Buatkan deskripsi sinematik, puitis, maksimal 20 kata untuk karya visual berjudul: "${newItem.title}".`;
      const res = await callGemini(prompt, "Asisten kreatif RFX Visual.");
      setNewItem({ ...newItem, description: res.trim() });
    } catch (err) { console.error(err); } 
    finally { setIsGeneratingDesc(false); }
  };

  const handleAiConsult = async (e) => {
    e.preventDefault();
    if (!aiConsultQuery) return;
    setIsConsulting(true);
    try {
      const prompt = `User ingin saran konsep: "${aiConsultQuery}". Berikan saran puitis & teknis dalam bahasa Indonesia.`;
      const res = await callGemini(prompt, "RFX AI Consultant - Visual Artist Ahli.");
      setAiConsultResponse(res);
    } catch (err) { setAiConsultResponse("API Error."); } 
    finally { setIsConsulting(false); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!user || !isAdminAuthenticated) return;
    const portfolioCol = collection(db, 'artifacts', appId, 'public', 'data', 'portfolio');
    try {
      if (editingId) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'portfolio', editingId), newItem);
        setEditingId(null);
      } else {
        await addDoc(portfolioCol, newItem);
      }
      setNewItem({ title: '', category: 'video', image: '', description: '' });
      setShowAdminModal(false);
    } catch (err) { console.error(err); }
  };

  const deleteItem = async (id) => {
    if (!user || !isAdminAuthenticated) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'portfolio', id)); }
    catch (err) { console.error(err); }
  };

  const startEdit = (item) => {
    setNewItem({ title: item.title, category: item.category, image: item.image, description: item.description });
    setEditingId(item.id);
  };

  const handleUpdateSiteConfig = async (e) => {
    e.preventDefault();
    if (!user || !isAdminAuthenticated) return;
    const configDoc = doc(db, 'artifacts', appId, 'public', 'data', 'site_config', 'home');
    try {
      await setDoc(configDoc, siteConfig);
      alert("Config Updated!");
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-600/30 font-sans tracking-tight overflow-x-hidden custom-scrollbar">
      <style>{`
        @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>
      
      <Navbar 
        navigateTo={navigateTo} 
        currentPage={currentPage} 
        setShowAdminModal={setShowAdminModal} 
        isAdminAuthenticated={isAdminAuthenticated} 
      />
      
      <AdminPanel 
        showAdminModal={showAdminModal} setShowAdminModal={setShowAdminModal}
        isAdminAuthenticated={isAdminAuthenticated} setIsAdminAuthenticated={setIsAdminAuthenticated}
        adminKeyInput={adminKeyInput} setAdminKeyInput={setAdminKeyInput}
        handleAdminLogin={handleAdminLogin}
        adminTab={adminTab} setAdminTab={setAdminTab}
        editingId={editingId} setEditingId={setEditingId}
        handleAddItem={handleAddItem} newItem={newItem} setNewItem={setNewItem}
        generateAiDescription={generateAiDescription} isGeneratingDesc={isGeneratingDesc}
        portfolioItems={portfolioItems} startEdit={startEdit} deleteItem={deleteItem}
        handleUpdateSiteConfig={handleUpdateSiteConfig} siteConfig={siteConfig} setSiteConfig={setSiteConfig}
      />

      <main className={`transition-all duration-[600ms] ease-in-out transform ${isTransitioning ? 'opacity-0 translate-y-8 scale-[0.98] blur-xl' : 'opacity-100 translate-y-0 scale-100 blur-0'}`}>
        {currentPage === 'home' && <HomeView siteConfig={siteConfig} navigateTo={navigateTo} />}
        {currentPage === 'portfolio' && <PortfolioView portfolioItems={portfolioItems} filter={filter} setFilter={setFilter} navigateTo={navigateTo} />}
        {currentPage === 'contact' && (
          <ContactView 
            isAiConsultantOpen={isAiConsultantOpen} setIsAiConsultantOpen={setIsAiConsultantOpen}
            aiConsultQuery={aiConsultQuery} setAiConsultQuery={setAiConsultQuery}
            handleAiConsult={handleAiConsult} isConsulting={isConsulting}
            aiConsultResponse={aiConsultResponse}
          />
        )}
      </main>

      <footer className="py-32 border-t border-white/5 text-center mt-40 bg-black">
        <SectionWrapper>
          <div className="text-3xl font-black italic tracking-tighter mb-8 text-white uppercase italic">RFX<span className="text-red-600">.</span></div>
          <p className="text-[9px] text-zinc-700 uppercase tracking-[0.8em] font-black italic">&copy; 2026 RFX VISUAL • CLOUD INTEGRATED V2.0</p>
          <button onClick={() => setShowAdminModal(true)} className="mt-12 text-[8px] uppercase tracking-[0.5em] text-zinc-900 hover:text-red-600 transition-colors font-black underline underline-offset-8">Terminal Access</button>
        </SectionWrapper>
      </footer>
    </div>
  );
};

export default App;