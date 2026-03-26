import { Home, Calendar, LineChart, User } from "lucide-react";
import "../Navbar.css";

export default function Navbar() {
  return (
    <div className="bottom-nav">
      <div className="nav-item active">
        <Home size={22} />
        <span>Today</span>
      </div>

      <div className="nav-item">
        <Calendar size={22} />
        <span>Schedule</span>
      </div>

      <div className="nav-item">
        <LineChart size={22} />
        <span>Insights</span>
      </div>

      <div className="nav-item">
        <User size={22} />
        <span>Profile</span>
      </div>
    </div>
  );
}