import { useEffect, useState } from "react";
import { CreateTodo } from "./components/CreateTodo";
import { Todos } from "./components/Todos";
import Login from "./components/Login";
import Signup from "./components/Signup";
import "./App.css";
import Navbar from "./components/Navbar";

function App() {
  const [todos, setTodos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [isLogin, setIsLogin] = useState(true);
  const [showModal, setShowModal] = useState(false); // 👈 NEW

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
      <Navbar onLogout={handleLogout} />

      {/* Only show Todos */}
      <Todos todos={todos} fetchTodos={fetchTodos} />

      {/* Floating Add Button */}
      <button
        className="floating-button"
        onClick={() => setShowModal(true)}
      >
        Add new task
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <CreateTodo fetchTodos={fetchTodos} closeModal={() => setShowModal(false)}/>
            
          </div>
        </div>
      )}
    </>
  );
}

export default App;
