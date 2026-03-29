import { ArrowLeft, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import "../Profile.css";
import "../Settings.css";
import { Edit } from "lucide-react";

export default function Profile({ setCurrentPage }) {
  // const username = localStorage.getItem("username") || "User";
  const [username, setUsername] = useState("");
  useEffect(() => {
      const storedUsername =
        localStorage.getItem("username") ||
        sessionStorage.getItem("username");
  
      if (storedUsername) {
        setUsername(storedUsername);
      }
    }, []);

  return (
    <div className="profile-page">

      {/* Header */}
      <div className="profile-topbar">
        <ArrowLeft
          className="top-icon"
          onClick={() => setCurrentPage("home")}
        />
        <h3>Profile</h3>
        <Settings className="top-icon" onClick={() => setCurrentPage("settings")} />
      </div>

      {/* Avatar Section */}
      <div className="settings-card profile-card">
        <div className="profile-left">
          <div className="profile-avatar"></div>
          <div>
            <h3>{username || "User"}</h3>
            <span className="pro-badge">PRO MEMBER</span>
          </div>
        </div>
        <Edit size={18} />
      </div>

      {/* Accomplishments */}
      <div className="accomplishments">
        <p className="accomplishment-label">TOTAL ACCOMPLISHMENTS</p>
        <h1>1,248 <span>Tasks Completed</span></h1>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-title">CURRENT STREAK</p>
          <h3>14 Days</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">FOCUS TIME</p>
          <h3>128h 40m</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">COMPLETION</p>
          <h3>94%</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">WEEKLY RANK</p>
          <h3>Top 5%</h3>
        </div>
      </div>

      {/* Goals */}
      <div className="goals-section">
        <h4>Active Goals</h4>

        <div className="goal">
          <div className="goal-row">
            <span>Daily Reading</span>
            <span>66%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "66%" }} />
          </div>
        </div>

        <div className="goal">
          <div className="goal-row">
            <span>Meditation</span>
            <span>50%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "50%" }} />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <button className="primary-btn">Edit Profile</button>
      <button className="secondary-btn">View Full Insights</button>

    </div>
  );
}