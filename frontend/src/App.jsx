import { useEffect, useState } from "react";
import { CreateTodo } from "./components/CreateTodo";
import { Todos } from "./components/Todos";
import Login from "./components/Login";
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  // 🔥 Fetch Todos (with token)
  const fetchTodos = async () => {
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:5000/todos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log("Unauthorized");
      setIsAuthenticated(false);
      return;
    }

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

  // 🔐 If not logged in → show login page
  if (!isAuthenticated) {
    return <Login setIsAuthenticated={setIsAuthenticated} />;
  }

  return (
    <>
      <button onClick={handleLogout}>Logout</button>
      <CreateTodo fetchTodos={fetchTodos} />
      <Todos todos={todos} fetchTodos={fetchTodos} />
    </>
  );
}

export default App;
