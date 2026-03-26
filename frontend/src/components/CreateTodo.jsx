import { useState } from "react";
import toast from "react-hot-toast";
import "../CreateTodo.css";

export function CreateTodo({ fetchTodos, closeModal }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          body: JSON.stringify({ title, description, priority }),
        }
      );

      if (!response.ok) throw new Error("Failed to create task");

      await fetchTodos();
      toast.success("Task created!", { id: toastId });

      setTitle("");
      setDescription("");
      setPriority("medium");
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

        {/* PRIORITY SELECT */}
        <div className="priority-section">
          <label>Priority</label>
          <div className="priority-options">
            <button
              type="button"
              className={`priority-btn ${priority === "low" ? "active low" : ""}`}
              onClick={() => setPriority("low")}
            >
              Low
            </button>

            <button
              type="button"
              className={`priority-btn ${priority === "medium" ? "active medium" : ""}`}
              onClick={() => setPriority("medium")}
            >
              Medium
            </button>

            <button
              type="button"
              className={`priority-btn ${priority === "high" ? "active high" : ""}`}
              onClick={() => setPriority("high")}
            >
              High
            </button>
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