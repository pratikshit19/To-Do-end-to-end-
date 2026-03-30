import { useState } from "react";
import toast from "react-hot-toast";
import "../CreateTodo.css";

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
        toast.error("Session expired. Please login again.", {
          id: toastId,
        });
        window.location.reload();
        return;
      }

      if (!response.ok)
        throw new Error("Failed to create task");

      await fetchTodos();
      toast.success("Task created!", { id: toastId });

      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(today);
      setDueTime("");
      closeModal();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  return (
    <div className="create-container">
      <h2 className="create-title">Create New Task</h2>

      <form onSubmit={handleSubmit} className="create-form">
        <input
          type="text"
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Task description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div className="datetime-row">
          <div className="datetime-field">
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="datetime-field">
            <label>Time</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>
        </div>

        <div className="priority-section">
          <label>Priority</label>
          <div className="priority-options">
            {["low", "medium", "high"].map((level) => (
              <button
                key={level}
                type="button"
                className={`priority-btn ${
                  priority === level
                    ? `active ${level}`
                    : ""
                }`}
                onClick={() => setPriority(level)}
              >
                {level.charAt(0).toUpperCase() +
                  level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="create-buttons">
          <button
            type="button"
            className="cancel-btn"
            onClick={closeModal}
          >
            Cancel
          </button>

          <button type="submit" className="submit-btn">
            Create Task
          </button>
        </div>
      </form>
    </div>
  );
}