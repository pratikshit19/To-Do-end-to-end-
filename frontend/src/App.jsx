import { useEffect, useState } from "react";
import { CreateTodo } from "./components/CreateTodo";
import { Todos } from "./components/Todos";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Footer from "./components/Footer";
import Profile from "./components/Profile";   // 👈 NEW
import Schedule from "./components/Schedule";   // 👈 NEW
import "./App.css";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";

function App() {
  const [todos, setTodos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [isLogin, setIsLogin] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState("home"); // 👈 NEW

  const fetchTodos = async () => {
    const token = localStorage.getItem("token");

    const response = await fetch("https://to-do-app-616k.onrender.com/todos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    setTodos(data.todos);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return isLogin ? (
      <Login
        setIsAuthenticated={setIsAuthenticated}
        setIsLogin={setIsLogin}
      />
    ) : (
      <Signup setIsLogin={setIsLogin} />
    );
  }

  return (
  <>
    <Toaster position="top-right" />

    {/* PAGE CONTENT */}
    {currentPage === "home" && (
      <>
        <Todos todos={todos} fetchTodos={fetchTodos} />

        <button
          className="floating-button"
          onClick={() => setShowModal(true)}
        >
          +
        </button>
      </>
    )}

    {currentPage === "profile" && (
      <Profile onLogout={handleLogout} />
    )}

    {currentPage === "schedule" && (
      <Schedule todos={todos} />
    )}

    {/* Bottom Navigation */}
    <Navbar
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    />

    {/* Modal */}
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

    <Footer />
  </>
);
}

export default App;