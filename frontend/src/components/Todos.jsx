import toast from "react-hot-toast";
import { useEffect, useState, useRef } from "react";
import { DeleteIcon, SettingsIcon } from "lucide-react";

export function Todos({ todos = [], fetchTodos, onLogout, setCurrentPage }) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const username =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username");

  const [activeFilter, setActiveFilter] = useState("focused");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  /* ---------------- SWIPE STATE ---------------- */
  const [dragX, setDragX] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const startXRef = useRef(0);
  const [openId, setOpenId] = useState(null);
  const ACTION_WIDTH = 55;

  /* ---------------- DATE LOGIC ---------------- */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDay = (date1, date2) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

  const filteredTodos = todos.filter((todo) => {
    if (activeFilter === "all") return true;
    if (!todo.dueDate) return false;

    const due = new Date(todo.dueDate);
    due.setHours(0, 0, 0, 0);

    if (activeFilter === "focused") return isSameDay(due, today);
    if (activeFilter === "upcoming") return due > today;
    if (activeFilter === "completed") return todo.completed;
    return true;
  });

  /* ---------------- CLOSE MENU ON OUTSIDE CLICK ---------------- */
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    const toastId = toast.loading("Deleting task...");
    try {
      const response = await fetch(
        `https://to-do-app-616k.onrender.com/todos/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete todo");

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

      if (!response.ok) throw new Error("Failed to update todo");

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

  /* ---------------- SWIPE LOGIC ---------------- */
  const handleStart = (clientX, id) => {
    startXRef.current = clientX;
    setDraggingId(id);
  };

  const handleMove = (clientX, id) => {
    if (draggingId !== id) return;

    const delta = startXRef.current - clientX;

    if (delta > 0) {
      setDragX(Math.min(delta, ACTION_WIDTH));
    } else {
      setDragX(0);
    }
  };

  const handleEnd = (id) => {
    if (dragX > ACTION_WIDTH / 2) {
      setDragX(ACTION_WIDTH);
      setOpenId(id);
    } else {
      setDragX(0);
      setOpenId(null);
    }
    setDraggingId(null);
  };

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
              <button onClick={onLogout}>Logout</button>
            </div>
          )}
        </div>

        <div className="today-text">TaskFlow</div>
        <SettingsIcon
          className="settings-icon"
          onClick={() => setCurrentPage("settings")}
        />
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

      {/* FILTERS */}
      <div className="filter-pills">
        {["all", "focused", "upcoming", "completed"].map((filter) => (
          <button
            key={filter}
            className={`pill ${
              activeFilter === filter ? "active" : ""
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* TASK LIST */}
      {filteredTodos.length === 0 ? (
        <div className="empty-state">
          <p>No tasks here 🎉</p>
        </div>
      ) : (
        <div className="task-list-modern">
          {filteredTodos.map((todo) => (
            <div key={todo._id} className="swipe-wrapper">
              <div className="swipe-actions">
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(todo._id)}
                >
                  <DeleteIcon size={18} />
                  DELETE
                </button>
              </div>

              <div
                className="task-card-modern"
                style={{
                  transform:
                    openId === todo._id
                      ? `translateX(-${ACTION_WIDTH}px)`
                      : draggingId === todo._id
                      ? `translateX(-${dragX}px)`
                      : "translateX(0px)",
                  transition:
                    draggingId === todo._id
                      ? "none"
                      : "transform 0.25s ease",
                }}
                onTouchStart={(e) =>
                  handleStart(
                    e.targetTouches[0].clientX,
                    todo._id
                  )
                }
                onTouchMove={(e) =>
                  handleMove(
                    e.targetTouches[0].clientX,
                    todo._id
                  )
                }
                onTouchEnd={() => handleEnd(todo._id)}
                onMouseDown={(e) =>
                  handleStart(e.clientX, todo._id)
                }
                onMouseMove={(e) =>
                  draggingId &&
                  handleMove(e.clientX, todo._id)
                }
                onMouseUp={() => handleEnd(todo._id)}
                onMouseLeave={() =>
                  draggingId && handleEnd(todo._id)
                }
              >
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() =>
                      handleToggleComplete(todo)
                    }
                  />
                </div>

                <div className="task-content">
                  <div className="task-top">
                    <h3
                      className={
                        todo.completed
                          ? "completed-text"
                          : ""
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
                      {todo.dueTime &&
                        ` • ${todo.dueTime}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}