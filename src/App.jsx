import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  HeartOff, 
  Link as LinkIcon, 
  Copy, 
  Music, 
  Music2, 
  AlertCircle,
  Share2,
  CheckCircle2,
  QrCode,
  MessageCircle,
  RefreshCw,
  Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';
// Using a direct ESM URL to ensure resolution in the browser environment
import { Client, Databases } from 'https://esm.sh/appwrite@16.1.0';

// --- Appwrite Initialization & Logic ---

const safeGetEnv = (key) => {
  try { return import.meta.env[key]; } catch (e) { return undefined; }
};

const isDevMode = () => {
  try { return !!import.meta.env.DEV; } catch (e) { return false; }
};

const VITE_APPWRITE_ENDPOINT = safeGetEnv('VITE_APPWRITE_ENDPOINT');
const VITE_APPWRITE_PROJECT_ID = safeGetEnv('VITE_APPWRITE_PROJECT_ID');
const VITE_APPWRITE_DATABASE_ID = safeGetEnv('VITE_APPWRITE_DATABASE_ID');
const VITE_APPWRITE_COLLECTION_ID = safeGetEnv('VITE_APPWRITE_COLLECTION_ID');

const isConfigured = !!(
  VITE_APPWRITE_ENDPOINT && 
  VITE_APPWRITE_PROJECT_ID && 
  VITE_APPWRITE_DATABASE_ID && 
  VITE_APPWRITE_COLLECTION_ID
);

let client = null;
let databases = null;

if (isConfigured) {
  try {
    client = new Client()
      .setEndpoint(VITE_APPWRITE_ENDPOINT)
      .setProject(VITE_APPWRITE_PROJECT_ID);
    databases = new Databases(client);
  } catch (err) {
    if (isDevMode()) console.error('Appwrite Initialization Failed:', err);
  }
}

/**
 * Modified to accept a documentId so we can use a client-side generated ID
 * as the primary key immediately.
 */
async function createValentineLog(data, documentId = "unique()") {
  if (!databases) return null;
  try {
    const response = await databases.createDocument(
      VITE_APPWRITE_DATABASE_ID,
      VITE_APPWRITE_COLLECTION_ID,
      documentId, 
      { ...data, wasOpened: false }
    );
    return response.$id;
  } catch (error) {
    if (isDevMode()) console.error('Appwrite Create Document Failed:', error.message);
    return null;
  }
}

async function updateValentineLog(documentId, data) {
  if (!databases || !documentId) return null;
  try {
    return await databases.updateDocument(
      VITE_APPWRITE_DATABASE_ID,
      VITE_APPWRITE_COLLECTION_ID,
      documentId,
      data
    );
  } catch (error) {
    if (isDevMode()) console.error('Appwrite Update Document Failed:', error.message);
    return null;
  }
}

// --- Helpers & Logic ---

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad/i.test(ua);
  return {
    deviceType: isMobile ? 'mobile' : 'desktop',
    userAgent: ua
  };
};

const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// --- Obfuscation Helpers ---

const encodePayload = (data) => {
  try {
    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (match, p1) => 
      String.fromCharCode('0x' + p1)
    )).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) { return ''; }
};

const decodePayload = (str) => {
  if (!str) return null;
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(Array.prototype.map.call(atob(base64), (c) => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(json);
  } catch (e) { return null; }
};

// --- Themes ---
const THEMES = {
  pink: {
    bg: "bg-[#fffafa]",
    card: "bg-white",
    accent: "text-pink-600",
    button: "bg-pink-500",
    buttonHover: "hover:bg-pink-600",
    lightAccent: "bg-pink-50",
    border: "border-pink-100"
  },
  red: {
    bg: "bg-[#fff5f5]",
    card: "bg-white",
    accent: "text-red-600",
    button: "bg-red-600",
    buttonHover: "hover:bg-red-700",
    lightAccent: "bg-red-50",
    border: "border-red-100"
  },
  purple: {
    bg: "bg-[#f8f5ff]",
    card: "bg-white",
    accent: "text-purple-600",
    button: "bg-purple-500",
    buttonHover: "hover:bg-purple-600",
    lightAccent: "bg-purple-50",
    border: "border-purple-100"
  }
};

// --- Constants ---
const SUCCESS_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3N4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/KztT2c4u8mYYUiMKdJ/giphy.gif"
  
];

// --- Utility Components ---

const QRCodeDisplay = ({ url, theme }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-inner">
      <img src={qrUrl} alt="QR Code" className="w-40 h-40" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Scan to Open Link</p>
    </motion.div>
  );
};

// --- Core App ---

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [accepted, setAccepted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [themeKey, setThemeKey] = useState('pink');
  const [toast, setToast] = useState(null); // Centralized Toast State
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const startTime = useRef(Date.now());

  const theme = THEMES[themeKey];

  // Pick theme on load
  useEffect(() => {
    const saved = localStorage.getItem('v-theme');
    if (saved && THEMES[saved]) {
      setThemeKey(saved);
    } else {
      const keys = Object.keys(THEMES);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      setThemeKey(randomKey);
      localStorage.setItem('v-theme', randomKey);
    }
  }, []);

  const query = new URLSearchParams(window.location.search);
  const v = query.get('v');
  const payload = useMemo(() => decodePayload(v), [v]);
  const crushName = payload?.to || (query.get('to') ? decodeURIComponent(query.get('to')) : null);
  const senderName = payload?.from || (query.get('from') ? decodeURIComponent(query.get('from')) : null);
  const docId = payload?.id || query.get('id');

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    const originalPushState = window.history.pushState;
    window.history.pushState = function() { originalPushState.apply(this, arguments); handlePopState(); };
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (docId && crushName && currentPath === '/') {
      updateValentineLog(docId, { wasOpened: true, openedAt: new Date().toISOString() });
    }
  }, [docId, crushName, currentPath]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  const renderContent = () => {
    if (currentPath === '/create') return <CreatePage theme={theme} setToast={setToast} />;
    if (!crushName || crushName.trim() === '') {
      return (
        <div className="text-center p-8 flex flex-col items-center gap-6">
          <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}><HeartOff size={80} className="text-red-300" /></motion.div>
          <p className="text-xl text-gray-500 italic max-w-xs leading-relaxed">aww nobody invited you yet?</p>
          <button onClick={() => window.history.pushState({}, '', '/create')} className={`px-6 py-2 ${theme.button} text-white rounded-full text-sm font-semibold shadow-md`}>Create a link</button>
        </div>
      );
    }
    if (accepted) return <SuccessView crushName={crushName} senderName={senderName} docId={docId} startTime={startTime.current} theme={theme} setToast={setToast} />;
    
    return (
      <div ref={containerRef} className="text-center p-4 space-y-8 relative min-h-[450px] flex flex-col justify-center">
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}><span className="text-8xl">💌</span></motion.div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-800 leading-tight">Will you be my valentine, <span className={`${theme.accent} underline decoration-pink-200`}>{crushName}</span>?</h1>
          {senderName && <p className={`text-lg ${theme.accent} opacity-70 font-medium italic mt-[-1rem]`}>From {senderName}</p>}
        </div>
        <div className="flex flex-col gap-3 w-full max-w-[256px] mx-auto relative z-10">
          <button onClick={() => setAccepted(true)} className={`w-full py-4 ${theme.button} text-white rounded-2xl font-bold text-lg shadow-lg ${theme.buttonHover} active:scale-95 transition-all`}>YES 😍</button>
          <button onClick={() => setAccepted(true)} className={`w-full py-3 bg-white ${theme.accent} border-2 ${theme.border} rounded-2xl font-bold shadow-md active:scale-95 transition-all`}>Obviously 💖</button>
          <div className="pt-4 flex justify-center min-h-[60px]"><PrankNoButton containerRef={containerRef} onInteraction={(data) => docId && updateValentineLog(docId, data)} theme={theme} /></div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4 selection:bg-pink-200 overflow-hidden relative transition-colors duration-700`}>
      <FallingPetals theme={theme} />
      <button onClick={toggleMusic} className="fixed top-6 right-6 p-3 bg-white/80 backdrop-blur rounded-full shadow-lg text-pink-500 z-50">
        {isPlaying ? <Music size={20} className="animate-pulse" /> : <Music2 size={20} className="opacity-40" />}
        <audio ref={audioRef} loop src="https://cdn.pixabay.com/audio/2022/01/21/audio_31742c58a9.mp3" /> 
      </button>
      <main className="w-full max-w-lg z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div key={currentPath + accepted} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`${theme.card} backdrop-blur-md rounded-[2.5rem] p-4 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border ${theme.border}`}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Truly Centered Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 30, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, x: "-50%" }} 
            exit={{ opacity: 0, y: 30, x: "-50%" }} 
            className="fixed bottom-12 left-1/2 z-[100] bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl border border-white/10 w-max max-w-[90vw] text-center"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SuccessView = ({ crushName, senderName, docId, startTime, theme, setToast }) => {
  const [revealed, setRevealed] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const randomGif = useMemo(() => SUCCESS_GIFS[Math.floor(Math.random() * SUCCESS_GIFS.length)], []);
  
  useEffect(() => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    const timer = setTimeout(() => setRevealed(true), 2500);
    if (docId && startTime) {
      updateValentineLog(docId, { result: 'yes', timeToDecision: Math.floor((Date.now() - startTime) / 1000) });
    }
    return () => clearTimeout(timer);
  }, []);

  const handleReshare = async () => {
    // Role reversal logic
    const v = encodePayload({ from: crushName, to: senderName, id: null });
    const url = `${window.location.origin}/?v=${v}`;
    
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Turn!', text: `Hey ${senderName}, now it's my turn to ask...`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setToast("New link ready to share 💌");
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      // Handle silent share cancelations
    }
  };

  const handleWhatsApp = () => {
    const v = encodePayload({ from: crushName, to: senderName, id: null });
    const url = `${window.location.origin}/?v=${v}`;
    const text = encodeURIComponent(`Hey ${senderName}! You asked, and I said YES! Now I have a question for you... 💖 ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const toggleScreenshotMode = () => {
    setIsScreenshotMode(!isScreenshotMode);
  };

  return (
    <div 
      className="flex flex-col items-center gap-6 relative" 
      onClick={() => isScreenshotMode && setIsScreenshotMode(false)}
    >
      {/* Screenshot Mode Tip */}
      <AnimatePresence>
        {isScreenshotMode && (
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute -top-10 text-[10px] font-bold uppercase tracking-widest text-gray-400 animate-pulse"
          >
            Click anywhere to exit capture mode
          </motion.p>
        )}
      </AnimatePresence>

      {/* Screenshot Optimized Success Card */}
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`w-full ${theme.lightAccent} p-6 rounded-[2rem] border-2 border-dashed ${theme.border} relative overflow-hidden`}>
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <div className="w-full max-w-[280px] rounded-3xl overflow-hidden shadow-xl border-4 border-white flex bg-white">
            <img src={randomGif} alt="Celebrate" className="w-full h-auto" />
          </div>

          <div className="min-h-[120px] flex flex-col justify-center">
            <AnimatePresence>
              {revealed ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <h2 className={`text-4xl font-bold ${theme.accent} font-serif flex items-center justify-center gap-2`}>
                    Yay! <Heart className={`fill-current`} size={32} />
                  </h2>
                  <p className="text-xl text-gray-700 font-medium">
                    {crushName}, I knew you'd say yes! 
                  </p>
                  {senderName && (
                    <p className="text-sm text-gray-500 opacity-60 italic">
                      From {senderName}
                    </p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">You've made my day perfect.</p>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, delay: i * 0.2 }} className={`w-2 h-2 rounded-full ${theme.button}`} />
                    ))}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Waiting for it...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <Heart className="absolute -bottom-10 -left-10 text-white/20 w-40 h-40" />
      </motion.div>

      {!isScreenshotMode && (
        <>
          <div className="w-full grid grid-cols-2 gap-3 mt-2">
            <button onClick={handleReshare} className={`flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-700 text-sm font-bold border border-gray-100 hover:bg-gray-100 transition-all`}>
              <RefreshCw size={16} /> Reshare
            </button>
            <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-sm font-bold shadow-md active:scale-95 transition-all">
              <MessageCircle size={16} /> WhatsApp
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <button onClick={(e) => { e.stopPropagation(); setShowQR(!showQR); }} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">
              <QrCode size={20} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleScreenshotMode(); }} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">
              <Camera size={20} />
            </button>
            <button onClick={() => window.history.pushState({}, '', '/create')} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:underline">Create New Link</button>
          </div>

          {showQR && <QRCodeDisplay url={window.location.href} theme={theme} />}
        </>
      )}
    </div>
  );
};

const CreatePage = ({ theme, setToast }) => {
  const [senderName, setSenderName] = useState('');
  const [crushName, setCrushName] = useState('');
  
  const handleShare = async () => {
    if (!crushName.trim()) return;
    
    // 1. Generate a temporary client-side ID immediately
    const tempId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

    // 2. Build the encoded URL immediately
    const baseUrl = window.location.origin;
    const v = encodePayload({ from: senderName.trim(), to: crushName.trim(), id: tempId });
    const finalUrl = `${baseUrl}/?v=${v}`;
    
    // 3. Fire-and-forget logging to Appwrite in the background
    const device = getDeviceInfo();
    createValentineLog({ 
      fromName: senderName.trim(), 
      toName: crushName.trim(), 
      deviceType: device.deviceType, 
      userAgent: device.userAgent,
      generatedUrl: finalUrl
    }, tempId);

    // 4. Immediate UX Response: Trigger share or copy instantly
    if (navigator.share) {
      navigator.share({
        title: 'Valentine Question',
        text: `Hey ${crushName}, I have a question for you...`,
        url: finalUrl
      }).catch(() => {}); // Handle cancel without blocking
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = finalUrl;
      textArea.style.position = "fixed"; textArea.style.left = "-9999px";
      textArea.setAttribute("readonly", ""); document.body.appendChild(textArea);
      textArea.focus(); textArea.select(); textArea.setSelectionRange(0, 99999);
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    
    // 5. Show success feedback immediately
    setToast("Link Generated! Send it to them 💌");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${theme.accent} flex items-center gap-2`}><LinkIcon size={24} /> Create a Prank</h2>
      <div className="space-y-4">
        <div>
          <label className={`text-[10px] font-bold ${theme.accent} uppercase tracking-widest block mb-1 opacity-60`}>Your Name</label>
          <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="e.g. Yugal" className={`w-full px-4 py-3 rounded-xl border ${theme.border} focus:ring-2 focus:ring-pink-300 outline-none`} />
        </div>
        <div>
          <label className={`text-[10px] font-bold ${theme.accent} uppercase tracking-widest block mb-1 opacity-60`}>Their Name</label>
          <input type="text" value={crushName} onChange={(e) => setCrushName(e.target.value)} placeholder="e.g. Crush" className={`w-full px-4 py-3 rounded-xl border ${theme.border} focus:ring-2 focus:ring-pink-300 outline-none`} />
        </div>
      </div>
      <button onClick={handleShare} disabled={!crushName} className={`w-full py-4 ${theme.button} text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50`}>
        {navigator.share ? 'Send Prank Link' : 'Copy Prank Link'}
        <Share2 size={18} />
      </button>
      <button onClick={() => window.history.pushState({}, '', '/')} className="w-full text-xs text-gray-400 hover:underline">Back</button>
    </div>
  );
};

const PrankNoButton = ({ containerRef, onInteraction, theme }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [clickCount, setClickCount] = useState(0); // Phase 2: Shrink factor
  const [textIndex, setTextIndex] = useState(0); // Phase 1: Text cycling
  const buttonRef = useRef(null);
  const isMobile = useMemo(() => {
    const ua = navigator.userAgent;
    return /Android|iPhone|iPad/i.test(ua);
  }, []);

  const NO_TEXTS = ["No", "Are you sure?", "Think again", "Last chance", "...okay wow"];

  const teleport = () => {
    if (isMobile || !containerRef.current || !buttonRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const btn = buttonRef.current.getBoundingClientRect();
    const maxX = (container.width / 2) - (btn.width / 2) - 40;
    const maxY = (container.height / 2) - (btn.height / 2) - 40;
    setPos({ x: (Math.random() - 0.5) * maxX * 2, y: (Math.random() - 0.5) * maxY * 2 });
  };

  const handleInteraction = () => {
    if (isMobile) {
      // Phase 1: Cycle text until the end
      if (textIndex < NO_TEXTS.length - 1) {
        setTextIndex(prev => prev + 1);
      } else {
        // Phase 2: Start shrinking
        setClickCount(prev => prev + 1);
      }
    } else {
      setClickCount(prev => prev + 1);
      teleport();
    }
    
    if (onInteraction) onInteraction({ count: clickCount + textIndex + 1 });
  };

  const currentScale = isMobile 
    ? (textIndex === NO_TEXTS.length - 1 ? Math.max(0, 1 - clickCount * 0.2) : 1)
    : 1;

  // Fully remove from DOM when invisible
  if (currentScale <= 0) return null;

  return (
    <motion.button
      ref={buttonRef} 
      onMouseEnter={!isMobile ? teleport : undefined} 
      onClick={handleInteraction}
      animate={{ 
        x: pos.x, 
        y: pos.y, 
        scale: currentScale
      }}
      transition={{ type: "spring", damping: 15, stiffness: 150 }}
      className="w-full px-8 py-3 bg-gray-100 text-gray-500 rounded-full font-medium shadow-sm active:scale-90 transition-all z-50 relative"
    >
      {isMobile ? NO_TEXTS[textIndex] : "No"}
    </motion.button>
  );
};

const FallingPetals = ({ theme }) => {
  const petals = useMemo(() => Array.from({ length: 20 }), []);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {petals.map((_, i) => (
        <motion.div
          key={i}
          initial={{ top: "-10%", left: `${Math.random() * 100}%`, rotate: Math.random() * 360, opacity: 0.2 }}
          animate={{ top: "110%", left: `${(Math.random() * 100)}%`, rotate: Math.random() * 720 }}
          transition={{ duration: 10 + Math.random() * 15, repeat: Infinity, ease: "linear", delay: Math.random() * 10 }}
          className="absolute"
        >
          <Heart size={16 + Math.random() * 20} className={`${theme.accent} fill-current opacity-20`} />
        </motion.div>
      ))}
    </div>
  );
};