import { ArrowLeft, Settings } from "lucide-react";
import { useMemo } from "react";

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
  console.log("INSIGHTS RENDERED");
console.log("Todos received:", todos);
console.log("Todos length:", todos.length);
  /* ================= WEEKLY EFFICIENCY ================= */
  /* Based on tasks COMPLETED in last 7 days */

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
          ? Math.round((weekCompleted.length / weekCreated.length) * 100)
          : 0,
    };
  }, [todos]);

  /* ================= STREAK ================= */
  /* Consecutive completion days */

  const streak = useMemo(() => {
    const completedDays = todos
      .filter((t) => t.completed)
      .map((t) => formatDay(t.updatedAt || t.createdAt))
      .filter(Boolean);

    const uniqueDays = [...new Set(completedDays)].sort().reverse();
    if (!uniqueDays.length) return 0;

    const todayFormatted = formatDay(new Date());

    // If no task completed today → streak is 0
    if (uniqueDays[0] !== todayFormatted) return 0;

    let count = 1;

    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = (prev - curr) / (1000 * 60 * 60 * 24);

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

    return peak !== null ? `${peak}:00` : "N/A";
  }, [focusSessions]);

  /* ================= MONTHLY COMPLETION ================= */
  /* Based on completed tasks this month */

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
    <div className="min-h-screen bg-(--bg) text-(--text-primary) md:px-10 space-y-6 pb-20">

      <div className="flex items-center justify-between">
        <ArrowLeft
          onClick={() => setCurrentPage("home")}
          className="cursor-pointer"
        />
        <h3 className="text-lg font-semibold">Insights</h3>
        <Settings
          onClick={() => setCurrentPage("settings")}
          className="cursor-pointer"
        />
      </div>

      {/* WEEKLY */}
      <div className="bg-(--card-bg) rounded-2xl p-6 shadow-md space-y-4 border border-(--border)">
        <p className="text-xs opacity-60">WEEKLY EFFICIENCY</p>
        <h1 className="text-4xl font-bold text-(--accent)">
          {weeklyData.efficiency}%
        </h1>
        <p className="text-sm opacity-70">
          {weeklyData.completed} / {weeklyData.total} Tasks completed
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* STREAK */}
        <div className="bg-(--card-bg) rounded-2xl p-6 shadow-md space-y-4 border border-(--border)">
          <div className="text-3xl">🔥</div>
          <p className="text-sm opacity-70">Current Streak</p>
          <h2 className="text-3xl font-bold">{streak} Days</h2>
        </div>

        {/* TOP CATEGORY */}
        <div className="bg-(--card-bg) rounded-2xl p-6 shadow-md space-y-3 border border-(--border)">
          <p className="text-xs opacity-60">TOP CATEGORY</p>
          <h3 className="text-xl font-semibold">{topCategory}</h3>
        </div>

        {/* PEAK HOUR */}
        <div className="bg-(--card-bg) rounded-2xl p-6 shadow-lg space-y-3 border border-(--border)">
          <p className="text-xs opacity-60">PEAK ENERGY</p>
          <h3 className="text-xl font-semibold">{peakHour}</h3>
        </div>

        {/* MONTHLY */}
        <div className="bg-(--card-bg) rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-lg border border-(--border)">
          <p className="text-xs opacity-60">MONTHLY COMPLETION</p>
          <div className="relative w-28 h-28 rounded-full bg-linear-to-tr from-cyan-500 to-blue-500 flex items-center justify-center">
            <div className="absolute w-20 h-20 bg-(--card-bg) rounded-full flex items-center justify-center text-lg font-semibold">
              {monthlyCompletion}%
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}