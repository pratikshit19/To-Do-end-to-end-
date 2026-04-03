import toast from "react-hot-toast";
import { useEffect, useState, useRef } from "react";
import { DeleteIcon, SettingsIcon } from "lucide-react";

export default function Todos({ todos = [], fetchTodos, onLogout, setCurrentPage }) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const username =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username");

  const [activeFilter, setActiveFilter] = useState("focused");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const [profilePhoto, setProfilePhoto] = useState("");
  const fileInputRef = useRef(null);

  const [dragX, setDragX] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const startXRef = useRef(0);
  const [openId, setOpenId] = useState(null);
  const ACTION_WIDTH = 55;

  /* ================= PROFILE FETCH ================= */

useEffect(() => {
  if (!token) return;

  const fetchProfile = async () => {
    try {
      const res = await fetch(
        "https://to-do-app-616k.onrender.com/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      setProfilePhoto(data.profilePhoto);
    } catch (err) {
      console.error(err);
    }
  };

  fetchProfile();
}, [token]);

  

  /* ================= PROFILE UPLOAD ================= */

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading("Uploading profile photo...");

    try {
      const formData = new FormData();
      formData.append("profilePhoto", file);

      const res = await fetch(
        "https://to-do-app-616k.onrender.com/upload-profile",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setProfilePhoto(data.profilePhoto);

      toast.success("Profile photo updated!", { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  /* ================= CLOSE MENU ================= */

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= DATE LOGIC ================= */

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

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

  /* ================= DELETE ================= */

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

  /* ================= TOGGLE COMPLETE ================= */

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

  /* ================= PROGRESS ================= */

  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercentage =
    todos.length > 0
      ? Math.round((completedCount / todos.length) * 100)
      : 0;

  /* ================= SWIPE LOGIC ================= */

  const handleStart = (clientX, id) => {
    startXRef.current = clientX;
    setDraggingId(id);
  };

  const handleMove = (clientX, id) => {
    if (draggingId !== id) return;
    const delta = startXRef.current - clientX;
    if (delta > 0) setDragX(Math.min(delta, ACTION_WIDTH));
    else setDragX(0);
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

  return (
    <div className="min-h-screen bg-(--bg) text-(--text-primary) pb-24 md:px-10 overflow-x-hidden transition-colors duration-300">

      <div className="flex items-center justify-between mb-6">

        <div className="relative" ref={menuRef}>
          <div
            onClick={() => setShowMenu(!showMenu)}
            className="w-11 h-11 rounded-full bg-(--card-bg) shadow-md flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-semibold text-(--accent)">
                {username?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleProfileUpload}
            className="hidden"
          />

          {showMenu && (
            <div className="absolute left-0 mt-2 w-42 bg-(--card-bg) border border-(--border) rounded-xl p-3 shadow-lg z-50">
              <p className="text-sm mb-2 p-2">{username}</p>

              <button
                onClick={() => fileInputRef.current.click()}
                className="text-sm w-full text-left p-2 rounded-lg hover:bg-(--border)"
              >
                Change Profile Photo
              </button>

              <button
                onClick={onLogout}
                className="text-sm w-full text-left mt-2 p-2 rounded-lg text-red-500 hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <h1 className="text-xl font-semibold">TaskFlow</h1>

        <SettingsIcon
          className="cursor-pointer text-accent opacity-70 hover:opacity-100"
          onClick={() => setCurrentPage("settings")}
        />
      </div>

      <div className="bg-(--card-bg) rounded-2xl p-5 mb-6 shadow-md border border-(--border)">
        <p className="text-xs mb-1">Daily Progress</p>

        <div className="flex items-start gap-2">
          <h2 className="text-lg font-medium">
            {completedCount} / {todos.length} <span>Tasks</span>
          </h2>
          <span className="text-xl font-semibold text-(--accent)">
            {progressPercentage}%
          </span>
        </div>

        <div className="mt-3 h-2 bg-(--border) rounded-full overflow-hidden">
          <div
            className="h-2 bg-(--accent) rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-5 pb-1 overflow-x-auto scrollbar-none">
        {["all", "focused", "upcoming", "completed"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full bg-(--card-bg) text-sm transition whitespace-nowrap ${
              activeFilter === filter
                ? "bg-accent text-(--accent) border border-(--accent)"
                : "bg-(--card-bg) text-(--text-secondary) hover:opacity-80 shadow-md border border-(--border)"
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {filteredTodos.length === 0 ? (
        <div className="text-center py-10 bg-(--card-bg) border border-(--border) rounded-2xl opacity-70 shadow-md">
          No tasks here 🎉
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTodos.map((todo) => (
            <div key={todo._id} className="relative w-full max-w-full overflow-hidden shadow-md rounded-2xl">

              <div className="absolute right-0 top-0 bottom-0 w-[55px] flex items-center justify-center pointer-events-auto border border-(--border)">
                <button
                  onClick={() => handleDelete(todo._id)}
                  className="w-[55px] h-full bg-red-500/10 text-red-500 text-xs font-semibold rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-red-500/20 transition"
                >
                  <DeleteIcon size={18} />
                  DELETE
                </button>
              </div>

              <div
                className="bg-(--card-bg) rounded-2xl p-4 flex gap-3 transition-transform duration-300 w-full shadow-md border border-(--border)"
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
                  handleStart(e.targetTouches[0].clientX, todo._id)
                }
                onTouchMove={(e) =>
                  handleMove(e.targetTouches[0].clientX, todo._id)
                }
                onTouchEnd={() => handleEnd(todo._id)}
                onMouseDown={(e) => handleStart(e.clientX, todo._id)}
                onMouseMove={(e) =>
                  draggingId && handleMove(e.clientX, todo._id)
                }
                onMouseUp={() => handleEnd(todo._id)}
                onMouseLeave={() =>
                  draggingId && handleEnd(todo._id)
                }
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleComplete(todo)}
                  className="w-5 h-5 bg-(--accent) text-(--accent) mt-1 cursor-pointer rounded-xl"
                />

                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3
                      className={`text-sm font-medium ${
                        todo.completed
                          ? "line-through opacity-50"
                          : ""
                      }`}
                    >
                      {todo.title}
                    </h3>

                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                        todo.priority === "high"
                          ? "bg-red-500/15 text-red-500"
                          : todo.priority === "low"
                          ? "bg-green-500/15 text-green-500"
                          : "bg-yellow-500/15 text-yellow-500"
                      }`}
                    >
                      {(todo.priority || "medium").toUpperCase()}
                    </span>
                  </div>

                  <p className="text-sm opacity-70 mt-1 font-extralight">
                    {todo.description}
                  </p>

                  {todo.dueDate && (
                    <div className="text-xs opacity-60 mt-2">
                      {new Date(todo.dueDate).toLocaleDateString()}
                      {todo.dueTime && ` • ${todo.dueTime}`}
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