import { useEffect, useState } from "react"; import { CreateTodo } from "./components/CreateTodo"; import { Todos } from "./components/Todos"; import Login from "./components/Login"; import Signup from "./components/Signup"; import ForgotPassword from "./components/ForgotPassword"; import Footer from "./components/Footer"; import Profile from "./components/Profile"; import Settings from "./components/Settings"; import Schedule from "./components/Schedule"; import Onboarding from "./components/Onboarding"; import Navbar from "./components/Navbar"; import Insights from "./components/Insights"; import { Toaster } from "react-hot-toast"; import "./App.css";

export default function App() {
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
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    setIsAuthenticated(false);
    setCurrentPage("home"); // reset page
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    }
  }, [isAuthenticated]);

  /* ----------------- SCREEN CONTROL FLOW ----------------- */

  // 1️⃣ Onboarding First
  if (showOnboarding) {
    return (
      <Onboarding
        onFinish={() => {
          localStorage.setItem("onboardingDone", "true");
          setShowOnboarding(false);
          setIsLogin(true); // force login
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

  // 3️⃣ Main App (Authenticated)
  return (
    <>
      <Toaster position="top-right" />

      {currentPage === "home" && (
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
      )}

      {currentPage === "profile" && (
        <Profile
          onLogout={handleLogout}
          setCurrentPage={setCurrentPage}
        />
      )}

      {currentPage === "schedule" && (
        <Schedule todos={todos} />
      )}

      {currentPage === "settings" && (
        <Settings
          setCurrentPage={setCurrentPage}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "insights" && (
        <Insights setCurrentPage={setCurrentPage} />
      )}

      {/* Hide navbar on profile + settings */}
      {currentPage !== "settings" &&
        currentPage !== "profile" && (
          <Navbar
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}

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
