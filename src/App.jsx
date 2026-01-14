import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, addDoc, 
  deleteDoc, onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Instagram, Youtube, Mail, ArrowRight, ChevronLeft, 
  ExternalLink, Trash2, Edit3, X, Lock, Unlock, Sparkles, 
  MessageSquare, Loader2, Camera, Play, Palette, Github, Twitter, Heart, Share2,
  Layout, Image as ImageIcon, Save, Menu
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDdQfQAxvkfsAW64rF2Ku0c0o1mJXt_b8w",
  authDomain: "rfx-visual-world.firebaseapp.com",
  projectId: "rfx-visual-world",
  storageBucket: "rfx-visual-world.firebasestorage.app",
  messagingSenderId: "212260328761",
  appId: "1:212260328761:web:d07cb234027ac977e844e8",
  measurementId: "G-5D57C15ENN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ID Project untuk Database
const appId = 'rfx-visual-world';

const App = () => {
  const [halamanAktif, setHalamanAktif] = useState('beranda');
  const [menuMobileBuka, setMenuMobileBuka] = useState(false);
  const [modalAdminBuka, setModalAdminBuka] = useState(false);
  const [statusAdmin, setStatusAdmin] = useState(false);
  const [inputKunciAdmin, setInputKunciAdmin] = useState('');
  const [pengguna, setPengguna] = useState(null);
  const [daftarKarya, setDaftarKarya] = useState([]);
  
  // AI State
  const [modalAiBuka, setModalAiBuka] = useState(false);
  const [kueriAi, setKueriAi] = useState('');
  const [responAi, setResponAi] = useState('');
  const [sedangKonsultasi, setSedangKonsultasi] = useState(false);

  // Form State
  const [itemBaru, setItemBaru] = useState({ title: '', category: 'video', image: '', description: '' });
  const [idEdit, setIdEdit] = useState(null);

  // Auth Observer
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setPengguna(user));
  }, []);

  // Fetch Data
  useEffect(() => {
    const path = `artifacts/${appId}/public/data/portfolio`;
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      setDaftarKarya(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const tanganiLoginAdmin = async (e) => {
    e.preventDefault();
    if (inputKunciAdmin === 'RFX2024') {
      await signInAnonymously(auth);
      setStatusAdmin(true);
      alert("Akses Admin Diterima!");
    } else {
      alert("Kunci Salah!");
    }
  };

  const tanganiSimpanKarya = async (e) => {
    e.preventDefault();
    if (!statusAdmin) { alert("Login Admin Dulu!"); return; }
    
    try {
      const path = `artifacts/${appId}/public/data/portfolio`;
      if (idEdit) {
        await setDoc(doc(db, path, idEdit), itemBaru);
        setIdEdit(null);
      } else {
        await addDoc(collection(db, path), itemBaru);
      }
      setItemBaru({ title: '', category: 'video', image: '', description: '' });
      alert("Berhasil disimpan ke Cloud!");
    } catch (err) { alert("Gagal: " + err.message); }
  };

  const tanganiAi = async (e) => {
  e.preventDefault();
  if (!kueriAi.trim()) return;

  setSedangKonsultasi(true);
  setResponAi(""); // Reset jawaban

  const API_KEY = "AIzaSyC5q0-1AMLX6GI8UXIAnwP-53oSWjWJhpk"; 

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: `Kamu adalah asisten videografer profesional untuk RFX Visual. 
                     Jawab pertanyaan ini dengan singkat dan gaya yang keren: ${kueriAi}` 
            }]
          }]
        })
      }
    );

    const data = await response.json();
    const hasilAi = data.candidates[0].content.parts[0].text;
    setResponAi(hasilAi);
  } catch (err) {
    console.error(err);
    setResponAi("Waduh, koneksi ke otak AI lagi gangguan nih. Coba lagi ya!");
  } finally {
    setSedangKonsultasi(false);
  }
};

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600">
      
      {/* NAVIGASI REVISI (MOBILE FRIENDLY) */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center rotate-3">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">RFX.VISUAL</span>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold tracking-[0.3em] uppercase">
            {['beranda', 'karya', 'layanan'].map((m) => (
              <button key={m} onClick={() => setHalamanAktif(m)} className={halamanAktif === m ? 'text-red-600' : 'text-zinc-500 hover:text-white'}>{m}</button>
            ))}
            <button onClick={() => setModalAdminBuka(true)} className="p-2 bg-white/5 rounded-full hover:bg-red-600 transition-all">
              <Lock className="w-4 h-4" />
            </button>
          </div>

          {/* Menu Mobile Button */}
          <button className="md:hidden p-2" onClick={() => setMenuMobileBuka(!menuMobileBuka)}>
            {menuMobileBuka ? <X /> : <Menu />}
          </button>
        </div>

        {/* Dropdown Mobile */}
        {menuMobileBuka && (
          <div className="md:hidden bg-zinc-950 border-b border-white/10 p-6 flex flex-col gap-4 animate-in slide-in-from-top">
            {['beranda', 'karya', 'layanan'].map((m) => (
              <button key={m} onClick={() => {setHalamanAktif(m); setMenuMobileBuka(false)}} className="text-3xl font-black uppercase text-left">{m}</button>
            ))}
            <button onClick={() => setModalAdminBuka(true)} className="flex items-center gap-2 text-red-600 font-bold uppercase py-4">
              <Lock className="w-5 h-5" /> Admin Panel
            </button>
          </div>
        )}
      </nav>

      {/* KONTEN UTAMA */}
      <main className="pt-32 px-6 md:px-20 max-w-7xl mx-auto">
        {halamanAktif === 'beranda' && (
          <div className="py-20">
            <h1 className="text-6xl md:text-[12rem] font-black leading-none tracking-tighter italic uppercase">
              Visual <br /> <span className="text-red-600">World</span>
            </h1>
            <p className="mt-10 text-zinc-500 max-w-xl text-lg md:text-2xl leading-relaxed">
              Muhammad Ridho Febriyansyah. <br />Professional Videographer & Editor based in Malang.
            </p>
            <button 
              onClick={() => setModalAiBuka(true)}
              className="mt-12 flex items-center gap-4 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-red-600 hover:text-white transition-all group"
            >
              <Sparkles className="w-5 h-5" /> TANYA AI ASISTEN
            </button>
          </div>
        )}

        {halamanAktif === 'karya' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-20">
            {daftarKarya.map((karya) => (
              <div key={karya.id} className="group relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-white/5">
                <img src={karya.image || "https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=2000&auto=format&fit=crop"} alt={karya.title} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black to-transparent">
                  <h3 className="text-3xl font-black uppercase italic">{karya.title}</h3>
                  <p className="text-zinc-400 mt-2">{karya.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL AI */}
      {modalAiBuka && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-900 w-full max-w-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase flex items-center gap-3">
                <Sparkles className="text-red-600" /> RFX AI ASISTEN
              </h2>
              <button onClick={() => setModalAiBuka(false)}><X /></button>
            </div>
            <form onSubmit={tanganiAi} className="space-y-4">
              <input 
                value={kueriAi} 
                onChange={(e) => setKueriAi(e.target.value)}
                placeholder="Tanya soal konsep video bromo..." 
                className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none focus:border-red-600 transition-all"
              />
              <button type="submit" className="w-full bg-red-600 p-4 rounded-xl font-bold uppercase">
                {sedangKonsultasi ? 'Berpikir...' : 'Kirim Pertanyaan'}
              </button>
            </form>
            {responAi && (
              <div className="mt-8 p-6 bg-black rounded-2xl border-l-4 border-red-600 italic text-zinc-300 leading-relaxed">
                {responAi}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANEL ADMIN Sederhana */}
      {modalAdminBuka && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-zinc-900 w-full max-w-xl rounded-t-[3rem] md:rounded-[3rem] p-10 border border-white/10 shadow-2xl overflow-hidden">
            {!statusAdmin ? (
              <form onSubmit={tanganiLoginAdmin} className="space-y-6">
                <h2 className="text-4xl font-black uppercase italic">Admin <span className="text-red-600">Access</span></h2>
                <input 
                  type="password" 
                  placeholder="Kunci Rahasia" 
                  className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none"
                  value={inputKunciAdmin}
                  onChange={(e) => setInputKunciAdmin(e.target.value)}
                />
                <button className="w-full bg-red-600 p-5 rounded-2xl font-black uppercase tracking-widest">Akses Kokpit</button>
                <button onClick={() => setModalAdminBuka(false)} className="w-full text-zinc-500 uppercase text-xs font-bold">Batal</button>
              </form>
            ) : (
              <form onSubmit={tanganiSimpanKarya} className="space-y-4">
                <h2 className="text-2xl font-black uppercase mb-6">Tambah Karya Baru</h2>
                <input placeholder="Judul Karya (Contoh: Bromo Cinematic)" className="w-full bg-black p-4 rounded-xl border border-white/5" value={itemBaru.title} onChange={(e) => setItemBaru({...itemBaru, title: e.target.value})} />
                <input placeholder="Link Gambar/Thumbnail" className="w-full bg-black p-4 rounded-xl border border-white/5" value={itemBaru.image} onChange={(e) => setItemBaru({...itemBaru, image: e.target.value})} />
                <textarea placeholder="Deskripsi Singkat" className="w-full bg-black p-4 rounded-xl border border-white/5" value={itemBaru.description} onChange={(e) => setItemBaru({...itemBaru, description: e.target.value})} />
                <button className="w-full bg-green-600 p-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3">
                  <Save className="w-5 h-5" /> Simpan ke Cloud
                </button>
                <button onClick={() => setStatusAdmin(false)} className="w-full text-zinc-500 text-xs py-4">LOGOUT</button>
                <button onClick={() => setModalAdminBuka(false)} className="w-full bg-white/5 p-4 rounded-xl font-bold uppercase">Tutup</button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default App;