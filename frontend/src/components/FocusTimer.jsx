import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Zap, Timer as TimerIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import useStore from "../store/useStore";

export default function FocusTimer({ closeModal }) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);
  const { addFocusSession } = useStore();

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
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, minutes, seconds]);

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

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
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
          <div className="flex items-center gap-2 mb-8">
            <Zap size={20} className="text-amber-500 fill-amber-500/20" />
            <h2 className="text-sm font-black tracking-widest uppercase opacity-50">Deep Focus</h2>
          </div>

          {/* Time Display */}
          <div className="relative mb-12 flex flex-col items-center justify-center">
             <div className="text-8xl font-black tracking-tighter flex items-baseline tabular-nums">
                {String(minutes).padStart(2, "0")}
                <span className="text-5xl opacity-30 mx-1">:</span>
                {String(seconds).padStart(2, "0")}
             </div>
             <p className="text-xs font-bold opacity-30 mt-2 uppercase tracking-widest">
                {isActive ? "Flow State Active" : "Ready to Start?"}
             </p>
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
