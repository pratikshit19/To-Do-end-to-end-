import { useState } from "react";
import toast from "react-hot-toast";

export function CreateTodo({ fetchTodos, closeModal }) {
  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState(today);
  const [dueTime, setDueTime] = useState("");

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please login first");
      return;
    }

    const toastId = toast.loading("Creating task...");

    try {
      const response = await fetch(
        "https://to-do-app-616k.onrender.com/todo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            priority,
            dueDate,
            dueTime,
          }),
        }
      );

      if (response.status === 403) {
        localStorage.clear();
        sessionStorage.clear();
        toast.error(
          "Session expired. Please login again.",
          { id: toastId }
        );
        window.location.reload();
        return;
      }

      if (!response.ok)
        throw new Error("Failed to create task");

      await fetchTodos();
      toast.success("Task created!", {
        id: toastId,
      });

      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(today);
      setDueTime("");
      closeModal();
    } catch (err) {
      toast.error(err.message, {
        id: toastId,
      });
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-(--createbg) rounded-2xl p-6 md:p-8 shadow-xl space-y-6">

      <h2 className="text-xl md:text-2xl font-semibold text-center">
        Create New Task
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Title */}
        <input
          type="text"
          placeholder="Task title..."
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          required
          className="w-full  bg-(--card-bg) px-4 py-3 rounded-xl text-(--text-primary) focus:outline-none focus:ring focus:ring-(--accent) transition"
        />

        {/* Description */}
        <textarea
          placeholder="Task description..."
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          required
          rows={4}
          className="w-full  px-4 py-3 rounded-xl bg-(--card-bg) text-(--text-secondary) focus:outline-none focus:ring focus:ring-(--accent) transition resize-none"
        />

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-sm opacity-70">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) =>
                setDueDate(e.target.value)
              }
              required
              className="px-4 py-3 bg-(--card-bg) rounded-xl text-(--text-secondary) focus:outline-none focus:ring focus:ring-(--accent)"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm opacity-70">
              Time
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) =>
                setDueTime(e.target.value)
              }
              className="px-4 py-3 rounded-xl bg-(--card-bg) text-(--text-secondary) focus:outline-none focus:ring focus:ring-(--accent)"
            />
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-sm opacity-70">
            Priority
          </label>

          <div className="flex gap-3">
            {["low", "medium", "high"].map(
              (level) => {
                const isActive =
                  priority === level;

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setPriority(level)
                    }
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition 
                      ${
                        isActive
                          ? level === "high"
                            ? "bg-red-500/30 text-red-500"
                            : level === "medium"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-emerald-500/30 text-emerald-400"
                          : "bg-(--bg) text-(--text-secondary) opacity-70 hover:opacity-100"
                      }`}
                  >
                    {level.charAt(0).toUpperCase() +
                      level.slice(1)}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-5 py-2 rounded-xl bg-(--border) hover:opacity-80 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-(--accent) text-white hover:opacity-90 transition"
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  );
}