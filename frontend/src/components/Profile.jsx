import "../Profile.css";

export default function Profile({ onLogout }) {
  const username = localStorage.getItem("username");

  return (
    <div className="profile-container">
      <div className="profile-card">

        <div className="avatar">
          {username?.charAt(0).toUpperCase()}
        </div>

        <h2>{username}</h2>
        <p className="subtitle">Logged in user</p>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>

      </div>
    </div>
  );
}