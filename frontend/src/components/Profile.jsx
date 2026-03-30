import { ArrowLeft, Settings, Edit } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import "../Profile.css";
import "../Settings.css";

export default function Profile({
  setCurrentPage,
  tasks = [],
  focusSessions = [],
}) {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername =
      localStorage.getItem("username") ||
      sessionStorage.getItem("username");

    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  /* ---------------- TOTAL COMPLETED ---------------- */
  const totalCompleted = useMemo(() => {
    return tasks.filter((t) => t.completed).length;
  }, [tasks]);

  /* ---------------- COMPLETION % ---------------- */
  const completionPercentage = useMemo(() => {
    if (!tasks.length) return 0;
    const completed = tasks.filter((t) => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  /* ---------------- STREAK ---------------- */
  const streak = useMemo(() => {
    const completedDates = tasks
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
  }, [tasks]);

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

  /* ---------------- WEEKLY RANK (SIMULATED LOGIC) ---------------- */
  const weeklyRank = useMemo(() => {
    if (completionPercentage >= 90) return "Top 5%";
    if (completionPercentage >= 75) return "Top 15%";
    if (completionPercentage >= 60) return "Top 30%";
    return "Keep Pushing";
  }, [completionPercentage]);

  /* ---------------- GOALS ---------------- */
  const goals = useMemo(() => {
    const today = new Date().toDateString();

    const todayTasks = tasks.filter(
      (t) =>
        t.completed &&
        new Date(t.completedAt).toDateString() === today
    );

    const dailyReading = Math.min(
      Math.round((todayTasks.length / 5) * 100),
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
  }, [tasks, focusSessions]);

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-topbar">
        <ArrowLeft
          className="top-icon"
          onClick={() => setCurrentPage("home")}
        />
        <h3>Profile</h3>
        <Settings
          className="top-icon"
          onClick={() => setCurrentPage("settings")}
        />
      </div>

      {/* Avatar Section */}
      <div className="settings-card profile-card">
        <div className="profile-left">
          <div className="profile-avatar">
            {username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h3>{username || "User"}</h3>
            <span className="pro-badge">PRO MEMBER</span>
          </div>
        </div>
        <Edit size={18} />
      </div>

      {/* Accomplishments */}
      <div className="accomplishments">
        <p className="accomplishment-label">
          TOTAL ACCOMPLISHMENTS
        </p>
        <h1>
          {totalCompleted.toLocaleString()}{" "}
          <span>Tasks Completed</span>
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-title">CURRENT STREAK</p>
          <h3>{streak} Days</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">FOCUS TIME</p>
          <h3>{totalFocusTime}</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">COMPLETION</p>
          <h3>{completionPercentage}%</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">WEEKLY RANK</p>
          <h3>{weeklyRank}</h3>
        </div>
      </div>

      {/* Goals */}
      <div className="goals-section">
        <h4>Active Goals</h4>

        {goals.map((goal, index) => (
          <div className="goal" key={index}>
            <div className="goal-row">
              <span>{goal.name}</span>
              <span>{goal.percent}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${goal.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <button className="primary-btn">
        Edit Profile
      </button>
      <button
        className="secondary-btn"
        onClick={() => setCurrentPage("insights")}
      >
        View Full Insights
      </button>
    </div>
  );
}