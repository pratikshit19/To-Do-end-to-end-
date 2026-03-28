import { useEffect, useState } from "react";
import { CreateTodo } from "./components/CreateTodo";
import { Todos } from "./components/Todos";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import Footer from "./components/Footer";
import Profile from "./components/Profile";
import Schedule from "./components/Schedule";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!(localStorage.getItem("token") || sessionStorage.getItem("token"))
  );
  const [isLogin, setIsLogin] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");

  const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  const fetchTodos = async () => {
    const token = getToken();
    if (!token) return; // no token, don't fetch

    try {
      const response = await fetch("https://to-do-app-616k.onrender.com/todos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        // token invalid/expired
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
  };

  useEffect(() => {
    if (isAuthenticated) fetchTodos();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
  return isLogin === true ? (
    <Login setIsAuthenticated={setIsAuthenticated} setIsLogin={setIsLogin} />
  ) : isLogin === false ? (
    <Signup setIsLogin={setIsLogin} />
  ) : (
    <ForgotPassword setIsLogin={setIsLogin} />
  );
}

  return (
    <>
      <Toaster position="top-right" />

      {currentPage === "home" && (
        <>
          <Todos todos={todos} fetchTodos={fetchTodos} onLogout={handleLogout} />
          <button className="floating-button" onClick={() => setShowModal(true)}>+</button>
        </>
      )}

      {currentPage === "profile" && <Profile onLogout={handleLogout} />}
      {currentPage === "schedule" && <Schedule todos={todos} />}

      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <CreateTodo fetchTodos={fetchTodos} closeModal={() => setShowModal(false)} />
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default App;