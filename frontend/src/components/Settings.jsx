import { useState, useEffect } from "react";
import { ArrowLeft, Edit, ChevronRight } from "lucide-react";
import "../Settings.css";

export default function Settings({
  setCurrentPage,
  darkMode,
  setDarkMode,
  onLogout,
}) {
  const [notifications, setNotifications] = useState(
    localStorage.getItem("notifications") === "false" ? false : true
  );

  const [focusMode, setFocusMode] = useState(
    localStorage.getItem("focusMode") === "true"
  );

  const [username, setUsername] = useState("");
  const [accentColor, setAccentColor] = useState(
    localStorage.getItem("accentColor") || "#2dd3ee"
  );

  useEffect(() => {
    const storedUsername =
      localStorage.getItem("username") ||
      sessionStorage.getItem("username");

    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("notifications", notifications);
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("focusMode", focusMode);
  }, [focusMode]);

  useEffect(() => {
    localStorage.setItem("accentColor", accentColor);
    document.documentElement.style.setProperty("--accent", accentColor);
  }, [accentColor]);

  return (
    <div className="settings-container">
      <div className="settings-header">
        <ArrowLeft
          className="back-icon"
          onClick={() => setCurrentPage("home")}
        />
        <h2>Settings</h2>
        <div></div>
      </div>

      <div className="settings-card profile-card">
        <div className="profile-left">
          <div className="profile-avatar">{username?.charAt(0).toUpperCase() || "U"}</div>
          <div>
            <h3>{username || "User"}</h3>
            <span className="pro-badge">PRO MEMBER</span>
          </div>
        </div>
        <Edit size={18} />
      </div>

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

      <div className="settings-card">
        <h4>Appearance</h4>

        <div className="setting-row">
          <span>Dark Mode</span>
          <div
            className={`toggle ${darkMode ? "active" : ""}`}
            onClick={() => setDarkMode(!darkMode)}
          />
        </div>

        <div className="color-row">
          <div
            className={`color ${accentColor === "#2dd3ee" ? "active" : ""}`}
            onClick={() => setAccentColor("#2dd3ee")}
            style={{ background: "#2dd3ee" }}
          />

          <div
            className={`color ${accentColor === "#ff7759" ? "active" : ""}`}
            onClick={() => setAccentColor("#ff7759")}
            style={{ background: "#ff7759" }}
          />

          <div
            className={`color ${accentColor === "#3b82f6" ? "active" : ""}`}
            onClick={() => setAccentColor("#3b82f6")}
            style={{ background: "#3b82f6" }}
          />
        </div>
      </div>

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

      <button className="logout-button" onClick={onLogout}>
        LOG OUT
      </button>
    </div>
  );
}