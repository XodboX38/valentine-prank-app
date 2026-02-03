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
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
// Using a direct ESM URL to ensure resolution in environments where local packages are missing
import { Client, Databases } from 'https://esm.sh/appwrite@16.1.0';

// --- Appwrite Initialization & Logic ---
// Credentials are now loaded dynamically via Vite environment variables
const isConfigured = !!(
  import.meta.env.VITE_APPWRITE_ENDPOINT && 
  import.meta.env.VITE_APPWRITE_PROJECT_ID && 
  import.meta.env.VITE_APPWRITE_DATABASE_ID && 
  import.meta.env.VITE_APPWRITE_COLLECTION_ID
);

let client = null;
let databases = null;

if (isConfigured) {
  try {
    client = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
    
    databases = new Databases(client);
  } catch (err) {
    // Fail silently in production, log in dev
    if (import.meta.env.DEV) console.error('Appwrite Initialization Failed:', err);
  }
} else {
  // Notify developer that logging is disabled without breaking the UI
  if (import.meta.env.DEV) {
    console.warn('Appwrite environment variables are missing. Logging is disabled.');
  }
}

/**
 * Creates a new log entry for a generated Valentine link.
 */
async function createValentineLog(data) {
  if (!databases) return null;
  try {
    const response = await databases.createDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_COLLECTION_ID,
      "unique()", // Bypasses internal ID utility dependencies
      {
        ...data,
        wasOpened: false
      }
    );
    return response.$id;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Appwrite Create Document Failed:', error.message);
    return null;
  }
}

/**
 * Updates an existing log entry by documentId.
 */
async function updateValentineLog(documentId, data) {
  if (!databases || !documentId) return null;
  try {
    return await databases.updateDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_COLLECTION_ID,
      documentId,
      data
    );
  } catch (error) {
    if (import.meta.env.DEV) console.error('Appwrite Update Document Failed:', error.message);
    return null;
  }
}

// --- Constants ---
const SUCCESS_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3N4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4ZDN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/KztT2c4u8mYYUiMKdJ/giphy.gif"
  
];

// --- Helpers ---
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

// --- Components ---

const FallingPetals = () => {
  const petals = useMemo(() => Array.from({ length: 25 }), []);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {petals.map((_, i) => (
        <motion.div
          key={i}
          initial={{ top: "-10%", left: `${Math.random() * 100}%`, rotate: Math.random() * 360, opacity: 0.4 + Math.random() * 0.4 }}
          animate={{ top: "110%", left: `${(Math.random() * 100)}%`, rotate: Math.random() * 720 }}
          transition={{ duration: 10 + Math.random() * 15, repeat: Infinity, ease: "linear", delay: Math.random() * 10 }}
          className="absolute"
        >
          <Heart size={16 + Math.random() * 20} className="text-pink-200 fill-pink-200" />
        </motion.div>
      ))}
    </div>
  );
};

const SuccessView = ({ crushName, senderName, docId, startTime }) => {
  const randomGif = useMemo(() => SUCCESS_GIFS[Math.floor(Math.random() * SUCCESS_GIFS.length)], []);
  
  useEffect(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    if (docId && startTime) {
      updateValentineLog(docId, { result: 'yes', timeToDecision: Math.floor((Date.now() - startTime) / 1000) });
    }

    return () => clearInterval(interval);
  }, [docId, startTime]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-4 flex flex-col items-center gap-6">
      <p className="text-xs font-bold text-pink-300 uppercase tracking-widest">Celebrate</p>
      <div className="relative w-full flex justify-center">
        <div className="w-full max-w-[320px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white flex bg-pink-50">
          <img src={randomGif} alt="Celebrate" className="w-full h-auto block object-contain" />
        </div>
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-4 -right-4 bg-white p-2 rounded-full shadow-lg z-20">
          <Heart size={32} className="text-red-500 fill-red-500" />
        </motion.div>
      </div>
      <div className="space-y-2">
        <h2 className="text-4xl font-bold text-pink-600 font-serif flex items-center justify-center gap-2">Yay! <Heart className="fill-pink-600 text-pink-600" size={32} /></h2>
        <p className="text-xl text-gray-700 max-w-xs mx-auto">{crushName}, I knew you'd say yes! You've made my day.</p>
        {senderName && <p className="text-sm text-pink-400 italic mt-2">From {senderName}</p>}
      </div>
      
      <button onClick={() => window.history.pushState({}, '', '/create')} className="mt-4 flex items-center gap-2 text-sm text-pink-400 hover:text-pink-600 transition-colors"><Share2 size={16} /> Create your own</button>
    </motion.div>
  );
};

const PrankNoButton = ({ containerRef, onInteraction }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [clickCount, setClickCount] = useState(0);
  const buttonRef = useRef(null);
  const texts = ["No", "Are you sure?", "Think again", "Last chance", "...okay wow"];
  const isMobile = useMemo(() => /Android|iPhone|iPad/i.test(navigator.userAgent), []);

  const teleport = () => {
    if (isMobile || !containerRef.current || !buttonRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const btn = buttonRef.current.getBoundingClientRect();
    const maxX = (container.width / 2) - (btn.width / 2) - 40;
    const maxY = (container.height / 2) - (btn.height / 2) - 40;
    setPos({ x: (Math.random() - 0.5) * maxX * 2, y: (Math.random() - 0.5) * maxY * 2 });
  };

  const handleInteraction = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (isMobile && onInteraction) {
      onInteraction({ mobileNoTapCount: nextCount, reachedShrinkPhase: nextCount >= texts.length });
    }
    if (!isMobile) teleport();
  };

  const shrinkFactor = isMobile ? Math.max(0, clickCount - (texts.length - 1)) : 0;
  if (isMobile && (1 - shrinkFactor * 0.2) <= 0) return null;

  return (
    <motion.button
      ref={buttonRef} onMouseEnter={teleport} onClick={handleInteraction}
      style={isMobile && clickCount >= texts.length ? { scale: Math.max(0, 1 - shrinkFactor * 0.2), opacity: Math.max(0, 1 - shrinkFactor * 0.2) } : {}}
      animate={{ x: pos.x, y: pos.y }} transition={{ type: 'spring', damping: 15, stiffness: 150 }}
      className="w-full px-8 py-3 bg-gray-100 text-gray-500 rounded-full font-medium shadow-sm hover:bg-gray-200 transition-colors whitespace-nowrap z-50 relative"
    >
      {isMobile ? (clickCount < texts.length ? texts[clickCount] : texts[texts.length - 1]) : "No"}
    </motion.button>
  );
};

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [accepted, setAccepted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const startTime = useRef(Date.now());

  const query = new URLSearchParams(window.location.search);
  const crushName = query.get('to') ? decodeURIComponent(query.get('to')) : null;
  const senderName = query.get('from') ? decodeURIComponent(query.get('from')) : null;
  const docId = query.get('id');

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    const originalPushState = window.history.pushState;
    window.history.pushState = function() { originalPushState.apply(this, arguments); handlePopState(); };
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (docId && crushName && currentPath === '/') {
      updateValentineLog(docId, { wasOpened: true, openedAt: new Date().toISOString(), missingNameStateTriggered: false });
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
    if (currentPath === '/create') return <CreatePage />;
    if (!crushName || crushName.trim() === '') {
      if (docId) updateValentineLog(docId, { missingNameStateTriggered: true });
      return (
        <div className="text-center p-8 flex flex-col items-center gap-6">
          <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}><HeartOff size={80} className="text-red-300" /></motion.div>
          <p className="text-xl text-gray-500 italic max-w-xs leading-relaxed">aww no body want's you as your valentine so sad</p>
          <button onClick={() => window.history.pushState({}, '', '/create')} className="px-6 py-2 bg-pink-500 text-white rounded-full text-sm font-semibold shadow-md">Create a link</button>
        </div>
      );
    }
    if (accepted) return <SuccessView crushName={crushName} senderName={senderName} docId={docId} startTime={startTime.current} />;
    return (
      <div ref={containerRef} className="text-center p-4 space-y-8 relative min-h-[450px] flex flex-col justify-center">
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}><span className="text-8xl">💌</span></motion.div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-800 leading-tight">Will you be my valentine, <span className="text-pink-600 underline decoration-pink-200">{crushName}</span>?</h1>
          {senderName && <p className="text-lg text-pink-400 font-medium italic mt-[-1rem]">From {senderName}</p>}
        </div>
        <div className="flex flex-col gap-3 w-full max-w-[256px] mx-auto relative z-10">
          <button onClick={() => setAccepted(true)} className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-red-600 active:scale-95 transition-all">YES 😍</button>
          <button onClick={() => setAccepted(true)} className="w-full py-3 bg-pink-500 text-white rounded-2xl font-bold shadow-md hover:bg-pink-600 active:scale-95 transition-all">Obviously 💖</button>
          <div className="pt-4 flex justify-center min-h-[60px]"><PrankNoButton containerRef={containerRef} onInteraction={(data) => docId && updateValentineLog(docId, data)} /></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fffafa] flex items-center justify-center p-4 selection:bg-pink-200 overflow-hidden relative">
      <FallingPetals />
      <button onClick={toggleMusic} className="fixed top-6 right-6 p-3 bg-white/80 backdrop-blur rounded-full shadow-lg text-pink-500 z-50">
        {isPlaying ? <Music size={20} className="animate-pulse" /> : <Music2 size={20} className="opacity-40" />}
        <audio ref={audioRef} loop src="https://cdn.pixabay.com/audio/2022/01/21/audio_31742c58a9.mp3" /> 
      </button>
      <main className="w-full max-w-lg z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div key={currentPath + accepted} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-4 sm:p-8 shadow-[0_20px_50px_rgba(255,182,193,0.3)] border border-white">
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

const CreatePage = () => {
  const [senderName, setSenderName] = useState('');
  const [crushName, setCrushName] = useState('');
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  
  const handleCopy = async () => {
    if (isLogging) return;
    setIsLogging(true);
    const device = getDeviceInfo();
    
    // Attempt log creation
    const newId = await createValentineLog({ 
      fromName: senderName.trim(), 
      toName: crushName.trim(), 
      generatedUrl: '', 
      deviceType: device.deviceType, 
      userAgent: device.userAgent, 
      longNameTriggered: crushName.length > 15 
    });

    const baseUrl = `${window.location.origin}${window.location.pathname.replace('/create', '')}`;
    const params = new URLSearchParams({ from: senderName.trim(), to: crushName.trim() });
    if (newId) params.append('id', newId);
    
    const finalUrl = `${baseUrl}?${params.toString()}`;
    
    // Update log with final URL if creation worked
    if (newId) {
      await updateValentineLog(newId, { generatedUrl: finalUrl });
    }

    const textArea = document.createElement("textarea");
    textArea.value = finalUrl; 
    document.body.appendChild(textArea); 
    textArea.select(); 
    document.execCommand('copy'); 
    document.body.removeChild(textArea);
    
    setCopied(true); 
    setShowToast(true); 
    setIsLogging(false);
    setTimeout(() => { setCopied(false); setShowToast(false); }, 2500);
  };

  return (
    <div className="space-y-6 relative">
      <h2 className="text-2xl font-bold text-pink-600 flex items-center gap-2"><LinkIcon size={24} /> Generate Prank Link</h2>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block mb-1">Your Name</label>
          <input type="text" value={senderName} onChange={(e) => setSenderName(capitalize(e.target.value))} placeholder="e.g. Yugal" className="w-full px-4 py-3 rounded-xl border border-pink-100 focus:ring-2 focus:ring-pink-300 outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block mb-1">Your Crush's Name</label>
          <input type="text" value={crushName} onChange={(e) => setCrushName(capitalize(e.target.value))} placeholder="e.g. Crush" className="w-full px-4 py-3 rounded-xl border border-pink-100 focus:ring-2 focus:ring-pink-300 outline-none" />
        </div>
      </div>
      <div className="p-4 bg-pink-50 rounded-xl border border-pink-100 text-sm">
        <p className="text-pink-400 uppercase text-[10px] font-bold tracking-widest mb-1">Preview</p>
        <p className="font-medium">{crushName ? `Will you be my valentine, ${crushName}?` : 'Waiting for crush name...'}</p>
        {senderName && <p className="text-xs text-pink-400 italic mt-1">From {senderName}</p>}
      </div>
      <button onClick={handleCopy} disabled={!crushName || isLogging} className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${crushName && !isLogging ? 'bg-pink-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
        {isLogging ? 'Please wait...' : copied ? 'Link Copied!' : 'Copy Prank Link'}
        {!isLogging && <Copy size={18} />}
      </button>
      <button onClick={() => window.history.pushState({}, '', '/')} className="w-full text-xs text-gray-400 hover:text-pink-400">Cancel</button>

      {/* REFINED NOTIFICATION POPUP */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 30, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, x: "-50%" }} 
            exit={{ opacity: 0, y: 30, x: "-50%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-12 left-1/2 z-[100] pointer-events-none w-full flex justify-center px-6"
          >
            <div className="bg-pink-600/95 text-white px-5 py-3.5 rounded-2xl shadow-[0_15px_40px_rgba(219,39,119,0.4)] flex items-center gap-3 border border-white/20 backdrop-blur-md max-w-[340px] w-full sm:w-auto justify-center">
              <CheckCircle2 size={18} className="text-pink-100 shrink-0" />
              <span className="font-semibold text-sm sm:text-base tracking-tight whitespace-nowrap">
                Send this link to your crush 💌
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};