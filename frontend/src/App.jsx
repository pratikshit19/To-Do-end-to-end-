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

  /* ================= THEME ================= */

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );

    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  /* ================= TOKEN ================= */

  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

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

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setIsAuthenticated(false);
    setCurrentPage("home");
  };

  useEffect(() => {
    if (isAuthenticated) fetchTodos();
  }, [isAuthenticated]);

  /* ================= FLOW ================= */

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

  /* ================= PAGE RENDER ================= */

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

            {/* Floating Button */}
            <button
              onClick={() => setShowModal(true)}
              className="fixed bottom-24 md:bottom-8 right-6 md:right-55 w-12 h-12 md:w-140 md:h-15 rounded-xl bg-(--accent) text-white text-2xl flex items-center justify-center shadow-lg hover:scale-105 transition"
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
      <div className="min-h-screen bg-(--bg) text-(text-primary) pb-15">
        {/* ================= DESKTOP SIDEBAR ================= */}
        <aside className="hidden md:flex md:flex-col w-64 bg-(--bg) border-r border-(--border) shadow p-6 space-y-4">
          <div className="text-xl font-semibold mb-6">
            TaskFlow
          </div>

          {["home", "schedule", "insights", "profile", "settings"].map(
            (page) => (
              <div
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg cursor-pointer transition  ${
                  currentPage === page
                    ? "bg-(--accent)/20 text-(--accent)"
                    : "hover:bg-(--border)"
                }`}
              >
                {page.charAt(0).toUpperCase() + page.slice(1)}
              </div>
            )
          )}
        </aside>

        {/* ================= MAIN AREA ================= */}
        <div className="flex-1 flex flex-col">
          {/* Desktop Header */}
          <header className="hidden md:flex justify-between items-center px-8 py-4 shadow border-b border-(--border) bg-(--bg)">
            <h2 className="text-xl font-semibold">
              {currentPage.charAt(0).toUpperCase() +
                currentPage.slice(1)}
            </h2>
          </header>

          {/* Page Content */}
          <div className="flex-1 min-w-0 overflow-x-hidden px-5 py-8 md:px-10 md:py-8 w-full mx-auto">
            {renderPage()}
          </div>
        </div>
      </div>

      {/* ================= MOBILE NAVBAR ================= */}
      <div className="md:hidden">
        <Navbar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0  backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-transparent rounded-xl p-6 w-[95%] max-w-md flex items-center justify-center z-50">
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