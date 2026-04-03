import { useMemo } from "react";
import { Activity, Award, Zap, TrendingUp } from "lucide-react";

/* ================= SAFE DATE HELPER ================= */

const getDateOnly = (date) => {
  const d = new Date(date);
  if (isNaN(d)) return null;

  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDay = (date) => {
  const d = getDateOnly(date);
  if (!d) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function Insights({
  setCurrentPage,
  todos = [],
  focusSessions = [],
}) {

  /* ================= WEEKLY EFFICIENCY ================= */
  const weeklyData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const weekCompleted = todos.filter((t) => {
      if (!t.completed) return false;
      const date = getDateOnly(t.updatedAt || t.createdAt);
      return date && date >= start && date <= today;
    });

    const weekCreated = todos.filter((t) => {
      const date = getDateOnly(t.createdAt);
      return date && date >= start && date <= today;
    });

    return {
      total: weekCreated.length,
      completed: weekCompleted.length,
      efficiency:
        weekCreated.length > 0
          ? Math.min(Math.round((weekCompleted.length / weekCreated.length) * 100), 100)
          : 0,
    };
  }, [todos]);

  /* ================= STREAK ================= */
  const streak = useMemo(() => {
    const completedDays = todos
      .filter((t) => t.completed)
      .map((t) => formatDay(t.updatedAt || t.createdAt))
      .filter(Boolean);

    const uniqueDays = [...new Set(completedDays)].sort().reverse();
    if (!uniqueDays.length) return 0;

    const todayFormatted = formatDay(new Date());
    const yesterdayFormatted = formatDay(new Date(Date.now() - 86400000));

    if (uniqueDays[0] !== todayFormatted && uniqueDays[0] !== yesterdayFormatted) {
      return 0;
    }

    let count = 1;

    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));

      if (diff === 1) count++;
      else break;
    }

    return count;
  }, [todos]);

  /* ================= TOP CATEGORY ================= */
  const topCategory = useMemo(() => {
    const map = {};

    todos.forEach((t) => {
      if (t.completed && t.category) {
        map[t.category] = (map[t.category] || 0) + 1;
      }
    });

    let max = 0;
    let top = "None";

    Object.entries(map).forEach(([cat, value]) => {
      if (value > max) {
        max = value;
        top = cat;
      }
    });

    return top;
  }, [todos]);

  /* ================= PEAK HOUR ================= */
  const peakHour = useMemo(() => {
    const map = {};

    focusSessions.forEach((s) => {
      if (!s.date) return;
      const hour = new Date(s.date).getHours();
      map[hour] = (map[hour] || 0) + 1;
    });

    let max = 0;
    let peak = null;

    Object.entries(map).forEach(([hour, value]) => {
      if (value > max) {
        max = value;
        peak = hour;
      }
    });

    return peak !== null
      ? new Date(0, 0, 0, peak).toLocaleTimeString([], { hour: 'numeric' })
      : "N/A";
  }, [focusSessions]);

  /* ================= MONTHLY COMPLETION ================= */
  const monthlyCompletion = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const monthCreated = todos.filter((t) => {
      const d = new Date(t.createdAt);
      return (
        d.getMonth() === month &&
        d.getFullYear() === year
      );
    });

    const monthCompleted = todos.filter((t) => {
      if (!t.completed) return false;
      const d = new Date(t.updatedAt || t.createdAt);
      return (
        d.getMonth() === month &&
        d.getFullYear() === year
      );
    });

    return monthCreated.length > 0
      ? Math.round((monthCompleted.length / monthCreated.length) * 100)
      : 0;
  }, [todos]);

  /* ================= UI ================= */

  return (
    <div className="w-full pb-24 md:pb-6 transition-colors duration-300">
      
      {/* HERO METRIC */}
      <div className="relative bg-(--card-bg) rounded-3xl p-6 sm:p-8 mb-6 shadow-sm border border-(--border)/60 overflow-hidden group">
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-linear-to-bl from-(--gradient-start)/20 to-(--gradient-end)/10 rounded-full blur-[50px] pointer-events-none transition-all duration-700 group-hover:scale-110"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-(--accent)" />
              <p className="text-sm font-bold tracking-widest opacity-60 uppercase">Weekly Efficiency</p>
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-5xl sm:text-6xl font-extrabold bg-linear-to-r from-(--gradient-start) to-(--gradient-end) bg-clip-text text-transparent drop-shadow-sm">
                {weeklyData.efficiency}%
              </h1>
            </div>
            <p className="text-sm font-medium mt-2">
              <span className="text-(--text-primary)">{weeklyData.completed} out of {weeklyData.total}</span> tasks completed this week.
            </p>
          </div>

          {/* Simple Decorative Graph */}
          <div className="hidden md:flex flex-1 max-w-[200px] h-16 items-end gap-2 opacity-80 pointer-events-none">
            {[40, 70, 45, 90, 60, 80, weeklyData.efficiency].map((val, i) => (
               <div key={i} className={`flex-1 rounded-t-sm ${i === 6 ? 'bg-linear-to-t from-(--gradient-end) to-(--gradient-start)' : 'bg-(--border)'}`} style={{ height: `${val || 10}%` }}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

        {/* STREAK */}
        <div className="bg-(--card-bg) p-6 rounded-3xl shadow-sm border border-(--border)/60 hover:shadow-md transition-shadow group flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold tracking-widest opacity-50 uppercase">Current Streak</p>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black mb-1">{streak} <span className="text-lg font-medium opacity-50">Days</span></h2>
            <p className="text-sm font-medium opacity-70">Keep the momentum going!</p>
          </div>
        </div>

        {/* PEAK HOUR */}
        <div className="bg-(--card-bg) p-6 rounded-3xl shadow-sm border border-(--border)/60 hover:shadow-md transition-shadow group flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold tracking-widest opacity-50 uppercase">Peak Focus</p>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-black mb-1 text-(--text-primary)">{peakHour}</h2>
            <p className="text-sm font-medium opacity-70">Your most productive period.</p>
          </div>
        </div>

        {/* TOP CATEGORY */}
        <div className="bg-(--card-bg) p-6 rounded-3xl shadow-sm border border-(--border)/60 hover:shadow-md transition-shadow group flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold tracking-widest opacity-50 uppercase">Top Topic</p>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Award size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-black mb-1 truncate">{topCategory}</h2>
            <p className="text-sm font-medium opacity-70">Your most frequent label.</p>
          </div>
        </div>

        {/* MONTHLY COMPLETION */}
        <div className="bg-(--card-bg) p-6 rounded-3xl shadow-sm border border-(--border)/60 hover:shadow-md transition-shadow group col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full box-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-(--accent)/10 text-(--accent) flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <p className="text-xs font-bold tracking-widest opacity-50 uppercase">Monthly Progress</p>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">You're tracking well</h3>
            <p className="text-sm font-medium opacity-70 max-w-[280px]">Complete the remaining tasks to fill your productivity circle for this month.</p>
          </div>

          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90 select-none drop-shadow-sm" viewBox="0 0 100 100">
              {/* Background Map Ring */}
              <circle cx="50" cy="50" r="40" className="stroke-(--border) fill-transparent" strokeWidth="8" />
              {/* Foreground Glow Ring */}
              <circle
                cx="50" cy="50" r="40"
                className="stroke-(--gradient-start) fill-transparent transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * monthlyCompletion) / 100}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center mt-1">
              <span className="text-2xl font-black bg-linear-to-br from-(--gradient-start) to-(--gradient-end) bg-clip-text text-transparent">{monthlyCompletion}%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}