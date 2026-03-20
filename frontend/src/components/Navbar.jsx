import { useState } from "react";
import "../Navbar.css";

export default function Navbar({ onLogout, onAddClick }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">

          {/* LEFT: Hamburger */}
          <button 
            className="menu-button"
            onClick={() => setIsOpen(true)}
          >
            ☰
          </button>

          {/* LOGO */}
          <h2 className="navbar-logo">TaskFlow</h2>

          {/* RIGHT */}
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>

        </div>
      </nav>

      {/* DRAWER */}
      <div className={`drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>Menu</h3>
          <button className="cross-drawer" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        <div className="drawer-content">
          <button onClick={onAddClick}>➕ Add Task</button>
          <button>📋 My Tasks</button>
          <button>⚙️ Settings</button>
        </div>
      </div>

      {/* OVERLAY */}
      {isOpen && (
        <div 
          className="drawer-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
