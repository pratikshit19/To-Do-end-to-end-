import { useState, useEffect } from "react";
import { ArrowLeft, Edit, ChevronRight } from "lucide-react";
import "../Settings.css";

export default function Settings({ setCurrentPage, onLogout  }) {
  const [notifications, setNotifications] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
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
    <div className="settings-container">
      
      {/* Header */}
      <div className="settings-header">
        <ArrowLeft 
          className="back-icon"
          onClick={() => setCurrentPage("home")}
        />
        <h2>Settings</h2>
        <div className="profile-mini"></div>
      </div>

      {/* Profile Card */}
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

      {/* General */}
      <div className="settings-card">
        <h4>General</h4>

        <div className="setting-row">
          <span>Notifications</span>
          <div 
            className={`toggle ${notifications ? "active" : ""}`}
            onClick={() => setNotifications(!notifications)}
          />
        </div>

        <div className="setting-row">
          <span>Focus Mode</span>
          <div 
            className={`toggle ${focusMode ? "active" : ""}`}
            onClick={() => setFocusMode(!focusMode)}
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="settings-card">
        <h4>Appearance</h4>

        <div className="setting-row">
          <span>Dark Mode</span>
          <span className="active-label">
            {darkMode ? "ACTIVE" : "OFF"}
          </span>
        </div>

        <div className="color-row">
          <div className="color active"></div>
          <div className="color red"></div>
          <div className="color blue"></div>
        </div>
      </div>

      {/* Support */}
      <div className="settings-card">
        <h4>Support</h4>

        <div className="setting-row clickable">
          <span>Help Center</span>
          <ChevronRight size={18} />
        </div>

        <div className="setting-row clickable">
          <span>Privacy Policy</span>
          <ChevronRight size={18} />
        </div>

        <div className="setting-row clickable">
          <span>Terms of Service</span>
          <ChevronRight size={18} />
        </div>
      </div>

      {/* Logout */}
      <button 
        className="logout-button"
        onClick={onLogout}
      >
        LOG OUT
      </button>

    </div>
  );
}