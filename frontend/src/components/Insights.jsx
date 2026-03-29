import { ArrowLeft, Settings } from "lucide-react";
import "../Insights.css";

export default function Insights({ setCurrentPage }) {
  return (
    <div className="insights-page">

      {/* Top Bar */}
      <div className="insights-topbar">
        <ArrowLeft
          className="top-icon"
          onClick={() => setCurrentPage("home")}
        />
        <h3>Insights</h3>
        <Settings className="top-icon" onClick={() => setCurrentPage("settings")}/>
      </div>

      {/* Weekly Efficiency */}
      <div className="insight-card large">
        <p className="card-label">WEEKLY EFFICIENCY</p>
        <h1 className="big-score">94%</h1>
        <p className="positive">+12% vs last week</p>

        <p className="card-subtext">
          You've completed 42 out of 45 tasks this week.
          Keep running focus sessions are driving most of your progress.
        </p>

        <div className="fake-chart">
          <div className="bar small"></div>
          <div className="bar medium"></div>
          <div className="bar tall active"></div>
          <div className="bar medium"></div>
          <div className="bar small"></div>
        </div>
      </div>

      {/* Streak */}
      <div className="insight-card center">
        <div className="circle-icon">🔥</div>
        <p>Current Streak</p>
        <h2>14</h2>
        <span>Days in a row</span>

        <div className="progress-line">
          <div className="progress-fill" style={{ width: "70%" }} />
        </div>
        <small>7 DAYS TO NEXT MILESTONE</small>
      </div>

      {/* Category */}
      <div className="insight-card">
        <p className="card-label">Top Category</p>
        <h3>Deep Work</h3>
        <span className="tag">12h 40m</span>
      </div>

      {/* Peak Time */}
      <div className="insight-card">
        <p className="card-label">Peak Energy</p>
        <h3>9:00 AM</h3>
        <span className="tag red">Ultimate Focus</span>
      </div>

      {/* Monthly Balance */}
      <div className="insight-card">
        <p className="card-label">Task Distribution</p>
        <h3>Monthly Balance</h3>

        <div className="donut">
          <div className="donut-inner">68%</div>
        </div>
      </div>

    </div>
  );
}