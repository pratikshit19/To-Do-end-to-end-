import toast from "react-hot-toast";
import { useEffect, useState, useRef } from "react";
import { SettingsIcon } from "lucide-react";

export function Todos({ todos = [], fetchTodos }) {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [activeFilter, setActiveFilter] = useState("focused");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  /* ---------------- DATE LOGIC ---------------- */

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const filteredTodos = todos.filter((todo) => {
    if (!todo.dueDate) return false;

    const due = new Date(todo.dueDate);
    due.setHours(0, 0, 0, 0);

    if (activeFilter === "focused") {
      return isSameDay(due, today);
    }

    if (activeFilter === "upcoming") {
      return due > today;
    }

    if (activeFilter === "completed") {
      return isSameDay(due, today) && todo.completed;
    }

    return true;
  });

  /* ---------------- MENU ---------------- */

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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------- DELETE ---------------- */

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

  /* ---------------- TOGGLE COMPLETE ---------------- */

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
            priority: todo.priority,
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

  /* ---------------- PROGRESS ---------------- */

  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercentage =
    todos.length > 0
      ? Math.round((completedCount / todos.length) * 100)
      : 0;

  /* ---------------- RENDER ---------------- */

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

        <div className="today-text">TaskFlow</div>
        {/* <div className="settings-icon">⚙</div> */}
        <SettingsIcon className="settings-icon"/>
      </div>

      {/* PROGRESS */}
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
        <button
  className={`pill ${activeFilter === "all" ? "active" : ""}`}
  onClick={() => setActiveFilter("all")}
>
  All
</button>
        <button
          className={`pill ${
            activeFilter === "focused" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("focused")}
        >
          Focused
        </button>

        <button
          className={`pill ${
            activeFilter === "upcoming" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("upcoming")}
        >
          Upcoming
        </button>

        <button
          className={`pill ${
            activeFilter === "completed" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("completed")}
        >
          Completed
        </button>
      </div>

      {/* EMPTY STATE PER FILTER */}
      {filteredTodos.length === 0 ? (
        <div className="empty-state">
          <p>
  {activeFilter === "focused" && "No tasks for today 🎉"}
  {activeFilter === "upcoming" && "No upcoming tasks"}
  {activeFilter === "completed" && "No completed tasks yet"}
</p>
        </div>
      ) : (
        <div className="task-list-modern">
          {filteredTodos.map((todo) => (
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
                  <h3
                    className={
                      todo.completed ? "completed-text" : ""
                    }
                  >
                    {todo.title}
                  </h3>

                  <span
                    className={`tag priority-${
                      todo.priority || "medium"
                    }`}
                  >
                    {(todo.priority || "medium").toUpperCase()}
                  </span>
                </div>

                <p>{todo.description}</p>

                {todo.dueDate && (
                  <div className="task-datetime">
                    📅{" "}
                    {new Date(
                      todo.dueDate
                    ).toLocaleDateString()}
                    {todo.dueTime && ` • ${todo.dueTime}`}
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
      )}
    </div>
  );
}