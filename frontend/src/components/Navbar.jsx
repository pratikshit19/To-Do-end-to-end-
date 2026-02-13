import "../Navbar.css";

export default function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h2 className="navbar-logo">TaskFlow</h2>

        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
