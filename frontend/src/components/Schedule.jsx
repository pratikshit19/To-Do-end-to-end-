import { useState, useEffect } from "react";

export default function Schedule({ todos = [] }) {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState("month");

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

  return (
    <div className="min-h-screen bg-(--bg) text-(--text-primary) px-2 md:p-8">

      {/* HEADER */}
      <div className="max-w-5xl mx-auto">

        <div className="mb-6">
          <p className="text-xs tracking-widest text-(--accent)">
            TIMELINE
          </p>

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() =>
                viewMode === "month"
                  ? changeMonth(-1)
                  : changeWeek(-1)
              }
              className="text-xl px-3 py-1 hover:text-(--accent)"
            >
              ‹
            </button>

            <h1 className="text-xl md:text-2xl font-semibold">
              {viewMode === "month"
                ? currentDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })
                : `Week of ${selectedDate.toLocaleDateString("default", {
                    month: "short",
                    day: "numeric",
                  })}`}
            </h1>

            <button
              onClick={() =>
                viewMode === "month"
                  ? changeMonth(1)
                  : changeWeek(1)
              }
              className="text-xl px-3 py-1 hover:text-[var(--accent)]"
            >
              ›
            </button>
          </div>

          {/* VIEW TOGGLE */}
          <div className="flex gap-2 mt-4">
            {["month", "week"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1 rounded-full text-sm transition ${
                  viewMode === mode
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--card-bg)] text-[var(--text-secondary)]"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* WEEKDAY ROW */}
        <div className="grid grid-cols-7 text-center text-sm text-[var(--text-secondary)] mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* CALENDAR GRID */}
        <div
          className={`grid ${
            viewMode === "month"
              ? "grid-cols-7 grid-rows-2"
              : "grid-cols-7"
          } gap-2`}
        >
          {calendarDays.map((date, i) => {
            const isSelected =
              formatKey(date) === formatKey(selectedDate);

            const hasTasks = todos.some((t) =>
              t.dueDate &&
              formatKey(new Date(t.dueDate)) === formatKey(date)
            );

            return (
              <div
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`relative flex items-center justify-center h-12 rounded-lg cursor-pointer transition
                  ${
                    isSelected
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--card-bg)] hover:bg-[var(--border-color)]"
                  }
                `}
              >
                {date.getDate()}

                {hasTasks && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 bg-[var(--accent)] rounded-full"></span>
                )}
              </div>
            );
          })}
        </div>

        {/* TASK HEADER */}
        <div className="mt-8 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Tasks for{" "}
            {selectedDate.toLocaleDateString("default", {
              month: "short",
              day: "numeric",
            })}
          </h3>

          <span className="text-sm text-[var(--text-secondary)]">
            {pendingCount} Pending · {completedCount} Completed
          </span>
        </div>

        {/* TASK LIST */}
        <div className="mt-4 space-y-3">
          {filteredTasks.length === 0 ? (
            <p className="text-[var(--text-secondary)]">
              No tasks for this day
            </p>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task._id}
                className={`p-4 rounded-xl bg-[var(--card-bg)] flex justify-between items-center transition
                  ${
                    task.completed
                      ? "opacity-60 line-through"
                      : ""
                  }
                `}
              >
                <div>
                  <h4 className="font-medium">
                    {task.title}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {task.dueTime
                      ? `⏰ ${task.dueTime}`
                      : "No time set"}
                  </p>
                </div>

                <span className="text-xs px-3 py-1 rounded-full bg-[var(--border-color)]">
                  {task.dueTime || "--:--"}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}