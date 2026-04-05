import { useState } from "react";
import { X, Brain, Wand2, Sparkles } from "lucide-react";
import useStore from "../store/useStore";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";

export default function MindSweep({ closeModal }) {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { fetchTodos } = useStore();

  const handleProcess = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);

    // 1. Split into sentences or lines
    const rawItems = text.split(/[\n.]+/).map(s => s.trim()).filter(s => s.length > 2);

    if (rawItems.length === 0) {
      toast.error("Couldn't read any actionable tasks.");
      setIsProcessing(false);
      return;
    }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    let processedCount = 0;

    for (let current of rawItems) {
      // Very basic keyword NLP Extraction
      const lower = current.toLowerCase();

      let priority = "medium";
      if (lower.includes("urgent") || lower.includes("important") || lower.includes("asap") || lower.includes("critical")) {
        priority = "high";
      } else if (lower.includes("maybe") || lower.includes("eventually") || lower.includes("someday")) {
        priority = "low";
      }

      let dueDate = new Date();
      if (lower.includes("tomorrow")) {
        dueDate.setDate(dueDate.getDate() + 1);
      } else if (lower.includes("next week")) {
        dueDate.setDate(dueDate.getDate() + 7);
      }
      // "today" or "tonight" uses the default today's date

      const isoDueDate = dueDate.toISOString();

      // Cleanup filler words locally
      let title = current.replace(/urgent|important|asap|critical|maybe|eventually|tomorrow|today|tonight|next week/gi, "").replace(/\s+/g, " ").trim();
      if (!title) title = current; // Fallback
      if (title.length > 60) title = title.substring(0, 57) + "..."; // Enforce length

      try {
        const response = await fetch(`${API_BASE_URL}/todo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            priority,
            dueDate: isoDueDate,
            dueTime: null,
            completed: false
          })
        });

        if (response.ok) processedCount++;
      } catch (err) {
        console.error("Failed to parse task:", err);
      }
    }

    await fetchTodos(); // refresh to pull new items
    setIsProcessing(false);
    toast.success(`Mind Sweep Complete! Magically extracted ${processedCount} tasks.`, { icon: <Sparkles className="text-purple-500" /> });
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in"
        onClick={closeModal}
      />

      <div className="relative w-full max-w-2xl bg-(--card-bg) border border-purple-500/30 shadow-2xl shadow-purple-500/10 rounded-3xl p-6 sm:p-8 animate-in zoom-in-95 duration-300">
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-(--border) transition-colors text-(--text-secondary)"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Brain size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black bg-linear-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">Mind Sweep</h2>
            <p className="text-sm opacity-60 font-medium">Bypass the forms. Brain-dump your thoughts below.</p>
          </div>
        </div>

        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., Pay the electricity bill tomorrow. It's urgent to email sarah about the marketing deck. Maybe I should clean the garage next week."
            className="w-full h-48 bg-transparent outline-none resize-none text-(--text-primary) placeholder-(--text-secondary)/50 font-medium leading-relaxed"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs opacity-50 max-w-[200px]">Extracts urgency, dates, and separate tasks using local heuristics.</p>

          <button
            onClick={handleProcess}
            disabled={isProcessing || !text.trim()}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-white transition-all shadow-xl ${isProcessing || !text.trim()
                ? "bg-(--border) opacity-50 cursor-not-allowed"
                : "bg-linear-to-r from-purple-500 to-indigo-500 hover:scale-105 active:scale-95 shadow-purple-500/30"
              }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Wand2 size={20} />
                Parse & Organize
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
