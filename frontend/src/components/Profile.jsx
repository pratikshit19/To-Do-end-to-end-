import "../Profile.css";
import "../App.css";

export default function Profile({ onLogout }) {
  const username = localStorage.getItem("username");

  return (
    <div className="profile-container">

      {/* Profile Card */}
      <div className="profile-card-modern">

        <div className="profile-header">
          <div className="avatar-large">
            {username?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 className="profile-name">{username}</h2>
            <p className="profile-email">
              {username ? `${username}@app.com` : "No user logged in"}
            </p>
          </div>
        </div>

        <div className="profile-divider" />

        <div className="profile-meta">
          <div className="meta-item">
            <span className="meta-label">Account Type</span>
            <span className="meta-value">Free Plan</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Member Since</span>
            <span className="meta-value">2026</span>
          </div>
        </div>

      </div>

      {/* Logout Button */}
      <button className="logout-btn-modern" onClick={onLogout}>
        Logout
      </button>

    </div>
  );
}