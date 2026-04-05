import { Edit, Flame, LogOut, Settings, Crown, Zap, Activity, Palette, ArrowRight, Check, FileSpreadsheet, Brain, Target, Sparkles, Users } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";
import useStore from "../store/useStore";
import PricingModal from "./PricingModal";

export default function Profile({ onLogout, setCurrentPage }) {
  const { userProfile, setUserProfile, getStats, isPro, setShowPricingModal } = useStore();
  const stats = getStats();
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const fileInputRef = useRef(null);

  const handleUpgrade = () => {
    setShowPricingModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!token) {
      toast.error("Session expired. Please login again.");
      return;
    }

    const toastId = toast.loading("Uploading photo...");
    const formData = new FormData();
    formData.append("profilePhoto", file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload-profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload image");

      const data = await res.json();
      setUserProfile({ profilePhoto: data.profilePhoto });
      localStorage.setItem("profilePhoto", data.profilePhoto);
      toast.success("Profile photo updated!", { id: toastId });
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Cloud upload failed.", { id: toastId });
    }
  };

  const goals = useMemo(() => {
    return [
      { name: "Daily Productivity", percent: stats.completionRate },
      { name: "Focus Progress", percent: Math.min(100, (stats.streak * 20)) },
    ];
  }, [stats]);

  const ProFeaturesCard = () => {
    if (isPro) return null;

    const features = [
      {
        icon: <Brain size={18} />,
        title: "Mind Sweep AI",
        desc: "Dump your thoughts. AI builds your schedule.",
        color: "text-purple-500",
        bg: "bg-purple-500/10"
      },
      {
        icon: <Target size={18} />,
        title: "Frog Eater Mode",
        desc: "Un-pausable forced timer to crush your dreaded tasks.",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
      },
      {
        icon: <Sparkles size={18} />,
        title: "Auto-Scheduler",
        desc: "Smart algorithm auto-blocks time based on your peak hours.",
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
      },
      {
        icon: <Flame size={18} />,
        title: "Burnout Predictor",
        desc: "Prevents overworking by analyzing your task velocity.",
        color: "text-red-500",
        bg: "bg-red-500/10"
      },
      {
        icon: <Users size={18} />,
        title: "Team Collaboration",
        desc: "Shared workspaces, invite codes, and real-time syncing.",
        color: "text-cyan-500",
        bg: "bg-cyan-500/10"
      },
      {
        icon: <Activity size={18} />,
        title: "Deep Insights",
        desc: "90-day heatmap, PDF exports, and theme engine.",
        color: "text-blue-500",
        bg: "bg-blue-500/10"
      }
    ];

    return (
      <div className="bg-(--card-bg) p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-(--border)/60 shadow-2xl relative overflow-hidden mb-12 animate-in zoom-in-95 fade-in duration-700">
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-600 mb-6 border border-orange-500/20">
               <Crown size={14} className="fill-orange-500/20" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Unlimited Growth</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight">
              Unlock the <span className="bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Full Power</span> of TaskFlow
            </h2>
          </div>
          <button 
            onClick={handleUpgrade}
            className="px-8 py-4 bg-linear-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center gap-2 group/btn"
          >
            Get Pro Now
            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-12">
          {features.map((f, i) => (
            <div key={i} className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-(--bg)/50 border border-(--border)/40 hover:border-orange-500/30 transition-all hover:shadow-lg group/item">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${f.bg} ${f.color} flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform shadow-sm`}>
                  {f.icon}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <h4 className="font-bold text-[10px] sm:text-sm leading-tight">{f.title}</h4>
                  <p className="text-[9px] sm:text-[11px] font-medium opacity-60 leading-tight sm:leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-2 justify-center opacity-40">
          <Check size={14} className="text-orange-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-(--text-primary)">Secure Checkout</span>
          <span className="mx-2 text-(--text-primary)">•</span>
          <Check size={14} className="text-orange-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-(--text-primary)">Instant Activation</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pb-30 md:pb-6 transition-colors duration-300">

      {/* Avatar Card */}
      <div className="flex items-center justify-between bg-(--card-bg) p-6 rounded-3xl mb-8 shadow-sm border border-(--border)/60 hover:shadow-md transition-shadow relative overflow-hidden group z-10">
        <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-(--gradient-start)/5 rounded-full blur-[40px] pointer-events-none transition-all group-hover:bg-(--gradient-start)/10"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-linear-to-br from-(--gradient-start) to-(--gradient-end) text-white text-2xl font-semibold shadow-lg shadow-(--gradient-start)/20 ring-4 ring-(--gradient-start)/10 overflow-hidden">
            {userProfile.profilePhoto ? (
              <img src={userProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              userProfile.username?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">{userProfile.username}</h2>
            <p className="text-xs font-bold text-(--accent) tracking-widest uppercase opacity-80">
              {isPro ? "Pro Member" : "Free Member"}
            </p>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative z-10 w-10 h-10 flex items-center justify-center rounded-xl bg-(--card-bg) border border-(--border) hover:bg-(--border)/50 transition-colors text-(--text-secondary) hover:text-(--accent) focus:outline-none"
        >
          <Edit size={18} />
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
      </div>

      <ProFeaturesCard />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8 relative z-10">
        <div className="bg-(--card-bg) p-5 rounded-[2rem] border border-(--border)/60 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-medium opacity-60 mb-1 tracking-wider">STREAK</p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black">{stats.streak}</h3>
            <Flame size={18} className="text-orange-500 fill-orange-500/20" />
          </div>
        </div>

        <div className="bg-(--card-bg) p-5 rounded-[2rem] border border-(--border)/60 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-medium opacity-60 mb-1 tracking-wider">COMPLETED</p>
          <h3 className="text-2xl font-black">{stats.completedCount}</h3>
        </div>

        <div className="bg-(--card-bg) p-5 rounded-[2rem] border border-(--border)/60 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
          <p className="text-xs font-medium opacity-60 mb-1 tracking-wider">FOCUS TIME</p>
          <h3 className="text-2xl font-black">{stats.totalFocusTime}</h3>
        </div>
      </div>

      {/* Performance Circle & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 relative z-10">
        <div className="bg-(--card-bg) p-8 rounded-[2.5rem] border border-(--border)/60 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-(--gradient-start) to-(--gradient-end)"></div>
          <div className="relative w-40 h-40 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90 select-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" className="stroke-(--border) fill-transparent" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40"
                className="stroke-(--gradient-start) fill-transparent transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * stats.completionRate) / 100}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black">{stats.completionRate}%</span>
              <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Efficiency</span>
            </div>
          </div>
          <p className="text-sm font-bold opacity-70">Weekly Efficiency Rate</p>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-black mb-1 px-2 uppercase tracking-widest text-sm opacity-50">Active Targets</h3>
          {goals.map((goal) => (
            <div key={goal.name} className="bg-(--card-bg) p-6 rounded-3xl border border-(--border)/60 shadow-sm">
              <div className="flex justify-between mb-3 items-end">
                <span className="text-base font-bold">{goal.name}</span>
                <span className="text-sm font-black text-(--accent)">{goal.percent}%</span>
              </div>
              <div className="w-full h-2.5 bg-(--border)/40 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-linear-to-r from-(--gradient-start) to-(--gradient-end) transition-all duration-1000 ease-out"
                  style={{ width: `${goal.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Actions */}
      <div className="space-y-4 pt-4 border-t border-(--border)/40 relative z-10">
        <button
          onClick={() => setCurrentPage("settings")}
          className="w-full bg-(--card-bg) hover:bg-(--border)/50 text-(--text-primary) font-bold py-4 rounded-3xl flex items-center justify-center gap-2 transition-colors border border-(--border)/60 shadow-sm focus:outline-none focus:ring-4 focus:ring-(--accent)/20"
        >
          <Settings size={20} />
          Account Settings
        </button>

        <button
          onClick={onLogout}
          className="w-full bg-(--card-bg) hover:bg-red-500/10 text-(--text-primary) hover:text-red-500 font-bold py-4 rounded-3xl flex items-center justify-center gap-2 transition-colors border border-(--border)/60 hover:border-red-500/30 shadow-sm focus:outline-none focus:ring-4 focus:ring-red-500/20"
        >
          <LogOut size={20} />
          Sign Out Workspace
        </button>
      </div>

    </div>
  );
}