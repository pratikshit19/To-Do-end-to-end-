import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Zap, Timer as TimerIcon, X, Users } from "lucide-react";
import toast from "react-hot-toast";
import useStore from "../store/useStore";

export default function FocusTimer({ closeModal }) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);
  const { addFocusSession, focusSessions, dailyFocusTarget, isPro } = useStore();
  const buddyCode = localStorage.getItem("buddyCode");
  
  const [selectedSound, setSelectedSound] = useState(null);
  const audioRef = useRef(null);
  
  const sounds = [
    { id: 'rain', name: 'Real Rainstorm', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_1e1cf906e5.mp3' },
    { id: 'nature', name: 'Deep Nature', url: 'https://cdn.pixabay.com/audio/2025/02/03/audio_7599bcb342.mp3' },
    { id: 'lofi', name: 'Lofi Focus', url: 'https://cdn.pixabay.com/audio/2026/02/09/audio_42f493ea02.mp3' }
  ];

  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          handleComplete();
        }
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, minutes, seconds]);

  // Dedicated Audio Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (selectedSound) {
      const sound = sounds.find(s => s.id === selectedSound);
      if (sound) {
        try {
          if (!audioRef.current) {
            audioRef.current = document.createElement('audio');
            audioRef.current.loop = true;
          }
          if (audioRef.current.src !== sound.url) {
            audioRef.current.src = sound.url;
          }
          
          if (isActive) {
            audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
          } else {
            // This handles the "Preview on Toggle" requirement
            // If the user just changed the sound, we play it briefly or let it stay playing 
            // until the timer logic (which might be in another effect or next tick) kicks in.
            // But to satisfy "starts and stops" synchronization, we should pause if not active.
            audioRef.current.pause();
          }
        } catch (err) {
          console.error("Audio initialization failed", err);
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isActive, selectedSound]);

  // Separate effect to handle instant preview when toggling sound
  useEffect(() => {
    if (selectedSound && !isActive && audioRef.current) {
      audioRef.current.play().catch(e => console.warn("Preview play blocked", e));
    }
  }, [selectedSound]);

  const handleComplete = async () => {
    setIsActive(false);
    clearInterval(intervalRef.current);
    
    const duration = initialMinutes;
    await addFocusSession(duration);
    
    toast.success(`Focus session complete! +${duration} mins`, {
      icon: '🔥',
      duration: 5000
    });
    
    resetTimer();
  };

  const toggleTimer = () => {
     if (isActive && buddyCode) {
        toast.error(`Accountability Warning: Your buddy ${buddyCode} is still working. Don't quit!`, { icon: "👀" });
     }
     setIsActive(!isActive);
  };

  const resetTimer = () => {
    if (isActive && buddyCode) {
       toast.error(`Warning: ${buddyCode} will see you gave up early!`, { icon: "🚨" });
    }
    setIsActive(false);
    setMinutes(initialMinutes);
    setSeconds(0);
  };

  const changeDuration = (m) => {
    if (isActive) return;
    setInitialMinutes(m);
    setMinutes(m);
    setSeconds(0);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-sm bg-(--card-bg) rounded-[3rem] p-8 shadow-2xl border border-(--border)/60 relative overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={closeModal}
          className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center hover:bg-(--border)/30 transition-colors opacity-60 hover:opacity-100"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={20} className="text-amber-500 fill-amber-500/20" />
            <h2 className="text-sm font-black tracking-widest uppercase opacity-50">Deep Focus</h2>
          </div>
          
          {buddyCode && (
             <div className="flex items-center gap-2 mb-6 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full animate-in fade-in duration-500">
               <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
               <Users size={12} className="text-cyan-500" />
               <span className="text-[10px] font-bold text-cyan-500 tracking-widest uppercase">Live with {buddyCode}</span>
             </div>
          )}

          {/* Progress Ring (Pro Feature) */}
          <div className="relative mb-8 group">
             <div className="absolute inset-0 flex items-center justify-center -rotate-90">
                <svg className="w-64 h-64">
                   <circle
                      cx="128"
                      cy="128"
                      r="120"
                      className="stroke-(--border)/20 fill-none"
                      strokeWidth="4"
                   />
                   <circle
                      cx="128"
                      cy="128"
                      r="120"
                      style={{
                        strokeDasharray: '754',
                        strokeDashoffset: (754 - (754 * Math.min(1, (focusSessions.reduce((a,b)=>a+b.duration,0) / dailyFocusTarget))))
                      }}
                      className="stroke-(--accent) fill-none transition-all duration-1000"
                      strokeWidth="4"
                      strokeLinecap="round"
                   />
                </svg>
             </div>
             
             {/* Time Display */}
             <div className="relative flex flex-col items-center justify-center h-64 w-64">
                <div className="text-7xl font-black tracking-tighter flex items-baseline tabular-nums">
                   {String(minutes).padStart(2, "0")}
                   <span className="text-4xl opacity-30 mx-0.5">:</span>
                   {String(seconds).padStart(2, "0")}
                </div>
                <div className="flex flex-col items-center gap-1 mt-1">
                   <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">
                      {isActive ? "Zone Locked" : "Target: " + dailyFocusTarget + "m"}
                   </p>
                </div>
             </div>
          </div>

          {/* Sound Selector */}
          <div className="flex gap-2 mb-8 bg-(--bg) p-1 rounded-2xl border border-(--border)/50">
             {sounds.map(s => (
                <button
                   key={s.id}
                   onClick={() => setSelectedSound(selectedSound === s.id ? null : s.id)}
                   className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider
                      ${selectedSound === s.id ? 'bg-(--accent) text-white shadow-lg shadow-(--accent)/20' : 'opacity-40 hover:opacity-100'}
                   `}
                >
                   {s.name}
                </button>
             ))}
          </div>

          {/* Presets */}
          {!isActive && (
             <div className="flex gap-2 mb-10">
                {[15, 25, 45].map(m => (
                   <button 
                    key={m}
                    onClick={() => changeDuration(m)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${initialMinutes === m ? 'bg-(--accent) text-white' : 'bg-(--border)/30 opacity-60 hover:opacity-100'}`}
                   >
                     {m}m
                   </button>
                ))}
             </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-6">
             <button 
              onClick={resetTimer}
              className="w-14 h-14 rounded-2xl flex items-center justify-center border border-(--border)/50 hover:bg-(--border)/30 transition-all text-(--text-secondary) opacity-60 hover:opacity-100 active:scale-95"
             >
                <RotateCcw size={24} />
             </button>

             <button 
              onClick={toggleTimer}
              className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-xl active:scale-90 ${isActive ? 'bg-(--card-bg) border-4 border-(--accent) text-(--accent)' : 'bg-linear-to-br from-(--gradient-start) to-(--gradient-end) text-white shadow-(--gradient-start)/30'}`}
             >
                {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
             </button>

             <div className="w-14 h-14" /> {/* Spacer */}
          </div>
        </div>

        {/* Decorative elements */}
        <div className={`absolute bottom-[-50px] left-[-50px] w-40 h-40 rounded-full blur-[60px] pointer-events-none transition-all duration-1000 ${isActive ? 'bg-amber-500/20 scale-150' : 'bg-(--gradient-start)/10'}`}></div>
      </div>
    </div>
  );
}
