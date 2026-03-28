import toast from "react-hot-toast";
import { useEffect, useState, useRef } from "react";

export function Todos({ todos, fetchTodos }) {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.reload();
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (id) => {
    const toastId = toast.loading("Deleting task...");
    try {
      const response = await fetch(
        `https://to-do-app-616k.onrender.com/todos/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }
      await fetchTodos();
      toast.success("Task deleted", { id: toastId });

    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

 const handleToggleComplete = async (todo) => {
  try {
    const response = await fetch(
      `https://to-do-app-616k.onrender.com/todos/${todo._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completed: !todo.completed,
          priority: todo.priority
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update todo");
    }

    await fetchTodos();
  } catch (err) {
    console.error(err);
  }
};

  if (!todos || todos.length === 0) {
    return <div className="empty-state"><p >No tasks yet.Your tasks will appear here!</p></div>;
  }

  // ✅ Progress calculations
  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercentage = Math.round(
    (completedCount / todos.length) * 100
  );

  return (
  <div className="app-wrapper">
    {/* HEADER */}
    <div className="today-header">
      <div className="avatar-wrapper" ref={menuRef}>
  <div
    className="avatar-circle"
    onClick={() => setShowMenu(!showMenu)}
  >
    {username?.charAt(0).toUpperCase() || "U"}
  </div>

  {showMenu && (
    <div className="profile-dropdown">
      <p className="dropdown-user">{username}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )}
</div>
      <div className="today-text">Today</div>
      <div className="settings-icon">⚙</div>
    </div>

    {/* PROGRESS SECTION */}
    <div className="progress-container">
      <p className="progress-sub">Daily Progress</p>

      <div className="progress-row">
        <h2>
          {completedCount} of {todos.length} <span>Tasks</span>
        </h2>
        <span className="percent">{progressPercentage}%</span>
      </div>

      <div className="progress-bar-modern">
        <div
          className="progress-fill-modern"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>

    {/* FILTER PILLS */}
    <div className="filter-pills">
      <button className="pill active">Focused</button>
      <button className="pill">Upcoming</button>
      <button className="pill">Completed</button>
    </div>

    {/* TASKS */}
    <div className="task-list-modern">
      {todos.map((todo) => (
        <div key={todo._id} className="task-card-modern">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleComplete(todo)}
            />
          </div>

          <div className="task-content">
            <div className="task-top">
              <h3 className={todo.completed ? "completed-text" : ""}>
                {todo.title}
              </h3>
              <span className={`tag priority-${todo.priority || "medium"}`}>
  {(todo.priority || "medium").toUpperCase()}
</span>
            </div>
            <p>{todo.description}</p>

{todo.dueDate && (
  <div className="task-datetime">
    📅 {new Date(todo.dueDate).toLocaleDateString()}
    {todo.dueTime && ` • ⏰ ${todo.dueTime}`}
  </div>
)}
          </div>

          <button
            className="delete-modern"
            onClick={() => handleDelete(todo._id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  </div>
);
}
