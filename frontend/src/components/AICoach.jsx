import { useState, useEffect } from "react";
import { Sparkles, Brain, History, ArrowRight, Zap, Target, Flame, Trash2, Calendar, Lock } from "lucide-react";
import useStore from "../store/useStore";
import toast from "react-hot-toast";

export default function AICoach() {
  const { audits, fetchAudits, generateAudit, isPro, setShowPricingModal } = useStore();
  const [loading, setLoading] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);

  useEffect(() => {
    if (isPro) fetchAudits();
  }, [isPro, fetchAudits]);

  useEffect(() => {
    if (audits.length > 0 && !selectedAudit) {
      setSelectedAudit(audits[0]);
    }
  }, [audits, selectedAudit]);

  const handleGenerate = async () => {
    if (!isPro) {
      return setShowPricingModal(true);
    }
    setLoading(true);
    const toastId = toast.loading("Consulting with AI Coach...");
    try {
      const res = await generateAudit();
      if (res.success) {
        toast.success("New Audit Prepared!", { id: toastId });
        setSelectedAudit(res.audit);
      } else {
        toast.error(res.message, { id: toastId });
      }
    } catch (err) {
      toast.error("Connection failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/10 border border-indigo-500/20">
          <Lock size={48} />
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tighter">Personal AI Coach</h1>
        <p className="text-lg font-medium opacity-60 max-w-sm mb-10 leading-relaxed">
          Unlock Behavioral Auditing. Let AI analyze your focus patterns and give you professional productivity advice.
        </p>
        <button
          onClick={() => setShowPricingModal(true)}
          className="px-10 py-4 bg-linear-to-r from-indigo-500 to-purple-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all uppercase tracking-widest text-xs"
        >
          Upgrade to TaskFlow Pro
        </button>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 md:pb-6 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-indigo-500 fill-indigo-500/20" />
            <p className="text-xs font-black tracking-[0.2em] uppercase opacity-40">Performance Lab</p>
          </div>
          <h1 className="text-4xl font-black tracking-tighter">AI Productivity Coach</h1>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-3 px-8 py-4 bg-linear-to-br from-indigo-600 to-purple-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Brain size={20} />
          )}
          <span>{loading ? "Analyzing..." : "Generate New Audit"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Main Audit Display */}
        <div className="lg:col-span-2 space-y-8">
          {selectedAudit ? (
            <div className="bg-(--card-bg) rounded-[3rem] p-10 border border-(--border)/60 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Brain size={200} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                    {new Date(selectedAudit.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-(--border)" />
                  <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">
                    30-Day Analysis
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  {selectedAudit.content.split('\n').map((line, i) => {
                    if (line.startsWith('**') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
                      return <h3 key={i} className="text-xl font-black mt-8 mb-4 text-(--text-primary)">{line.replace(/\*\*/g, '')}</h3>
                    }
                    if (line.startsWith('-')) {
                      return (
                        <div key={i} className="flex gap-4 mb-4 items-start group">
                          <div className="mt-1 w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <ArrowRight size={14} />
                          </div>
                          <p className="text-base font-medium opacity-80 leading-relaxed">{line.substring(1).trim()}</p>
                        </div>
                      )
                    }
                    return <p key={i} className="text-base font-medium opacity-70 leading-relaxed mb-4">{line}</p>
                  })}
                </div>

                {/* Quick Metrics Bar */}
                {selectedAudit.metricsSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-12 pt-10 border-t border-(--border)/40">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">Impact</span>
                      <span className="text-xl font-black text-(--accent)">{selectedAudit.metricsSummary.tasksCompleted} Tasks</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">Focus Time</span>
                      <span className="text-xl font-black">{selectedAudit.metricsSummary.focusMinutes}m</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">Primary Zone</span>
                      <span className="text-xl font-black uppercase">{selectedAudit.metricsSummary.topPriority}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-(--card-bg)/50 rounded-[3rem] p-20 border-2 border-dashed border-(--border)/40 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-(--card-bg) flex items-center justify-center mb-6 shadow-sm">
                <Brain size={40} className="opacity-20" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Audits Found</h3>
              <p className="text-sm opacity-50 max-w-xs mb-8">Your coach hasn't performed an analysis yet. Click the button above to begin.</p>
            </div>
          )}
        </div>

        {/* Sidebar History */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <History size={18} className="opacity-40" />
            <h3 className="text-sm font-black uppercase tracking-widest opacity-40">Previous Logs</h3>
          </div>

          <div className="space-y-3">
            {audits.length > 0 ? audits.map(audit => (
              <button
                key={audit._id}
                onClick={() => setSelectedAudit(audit)}
                className={`w-full p-5 rounded-3xl text-left transition-all border ${selectedAudit?._id === audit._id ? 'bg-(--card-bg) border-indigo-500/50 shadow-lg shadow-indigo-500/5' : 'bg-transparent border-(--border)/40 hover:border-indigo-500/30'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black opacity-80">{new Date(audit.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <Zap size={14} className={selectedAudit?._id === audit._id ? 'text-indigo-500' : 'opacity-20'} />
                </div>
                <p className="text-xs font-medium opacity-50 line-clamp-2 leading-relaxed">
                  {audit.content.substring(0, 80)}...
                </p>
              </button>
            )) : (
              <div className="p-10 text-center opacity-20 italic text-sm">Empty Lab History</div>
            )}
          </div>

          {/* Tips of the day */}
          <div className="mt-10 p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4">Coach's Philosophy</h4>
            <p className="text-xs font-medium opacity-60 leading-relaxed italic">
              "Data is useless unless it drives behavior. True productivity is not about doing more; it's about doing what matters when your energy is highest."
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
