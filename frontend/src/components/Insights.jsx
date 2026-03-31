import { ArrowLeft, Settings } from "lucide-react";
import { useMemo } from "react";

export default function Insights({
  setCurrentPage,
  tasks = [],
  focusSessions = [],
}) {
  /* -------------------- WEEKLY DATA -------------------- */

  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - 6);

    const thisWeekTasks = tasks.filter((t) => {
      const date = new Date(t.completedAt);
      return t.completed && date >= startOfWeek;
    });

    const totalThisWeek = tasks.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= startOfWeek;
    });

    const efficiency = totalThisWeek.length
      ? Math.round(
          (thisWeekTasks.length / totalThisWeek.length) * 100
        )
      : 0;

    return {
      completed: thisWeekTasks.length,
      total: totalThisWeek.length,
      efficiency,
    };
  }, [tasks]);

  /* -------------------- STREAK -------------------- */

  const streak = useMemo(() => {
    const completedDates = tasks
      .filter((t) => t.completed)
      .map((t) =>
        new Date(t.completedAt).toDateString()
      );

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
        currentDate.setDate(
          currentDate.getDate() - 1
        );
      } else break;
    }

    return count;
  }, [tasks]);

  /* -------------------- TOP CATEGORY -------------------- */

  const topCategory = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (t.completed) {
        map[t.category] =
          (map[t.category] || 0) + 1;
      }
    });

    let max = 0;
    let top = "None";

    for (let cat in map) {
      if (map[cat] > max) {
        max = map[cat];
        top = cat;
      }
    }

    return top;
  }, [tasks]);

  /* -------------------- PEAK HOUR -------------------- */

  const peakHour = useMemo(() => {
    const map = {};

    focusSessions.forEach((s) => {
      const hour = new Date(s.date).getHours();
      map[hour] = (map[hour] || 0) + 1;
    });

    let max = 0;
    let peak = null;

    for (let hour in map) {
      if (map[hour] > max) {
        max = map[hour];
        peak = hour;
      }
    }

    return peak !== null ? `${peak}:00` : "N/A";
  }, [focusSessions]);

  /* -------------------- MONTHLY COMPLETION -------------------- */

  const monthlyCompletion = useMemo(() => {
    const now = new Date();

    const thisMonthTasks = tasks.filter((t) => {
      const date = new Date(t.createdAt);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const completed = thisMonthTasks.filter(
      (t) => t.completed
    );

    return thisMonthTasks.length
      ? Math.round(
          (completed.length /
            thisMonthTasks.length) *
            100
        )
      : 0;
  }, [tasks]);

  return (
    <div className="min-h-screen bg-(--bg) text-(--text-primary) px-2 md:px-10 md:py-10 space-y-6 pb-20">

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <ArrowLeft
          className="cursor-pointer opacity-70 hover:opacity-100"
          onClick={() => setCurrentPage("home")}
        />
        <h3 className="text-lg font-semibold">
          Insights
        </h3>
        <Settings
          className="cursor-pointer opacity-70 hover:opacity-100"
          onClick={() => setCurrentPage("settings")}
        />
      </div>

      {/* Weekly Efficiency */}
      <div className="bg-(--card-bg) text-(--text-primary) rounded-2xl p-6 shadow-sm space-y-4">
        <p className="text-xs tracking-widest opacity-60">
          WEEKLY EFFICIENCY
        </p>

        <h1 className="text-4xl font-bold text-(--accent)">
          {weeklyData.efficiency}%
        </h1>

        <p className="text-sm opacity-70">
          {weeklyData.completed} / {weeklyData.total} tasks completed
        </p>

        <div className="flex items-end gap-2 h-20 mt-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-md ${
                i === 6
                  ? "bg-(--accent) h-full"
                  : "bg-(--border) h-3/4"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Responsive Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Streak */}
        <div className="bg-(--card-bg) text-(--text-primary) rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="text-3xl">🔥</div>
          <p className="text-sm opacity-70">
            Current Streak
          </p>
          <h2 className="text-3xl font-bold">
            {streak} Days
          </h2>

          <div className="h-2 bg-(--border) rounded-full overflow-hidden">
            <div
              className="h-full bg-(--accent) transition-all"
              style={{
                width: `${Math.min(
                  streak * 5,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-(--card-bg) text-(--text-primary) shadow-sm rounded-2xl p-6 space-y-3">
          <p className="text-xs tracking-widest opacity-60">
            TOP CATEGORY
          </p>
          <h3 className="text-xl font-semibold">
            {topCategory}
          </h3>
          <span className="text-xs bg-cyan-500/20 text-cyan-500 px-3 py-1 rounded-full">
            Most Completed
          </span>
        </div>

        {/* Peak Hour */}
        <div className="bg-(--card-bg) text-(--text-primary) shadow-sm rounded-2xl p-6 space-y-3">
          <p className="text-xs tracking-widest opacity-60">
            PEAK ENERGY
          </p>
          <h3 className="text-xl font-semibold">
            {peakHour}
          </h3>
          <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full">
            Highest Focus Hour
          </span>
        </div>

        {/* Monthly Completion */}
        <div className="bg-(--card-bg) text-(--text-primary) shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center space-y-4">
          <p className="text-xs tracking-widest opacity-60">
            MONTHLY COMPLETION
          </p>

          <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center">
            <div className="absolute w-20 h-20 bg-(--card-bg) text-(--text-primary) rounded-full flex items-center justify-center text-lg font-semibold">
              {monthlyCompletion}%
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}