import { useState, useEffect } from "react";
import { ArrowLeft, Edit, ChevronRight } from "lucide-react";

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

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const storedUsername =
      localStorage.getItem("username") ||
      sessionStorage.getItem("username");

    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  /* ================= LOCAL STORAGE ================= */
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

  /* ================= TOGGLE UI ================= */
  const Toggle = ({ enabled, onClick }) => (
    <div
      onClick={onClick}
      className={`w-12 h-6 flex items-center rounded-full cursor-pointer transition ${
        enabled ? "bg-(--accent)" : "bg-gray-400"
      }`}
    >
      <div
        className={`h-5 w-5 bg-white rounded-full shadow-md transform transition ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-(--bg-primary) pb-20 text-(--text-primary) md:px-10 transition-colors duration-300">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-6">
        <ArrowLeft
          className="cursor-pointer"
          onClick={() => setCurrentPage("home")}
        />
        <h2 className="text-xl font-semibold">Settings</h2>
        <div />
      </div>

      {/* ================= PROFILE CARD ================= */}
      {/* <div className="bg-(--card-bg) rounded-2xl p-5 shadow-md mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xl font-bold">
            {username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {username || "User"}
            </h3>
            <span className="text-xs px-2 py-1 bg-yellow-400 text-black rounded-full">
              PRO MEMBER
            </span>
          </div>
        </div>
        <Edit size={18} className="cursor-pointer opacity-70" />
      </div> */}

      {/* ================= GENERAL ================= */}
      <div className="bg-(--card-bg) rounded-2xl p-5 shadow-md mb-6 border border-(--border)">
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-(--text-secondary)">
          General
        </h4>

        <div className="flex items-center justify-between mb-4">
          <span>Notifications</span>
          <Toggle
            enabled={notifications}
            onClick={() => setNotifications(!notifications)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span>Focus Mode</span>
          <Toggle
            enabled={focusMode}
            onClick={() => setFocusMode(!focusMode)}
          />
        </div>
      </div>

      {/* ================= APPEARANCE ================= */}
      <div className="bg-(--card-bg) rounded-2xl p-5 shadow-md mb-6 border border-(--border)">
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-(--text-secondary)">
          Appearance
        </h4>

        <div className="flex items-center justify-between mb-6">
          <span>Dark Mode</span>
          <Toggle
            enabled={darkMode}
            onClick={() => setDarkMode(!darkMode)}
          />
        </div>

        <div className="flex gap-4">
          {["#2dd3ee", "#249E94", "#3b82f6"].map((color) => (
            <div
              key={color}
              onClick={() => setAccentColor(color)}
              className={`w-8 h-8 rounded-full cursor-pointer border-4 transition ${
                accentColor === color
                  ? "border-white scale-110"
                  : "border-transparent"
              }`}
              style={{ background: color }}
            />
          ))}
        </div>
      </div>

      {/* ================= SUPPORT ================= */}
      <div className="bg-(--card-bg) rounded-2xl p-5 shadow-md mb-6 border border-(--border)">
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-(--text-secondary)">
          Support
        </h4>

        {["Help Center", "Privacy Policy", "Terms of Service"].map(
          (item) => (
            <div
              key={item}
              className="flex items-center justify-between py-3 border-b border-(--border) last:border-none cursor-pointer hover:opacity-70 transition"
            >
              <span>{item}</span>
              <ChevronRight size={18} />
            </div>
          )
        )}
      </div>

      {/* ================= LOGOUT ================= */}
      <button
        onClick={onLogout}
        className="w-full py-3 rounded-xl bg-red-500/20 hover:bg-red-500/50 text-red-500 hover:text-white font-semibold transition"
      >
        LOG OUT
      </button>
    </div>
  );
}