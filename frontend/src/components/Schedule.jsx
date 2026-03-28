import { useState, useEffect } from "react";
import "../Schedule.css";

export default function Schedule({ todos }) {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState("month"); // month | week
  const [tasks, setTasks] = useState([]);

  /* ===============================
     FETCH TODOS FROM BACKEND
  =============================== */
//   useEffect(() => {
//     const fetchTodos = async () => {
//       try {
//         const token = localStorage.getItem("token");

//         const response = await fetch(
//           "https://to-do-app-616k.onrender.com/todos",
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         const data = await response.json();
//         setTasks(data.todos || []);
//       } catch (err) {
//         console.error("Error fetching todos", err);
//       }
//     };

//     fetchTodos();
//   }, []);

  /* ===============================
     SYNC MONTH WHEN DATE CHANGES
  =============================== */
  useEffect(() => {
    if (viewMode === "month") {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate, viewMode]);

  /* ===============================
     SAFE DATE FORMAT (NO TZ BUG)
  =============================== */
  const formatKey = (date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
      .toISOString()
      .split("T")[0];
  };

  /* ===============================
     MONTH NAVIGATION
  =============================== */
  const changeMonth = (offset) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + offset,
      1
    );
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  /* ===============================
     WEEK NAVIGATION
  =============================== */
  const changeWeek = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + offset * 7);
    setSelectedDate(newDate);
  };

  /* ===============================
     GENERATE 2-ROW MONTH GRID
  =============================== */
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

  /* ===============================
     GENERATE WEEK DAYS
  =============================== */
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

  /* ===============================
     FILTER TASKS BY SELECTED DATE
  =============================== */
  const filteredTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;

    const taskDate = new Date(task.dueDate);
    return formatKey(taskDate) === formatKey(selectedDate);
  });

  const pendingCount = filteredTasks.filter((t) => !t.completed).length;
  const completedCount = filteredTasks.filter((t) => t.completed).length;

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="schedule-container">
      {/* TIMELINE HEADER */}
      <div className="timeline">
        <span className="timeline-label">TIMELINE</span>

        <div className="nav-buttons">
          <button
            onClick={() =>
              viewMode === "month"
                ? changeMonth(-1)
                : changeWeek(-1)
            }
          >
            ‹
          </button>

          <h1>
            {viewMode === "month"
              ? currentDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })
              : `Week of ${selectedDate.toLocaleDateString(
                  "default",
                  {
                    month: "short",
                    day: "numeric",
                  }
                )}`}
          </h1>

          <button
            onClick={() =>
              viewMode === "month"
                ? changeMonth(1)
                : changeWeek(1)
            }
          >
            ›
          </button>
        </div>

        <div className="view-toggle">
          <button
            className={viewMode === "month" ? "active" : ""}
            onClick={() => setViewMode("month")}
          >
            Month
          </button>
          <button
            className={viewMode === "week" ? "active" : ""}
            onClick={() => setViewMode("week")}
          >
            Week
          </button>
        </div>
      </div>

      {/* WEEKDAY LABELS */}
      <div className="weekday-row">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
          (d) => (
            <span key={d}>{d}</span>
          )
        )}
      </div>

      {/* CALENDAR GRID */}
      <div className={`calendar-grid ${viewMode}`}>
        {calendarDays.map((date, i) => {
          const isSelected =
            formatKey(date) === formatKey(selectedDate);

          const hasTasks = tasks.some((t) => {
            if (!t.dueDate) return false;
            return (
              formatKey(new Date(t.dueDate)) ===
              formatKey(date)
            );
          });

          return (
            <div
              key={i}
              className={`calendar-day ${
                isSelected ? "selected" : ""
              }`}
              onClick={() => setSelectedDate(date)}
            >
              {date.getDate()}
              {hasTasks && <span className="dot"></span>}
            </div>
          );
        })}
      </div>

      {/* TASK HEADER */}
      <div className="task-header">
        <h3>
          Tasks for{" "}
          {selectedDate.toLocaleDateString("default", {
            month: "short",
            day: "numeric",
          })}
        </h3>
        <span>
          {pendingCount} Pending · {completedCount} Completed
        </span>
      </div>

      {/* TASK LIST */}
      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <p className="no-task">No tasks for this day</p>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task._id}
              className={`task-card ${
                task.completed ? "completed" : ""
              }`}
            >
              <div>
                <h4>{task.title}</h4>
                <p>{task.dueTime || "No time set"}</p>
              </div>

              <span className="time-badge">
                {task.dueTime || "--:--"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}