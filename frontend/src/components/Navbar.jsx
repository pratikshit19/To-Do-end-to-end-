import { Home, Calendar, LineChart, User } from "lucide-react";
import "../Navbar.css";

export default function Navbar({ currentPage, setCurrentPage }) {
  return (
    <div className="bottom-nav">

      <div
        className={`nav-item ${currentPage === "home" ? "active" : ""}`}
        onClick={() => setCurrentPage("home")}
      >
        <Home size={22} />
        <span>Today</span>
      </div>

      <div
        className={`nav-item ${currentPage === "schedule" ? "active" : ""}`}
        onClick={() => setCurrentPage("schedule")}
      >
        <Calendar size={22} />
        <span>Schedule</span>
      </div>

      <div className="nav-item">
        <LineChart size={22} />
        <span>Insights</span>
      </div>

      <div
        className={`nav-item ${currentPage === "profile" ? "active" : ""}`}
        onClick={() => setCurrentPage("profile")}
      >
        <User size={22} />
        <span>Profile</span>
      </div>

    </div>
  );
}