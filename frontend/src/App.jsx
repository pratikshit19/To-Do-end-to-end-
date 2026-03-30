import { useEffect, useState } from "react";
import { CreateTodo } from "./components/CreateTodo";
import { Todos } from "./components/Todos";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Schedule from "./components/Schedule";
import Onboarding from "./components/Onboarding";
import Navbar from "./components/Navbar";
import Insights from "./components/Insights";
import { Toaster } from "react-hot-toast";
import "./App.css";

export default function App() {
  /* ================= STATE ================= */

  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem("onboardingDone")
  );

  const [todos, setTodos] = useState([]);

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!(localStorage.getItem("token") || sessionStorage.getItem("token"))
  );

  const [isLogin, setIsLogin] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "false" ? false : true
  );

  /* ================= THEME CONTROL ================= */

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );

    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  /* ================= TOKEN HELPER ================= */

  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

  /* ================= FETCH TODOS ================= */

  const fetchTodos = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        "https://to-do-app-616k.onrender.com/todos",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 403) {
        handleLogout();
        return;
      }

      const data = await response.json();
      setTodos(data.todos || []);
    } catch (err) {
      console.error("Failed to fetch todos:", err);
    }
  };

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setIsAuthenticated(false);
    setCurrentPage("home");
  };

  useEffect(() => {
    if (isAuthenticated) fetchTodos();
  }, [isAuthenticated]);

  /* ================= SCREEN FLOW ================= */

  // 1️⃣ Onboarding
  if (showOnboarding) {
    return (
      <Onboarding
        onFinish={() => {
          localStorage.setItem("onboardingDone", "true");
          setShowOnboarding(false);
          setIsLogin(true);
        }}
      />
    );
  }

  // 2️⃣ Auth Screens
  if (!isAuthenticated) {
    if (isLogin === true)
      return (
        <Login
          setIsAuthenticated={setIsAuthenticated}
          setIsLogin={setIsLogin}
        />
      );

    if (isLogin === false)
      return <Signup setIsLogin={setIsLogin} />;

    return <ForgotPassword setIsLogin={setIsLogin} />;
  }

  /* ================= PAGE RENDER HELPER ================= */

  const renderPage = () => {
    switch (currentPage) {
      case "profile":
        return (
          <Profile
            onLogout={handleLogout}
            setCurrentPage={setCurrentPage}
          />
        );

      case "schedule":
        return <Schedule todos={todos} />;

      case "settings":
        return (
          <Settings
            setCurrentPage={setCurrentPage}
            onLogout={handleLogout}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        );

      case "insights":
        return <Insights setCurrentPage={setCurrentPage} />;

      default:
        return (
          <>
            <Todos
              todos={todos}
              fetchTodos={fetchTodos}
              onLogout={handleLogout}
              setCurrentPage={setCurrentPage}
            />

            <button
              className="floating-button"
              onClick={() => setShowModal(true)}
            >
              +
            </button>
          </>
        );
    }
  };

  /* ================= MAIN APP ================= */

  return (
    <>
      <Toaster position="top-right" />

      <div className="layout">
        {/* ===== Desktop Sidebar ===== */}
        <aside className="sidebar">
          <div className="sidebar-logo">TaskFlow</div>

          <div
            className={`sidebar-item ${
              currentPage === "home" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("home")}
          >
            Home
          </div>

          <div
            className={`sidebar-item ${
              currentPage === "schedule" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("schedule")}
          >
            Schedule
          </div>

          <div
            className={`sidebar-item ${
              currentPage === "insights" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("insights")}
          >
            Insights
          </div>

          <div
            className={`sidebar-item ${
              currentPage === "profile" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("profile")}
          >
            Profile
          </div>

          <div
            className={`sidebar-item ${
              currentPage === "settings" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("settings")}
          >
            Settings
          </div>
        </aside>

        {/* ===== Main Area ===== */}
        <div className="main-area">
          <header className="desktop-header">
            <h2>
              {currentPage.charAt(0).toUpperCase() +
                currentPage.slice(1)}
            </h2>
          </header>

          <div className="page-content">
            {renderPage()}
          </div>
        </div>
      </div>

      {/* ===== Mobile Bottom Navbar ===== */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {/* ===== Modal ===== */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <CreateTodo
              fetchTodos={fetchTodos}
              closeModal={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}