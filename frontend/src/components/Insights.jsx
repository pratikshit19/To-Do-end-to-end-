import { ArrowLeft, Settings } from "lucide-react";
import { useMemo } from "react";
import "../Insights.css";

export default function Insights({ setCurrentPage, tasks = [], focusSessions = [] }) {
  
  /* -------------------- WEEKLY DATA -------------------- */

  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - 6);

    const thisWeekTasks = tasks.filter(t => {
      const date = new Date(t.completedAt);
      return t.completed && date >= startOfWeek;
    });

    const totalThisWeek = tasks.filter(t => {
      const date = new Date(t.createdAt);
      return date >= startOfWeek;
    });

    const efficiency = totalThisWeek.length
      ? Math.round((thisWeekTasks.length / totalThisWeek.length) * 100)
      : 0;

    return {
      completed: thisWeekTasks.length,
      total: totalThisWeek.length,
      efficiency
    };
  }, [tasks]);

  /* -------------------- STREAK -------------------- */

  const streak = useMemo(() => {
    const completedDates = tasks
      .filter(t => t.completed)
      .map(t => new Date(t.completedAt).toDateString());

    const uniqueDates = [...new Set(completedDates)].sort(
      (a, b) => new Date(b) - new Date(a)
    );

    let count = 0;
    let currentDate = new Date();

    for (let i = 0; i < uniqueDates.length; i++) {
      const compareDate = new Date(uniqueDates[i]);
      if (
        compareDate.toDateString() === currentDate.toDateString()
      ) {
        count++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
  }, [tasks]);

  /* -------------------- TOP CATEGORY -------------------- */

  const topCategory = useMemo(() => {
    const categoryMap = {};

    tasks.forEach(task => {
      if (task.completed) {
        categoryMap[task.category] =
          (categoryMap[task.category] || 0) + 1;
      }
    });

    let max = 0;
    let top = "None";

    for (let cat in categoryMap) {
      if (categoryMap[cat] > max) {
        max = categoryMap[cat];
        top = cat;
      }
    }

    return top;
  }, [tasks]);

  /* -------------------- PEAK HOUR -------------------- */

  const peakHour = useMemo(() => {
    const hourMap = {};

    focusSessions.forEach(session => {
      const hour = new Date(session.date).getHours();
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });

    let max = 0;
    let peak = null;

    for (let hour in hourMap) {
      if (hourMap[hour] > max) {
        max = hourMap[hour];
        peak = hour;
      }
    }

    return peak !== null ? `${peak}:00` : "N/A";
  }, [focusSessions]);

  /* -------------------- MONTHLY COMPLETION -------------------- */

  const monthlyCompletion = useMemo(() => {
    const now = new Date();
    const thisMonthTasks = tasks.filter(t => {
      const date = new Date(t.createdAt);
      return date.getMonth() === now.getMonth();
    });

    const completedMonth = thisMonthTasks.filter(t => t.completed);

    return thisMonthTasks.length
      ? Math.round((completedMonth.length / thisMonthTasks.length) * 100)
      : 0;
  }, [tasks]);

  return (
    <div className="insights-page">

      {/* Top Bar */}
      <div className="insights-topbar">
        <ArrowLeft
          className="top-icon"
          onClick={() => setCurrentPage("home")}
        />
        <h3>Insights</h3>
        <Settings
          className="top-icon"
          onClick={() => setCurrentPage("settings")}
        />
      </div>

      {/* Weekly Efficiency */}
      <div className="insight-card large">
        <p className="card-label">WEEKLY EFFICIENCY</p>
        <h1 className="big-score">{weeklyData.efficiency}%</h1>

        <p className="positive">
          {weeklyData.completed} / {weeklyData.total} tasks completed
        </p>

        <p className="card-subtext">
          Keep going! Consistency builds momentum.
        </p>

        <div className="fake-chart">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`bar ${
                i === 6 ? "tall active" : "medium"
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Streak */}
      <div className="insight-card center">
        <div className="circle-icon">🔥</div>
        <p>Current Streak</p>
        <h2>{streak}</h2>
        <span>Days in a row</span>

        <div className="progress-line">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(streak * 5, 100)}%` }}
          />
        </div>
      </div>

      {/* Top Category */}
      <div className="insight-card">
        <p className="card-label">Top Category</p>
        <h3>{topCategory}</h3>
        <span className="tag">
          Most Completed
        </span>
      </div>

      {/* Peak Time */}
      <div className="insight-card">
        <p className="card-label">Peak Energy</p>
        <h3>{peakHour}</h3>
        <span className="tag red">
          Highest Focus Hour
        </span>
      </div>

      {/* Monthly Balance */}
      <div className="insight-card">
        <p className="card-label">Task Distribution</p>
        <h3>Monthly Completion</h3>

        <div className="donut">
          <div className="donut-inner">
            {monthlyCompletion}%
          </div>
        </div>
      </div>

    </div>
  );
}