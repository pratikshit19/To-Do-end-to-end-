import { Edit, Flame, Timer, CheckCircle, Trophy, LogOut, Settings } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";

export default function Profile({
  todos = [],
  focusSessions = [],
  onLogout,
  setCurrentPage,
  userProfile,
  setUserProfile,
}) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const fileInputRef = useRef(null);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      setUserProfile((prev) => ({ ...prev, profilePhoto: data.profilePhoto }));
      // Cache the new Cloudinary URL immediately
      localStorage.setItem("profilePhoto", data.profilePhoto);
      toast.success("Profile photo updated!", { id: toastId });
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Cloud upload failed.", { id: toastId });
    }
  };

  // Profile data is now handled centrally in App.jsx via userProfile prop

  /* ---------------- TOTAL COMPLETED ---------------- */
  const totalCompleted = useMemo(() => {
    return todos.filter((t) => t.completed).length;
  }, [todos]);

  /* ---------------- COMPLETION % ---------------- */
  const completionPercentage = useMemo(() => {
    if (!todos.length) return 0;
    const completed = todos.filter((t) => t.completed).length;
    return Math.round((completed / todos.length) * 100);
  }, [todos]);

  /* ---------------- STREAK ---------------- */
  const streak = useMemo(() => {
    const completedDates = todos
      .filter((t) => t.completed)
      .map((t) => new Date(t.completedAt).toDateString());

    const uniqueDates = [...new Set(completedDates)].sort(
      (a, b) => new Date(b) - new Date(a)
    );

    let count = 0;
    let currentDate = new Date();

    for (let i = 0; i < uniqueDates.length; i++) {
      const compareDate = new Date(uniqueDates[i]);

      if (
        compareDate.toDateString() ===
        currentDate.toDateString()
      ) {
        count++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
  }, [todos]);

  /* ---------------- FOCUS TIME ---------------- */
  const totalFocusTime = useMemo(() => {
    const totalMinutes = focusSessions.reduce(
      (acc, session) => acc + (session.duration || 0),
      0
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  }, [focusSessions]);

  /* ---------------- WEEKLY RANK ---------------- */
  const weeklyRank = useMemo(() => {
    if (completionPercentage >= 90) return "Top 5%";
    if (completionPercentage >= 75) return "Top 15%";
    if (completionPercentage >= 60) return "Top 30%";
    return "Keep Pushing";
  }, [completionPercentage]);

  /* ---------------- GOALS ---------------- */
  const goals = useMemo(() => {
    const today = new Date().toDateString();

    const todaytodos = todos.filter(
      (t) =>
        t.completed &&
        new Date(t.completedAt).toDateString() === today
    );

    const dailyReading = Math.min(
      Math.round((todaytodos.length / 5) * 100),
      100
    );

    const meditation = Math.min(
      Math.round((focusSessions.length / 7) * 100),
      100
    );

    return [
      { name: "Daily Productivity", percent: dailyReading },
      { name: "Focus Consistency", percent: meditation },
    ];
  }, [todos, focusSessions]);

  return (
    <div className="w-full pb-30 md:pb-6 transition-colors duration-300">

      {/* Avatar Card */}
      <div className="flex items-center justify-between bg-(--card-bg) p-6 rounded-3xl mb-8 shadow-sm border border-(--border)/60 hover:shadow-md transition-shadow relative overflow-hidden group">
        {/* Subtle decorative background */}
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
            <h3 className="font-bold text-xl tracking-wide bg-linear-to-br from-(--text-primary) to-(--text-secondary) bg-clip-text text-transparent">
              {userProfile.username || "User"}
            </h3>
            <span className="inline-block mt-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-(--accent)/10 text-(--accent)">
              Pro Workspace
            </span>
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative z-10 w-10 h-10 flex items-center justify-center rounded-xl bg-(--card-bg) border border-(--border) hover:bg-(--border)/50 transition-colors text-(--text-secondary) hover:text-(--accent) focus:outline-none"
        >
          <Edit size={18} />
        </button>
      </div>

      {/* Accomplishments */}
      <div className="mb-8 p-6 rounded-3xl bg-(--card-bg)/30 border border-(--border)/30">
        <p className="text-xs font-semibold tracking-widest opacity-50 mb-2 uppercase">Lifetime Value</p>
        <h1 className="text-4xl md:text-5xl font-extrabold flex items-baseline gap-2">
          {totalCompleted.toLocaleString()}
          <span className="text-lg font-medium opacity-50 tracking-tight">Tasks Crushed</span>
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

        {/* Streak */}
        <div className="bg-(--card-bg) p-5 rounded-2xl shadow-sm border border-(--border)/60 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
            <Flame size={20} />
          </div>
          <p className="text-xs font-medium opacity-60 mb-1">CURRENT STREAK</p>
          <h3 className="text-2xl font-bold">{streak} <span className="text-sm font-normal opacity-60">Days</span></h3>
        </div>

        {/* Focus */}
        <div className="bg-(--card-bg) p-5 rounded-2xl shadow-sm border border-(--border)/60 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
            <Timer size={20} />
          </div>
          <p className="text-xs font-medium opacity-60 mb-1">FOCUS TIME</p>
          <h3 className="text-2xl font-bold">{totalFocusTime}</h3>
        </div>

        {/* Completion */}
        <div className="bg-(--card-bg) p-5 rounded-2xl shadow-sm border border-(--border)/60 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
            <CheckCircle size={20} />
          </div>
          <p className="text-xs font-medium opacity-60 mb-1">COMPLETION RATE</p>
          <h3 className="text-2xl font-bold">{completionPercentage}%</h3>
        </div>

        {/* Rank */}
        <div className="bg-(--card-bg) p-5 rounded-2xl shadow-sm border border-(--border)/60 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
            <Trophy size={20} />
          </div>
          <p className="text-xs font-medium opacity-60 mb-1">WEEKLY RANK</p>
          <h3 className="text-2xl font-bold">{weeklyRank}</h3>
        </div>

      </div>

      {/* Goals */}
      <div className="bg-(--card-bg) p-6 sm:p-8 rounded-3xl mb-8 shadow-sm border border-(--border)/60">
        <h4 className="text-lg font-bold mb-6">Active Targets</h4>

        <div className="space-y-6">
          {goals.map((goal, index) => (
            <div key={index} className="group">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium opacity-80">{goal.name}</span>
                <span className="text-lg font-bold bg-linear-to-r from-(--gradient-start) to-(--gradient-end) bg-clip-text text-transparent">{goal.percent}%</span>
              </div>

              <div className="w-full h-2.5 bg-(--border)/50 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-linear-to-r from-(--gradient-start) to-(--gradient-end) rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${goal.percent}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4 mt-8">
        <button 
          onClick={() => setCurrentPage("settings")}
          className="w-full bg-(--card-bg) hover:bg-(--border)/50 text-(--text-primary) font-bold py-4 rounded-3xl flex items-center justify-center gap-2 transition-colors border border-(--border)/60 shadow-sm focus:outline-none focus:ring-4 focus:ring-(--accent)/20"
        >
          <Settings size={20} />
          Workspace Settings
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