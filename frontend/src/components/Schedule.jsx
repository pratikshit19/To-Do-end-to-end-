import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarOff, Circle, CheckCircle2, Sparkles, Lock } from "lucide-react";
import useStore from "../store/useStore";
import toast from "react-hot-toast";

export default function Schedule({ todos = [] }) {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState("week");
  const { updateTodo, isPro } = useStore();
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (viewMode === "month") {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate, viewMode]);

  const formatKey = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate())
      .toISOString()
      .split("T")[0];

  const changeMonth = (offset) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + offset,
      1
    );
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const changeWeek = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + offset * 7);
    setSelectedDate(newDate);
  };

  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayIndex = firstDayOfMonth.getDay();
    const selectedDay = selectedDate.getDate();

    const weekIndex = Math.floor(
      (selectedDay + firstDayIndex - 1) / 7
    );

    const startDate = new Date(year, month, 1);
    startDate.setDate(weekIndex * 7 - firstDayIndex + 1);

    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  };

  const generateWeekDays = () => {
    const start = new Date(selectedDate);
    const dayIndex = start.getDay();
    start.setDate(start.getDate() - dayIndex);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const calendarDays =
    viewMode === "month" ? generateMonthDays() : generateWeekDays();

  const filteredTasks = todos
    .filter((task) => {
      if (!task.dueDate) return false;
      return formatKey(new Date(task.dueDate)) === formatKey(selectedDate);
    })
    .sort((a, b) => {
      if (!a.dueTime) return 1;
      if (!b.dueTime) return -1;
      return a.dueTime.localeCompare(b.dueTime);
    });

  const pendingCount = filteredTasks.filter((t) => !t.completed).length;
  const completedCount = filteredTasks.filter((t) => t.completed).length;

  const handleAutoSchedule = async () => {
    if (!isPro) {
      toast("Pro Feature: Upgrade to unlock auto-scheduling", { icon: <Lock size={16} className="text-orange-500" /> });
      return;
    }
    
    setIsScheduling(true);
    // 1. Calculate Prime Work Hour
    const hourMap = {};
    todos.forEach(t => {
      if (t.completed && t.completedAt) {
        const d = new Date(t.completedAt);
        const hour = d.getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      }
    });
    const bestHourStr = Object.entries(hourMap).sort((a,b) => b[1] - a[1])[0]?.[0];
    const bestHour = bestHourStr ? parseInt(bestHourStr) : 9; // Default 9 AM

    // 2. Grab today's tasks that don't have a specific time
    const tasksToSchedule = filteredTasks.filter(t => !t.completed && !t.dueTime);
    
    if (tasksToSchedule.length === 0) {
      toast("No tasks waiting for a time slot today.", { icon: "ℹ️" });
      setIsScheduling(false);
      return;
    }

    // 3. Stagger priorities (High gets bestHour, others get staggered)
    const sorted = [...tasksToSchedule].sort((a, b) => {
       const wA = a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1;
       const wB = b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1;
       return wB - wA;
    });

    for (let i = 0; i < sorted.length; i++) {
       const task = sorted[i];
       const targetHour = (bestHour + i) % 24; 
       const formattedTime = `${targetHour.toString().padStart(2, '0')}:00`;
       await updateTodo(task._id, { dueTime: formattedTime });
    }
    
    setIsScheduling(false);
    
    const formattedBestHour = bestHour > 12 ? `${bestHour-12} PM` : `${bestHour} AM`;
    toast.success(`Successfully blocked ${sorted.length} tasks around your Prime Hour (${formattedBestHour})!`, { icon: "✨" });
  };

  return (
    <div className="w-full pb-24 md:pb-6 transition-colors duration-300">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest bg-linear-to-r from-(--gradient-start) to-(--gradient-end) bg-clip-text text-transparent uppercase mb-1">
            Timeline
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {viewMode === "month"
                ? currentDate.toLocaleString("default", { month: "long", year: "numeric" })
                : `Week of ${selectedDate.toLocaleDateString("default", { month: "short", day: "numeric" })}`}
            </h1>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => viewMode === "month" ? changeMonth(-1) : changeWeek(-1)}
                className="p-1.5 rounded-lg bg-(--card-bg) border border-(--border)/60 hover:bg-(--border) transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => viewMode === "month" ? changeMonth(1) : changeWeek(1)}
                className="p-1.5 rounded-lg bg-(--card-bg) border border-(--border)/60 hover:bg-(--border) transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-(--card-bg) p-1.5 rounded-xl border border-(--border)/60 flex inline-block w-fit">
          {["week", "month"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 outline-none 
                ${viewMode === mode
                  ? "bg-(--accent) text-white shadow-md shadow-(--gradient-start)/20 scale-100"
                  : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg)"
                }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* CALENDAR SCROLLER */}
      <div className="bg-(--card-bg) rounded-3xl p-5 sm:p-6 shadow-sm border border-(--border)/60 mb-8 overflow-hidden">
        {/* Days Header */}
        <div className={`grid ${viewMode === "month" ? "grid-cols-7" : "grid-cols-7"} text-center text-[10px] sm:text-xs font-bold text-(--text-secondary) uppercase tracking-wider mb-4`}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={`grid gap-2 sm:gap-3 ${viewMode === "month" ? "grid-cols-7 grid-rows-2" : "grid-cols-7"} transition-all duration-300`}>
          {calendarDays.map((date, i) => {
            const isSelected = formatKey(date) === formatKey(selectedDate);
            const isToday = formatKey(date) === formatKey(today);
            const hasTasks = todos.some((t) => t.dueDate && formatKey(new Date(t.dueDate)) === formatKey(date));

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`relative flex flex-col items-center justify-center h-14 sm:h-16 rounded-2xl cursor-pointer transition-all duration-300 outline-none focus:ring-2 focus:ring-(--accent)/50
                  ${isSelected
                    ? "bg-linear-to-br from-(--gradient-start) to-(--gradient-end) text-white shadow-lg shadow-(--gradient-start)/30 scale-105 z-10"
                    : "bg-(--bg) hover:bg-(--border) text-(--text-primary) border border-transparent"
                  }
                  ${isToday && !isSelected ? "ring-2 ring-(--accent)/30" : ""}
                `}
              >
                <span className={`text-base sm:text-lg font-bold ${isSelected ? "text-white" : ""}`}>
                  {date.getDate()}
                </span>

                {/* Dot Indicator */}
                <div className={`h-1.5 w-1.5 rounded-full mt-1 transition-all ${hasTasks ? (isSelected ? "bg-white" : "bg-(--accent)") : "bg-transparent"
                  }`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* TASKS AREA */}
      <div>
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              Schedule
              <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-(--border) text-(--text-secondary)">
                {selectedDate.toLocaleDateString("default", { month: "short", day: "numeric" })}
              </span>
            </h3>
            
            <button 
              onClick={handleAutoSchedule}
              disabled={isScheduling}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                isPro 
                  ? "bg-linear-to-r from-indigo-500 to-purple-500 text-white hover:scale-105 active:scale-95 shadow-indigo-500/30"
                  : "bg-(--card-bg) border border-(--border) text-(--text-secondary) hover:text-(--text-primary)"
              } ${isScheduling ? "opacity-50 pointer-events-none" : ""}`}
            >
              {isScheduling ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPro ? (
                 <Sparkles size={14} />
              ) : (
                 <Lock size={14} />
              )}
              Auto-Block Time
            </button>
          </div>

          <div className="flex gap-3 text-sm font-medium">
            <span className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg">{completedCount} Done</span>
            <span className="text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg">{pendingCount} Left</span>
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 mt-2 bg-(--card-bg)/30 border border-dashed border-(--border) rounded-3xl opacity-80">
            <div className="w-16 h-16 rounded-full bg-(--border)/50 flex items-center justify-center mb-4 text-(--text-secondary)">
              <CalendarOff size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-1">A completely free day!</h3>
            <p className="text-sm opacity-60 text-center max-w-[250px]">
              You have no tasks scheduled for this date.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-(--card-bg) shadow-sm border border-(--border)/60 transition-all duration-300
                  ${task.completed ? "opacity-50" : "hover:shadow-md hover:border-(--border)"}
                `}
              >
                {/* SVG Icon Checkbox Mock (Schedule is read-only) */}
                <div className="shrink-0 flex items-center justify-center pointer-events-none">
                  {task.completed ? (
                    <CheckCircle2 size={24} className="text-(--accent) fill-(--accent)/10" />
                  ) : (
                    <Circle size={24} className="text-(--text-secondary) opacity-50" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-base font-semibold truncate ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h4>

                    {/* Time Badge */}
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-(--bg) border border-(--border)/50 text-(--text-secondary) shrink-0 shadow-inner">
                      {task.dueTime || "All Day"}
                    </span>
                  </div>

                  {task.priority && (
                    <span
                      className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${task.priority === "high"
                        ? "bg-red-500/10 text-red-500"
                        : task.priority === "low"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                        }`}
                    >
                      {task.priority} Priority
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}