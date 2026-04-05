import { useState, useEffect } from "react";
import { X, Target, CheckCircle2, Skull } from "lucide-react";
import useStore from "../store/useStore";
import toast from "react-hot-toast";
import canvasConfetti from "canvas-confetti"; // Using window.confetti if we don't have it installed? 
// Wait, we can just use simple styling or rely on the toast. Let's stick to standard UI.

export default function FrogEater({ closeModal }) {
  const { todos, updateTodo } = useStore();
  
  // Find the oldest uncompleted task
  const frogTask = [...todos]
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))[0];

  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes
  const [isFailed, setIsFailed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!frogTask || isFailed || isSuccess) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFailed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [frogTask, isFailed, isSuccess]);

  const handleComplete = async () => {
    if (!frogTask) return;
    setIsSuccess(true);
    await updateTodo(frogTask._id, { completed: true, completedAt: new Date() });
    toast.success("You ate the frog! Amazing job!");
    setTimeout(() => {
      closeModal();
    }, 2000);
  };

  const handleGiveUp = () => {
    setIsFailed(true);
    toast.error("The frog survives another day...");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!frogTask) {
    return (
      <div className="fixed inset-0 bg-emerald-950 flex flex-col items-center justify-center p-5 z-[500] text-emerald-100 animate-in fade-in zoom-in duration-500">
        <Target size={64} className="mb-6 opacity-50" />
        <h2 className="text-3xl font-black mb-4">No Frogs Left!</h2>
        <p className="opacity-70 mb-8 max-w-md text-center">You have completed all pending tasks. Your workspace is perfectly clear.</p>
        <button 
          onClick={closeModal}
          className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all"
        >
          Return Setup
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-emerald-950 flex flex-col items-center justify-center p-5 z-[500] text-emerald-100 animate-in fade-in zoom-in duration-500">
      
      {/* Background pulsing effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      <button
        onClick={closeModal}
        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 hover:rotate-90 transition-all z-10"
      >
        <X size={24} />
      </button>

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        {isSuccess ? (
          <div className="text-center animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <CheckCircle2 size={100} className="text-emerald-400 mx-auto mb-6" />
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-emerald-300 to-green-500 mb-4">
              Frog Eliminated
            </h1>
            <p className="text-xl opacity-80">You tackled your most dreaded task.</p>
          </div>
        ) : isFailed ? (
          <div className="text-center animate-in zoom-in slide-in-from-bottom-8 duration-500">
             <Skull size={100} className="text-red-500 mx-auto mb-6" />
             <h1 className="text-5xl font-black text-red-500 mb-4">Time Expired</h1>
             <p className="text-xl opacity-80">Procrastination wins this round.</p>
             <button 
                onClick={closeModal}
                className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all"
              >
                Retreat to Dashboard
              </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 bg-emerald-500/20 px-4 py-2 rounded-full text-emerald-300 font-bold text-sm tracking-widest uppercase mb-8 border border-emerald-500/30">
              <Target size={18} />
              <span>Anti-Procrastination Mode</span>
            </div>

            <div className="text-9xl md:text-[180px] font-black tracking-tighter tabular-nums leading-none mb-10 text-white drop-shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              {formatTime(timeLeft)}
            </div>

            <div className="bg-emerald-900 border border-emerald-500/30 w-full p-8 rounded-[2rem] text-center mb-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
               <p className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-3">Your Oldest Avoided Task:</p>
               <h2 className="text-3xl font-black text-white">{frogTask.title}</h2>
               {frogTask.priority && (
                 <span className={`inline-block mt-4 px-3 py-1 rounded-full text-xs font-bold uppercase border bg-black/20 ${
                    frogTask.priority === 'high' ? 'border-red-500 text-red-500' :
                    frogTask.priority === 'medium' ? 'border-amber-500 text-amber-500' :
                    'border-blue-500 text-blue-500'
                 }`}>
                   {frogTask.priority} Priority
                 </span>
               )}
            </div>

            <div className="flex flex-col sm:flex-row gap-5 w-full">
              <button
                onClick={handleGiveUp}
                className="px-8 py-4 rounded-2xl font-bold transition-all border-2 border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 flex-1 text-lg"
              >
                Give Up
              </button>
              <button
                onClick={handleComplete}
                className="px-8 py-4 bg-linear-to-r from-emerald-500 to-green-500 text-emerald-950 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/30 flex-[2] text-xl"
              >
                Mark Task Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
