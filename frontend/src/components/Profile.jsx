import "../Profile.css";
import "../App.css";

export default function Profile({ onLogout }) {
  const username = localStorage.getItem("username");

  return (
    <div className="profile-container">
      
      {/* Profile Header Card */}
      <div className="task-card-modern">
        <div className="profile-left">
          <div className="avatar">
            {username?.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="profile-right">
          <h2>{username}</h2>
          <p className="subtitle">
            {username ? `Welcome back, ${username}` : "No user logged in"}
          </p>
        </div>
      </div>

      {/* Logout Button BELOW card */}
      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>

    </div>
  );
}