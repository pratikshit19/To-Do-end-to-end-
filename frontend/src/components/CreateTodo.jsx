import { useState } from "react";
import "../CreateTodo.css";
import toast from "react-hot-toast";

export function CreateTodo({ fetchTodos, closeModal }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and Description cannot be empty");
      return;
    }

    const toastId = toast.loading("Adding task...");

    try {
      setLoading(true);

      const response = await fetch("https://to-do-app-616k.onrender.com/todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error("Failed to add todo");
      }

      await fetchTodos();

      toast.success("Task added successfully 🎉", { id: toastId });

      setTitle("");
      setDescription("");
      closeModal();

    } catch (err) {
      toast.error(err.message || "Something went wrong", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-card">
      <button className="close-btn" onClick={closeModal}>✕</button>

      <h2 className="create-title">Add a Task</h2>

      <input
        type="text"
        placeholder="Enter title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Enter description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Adding..." : "Add Task"}
      </button>
    </div>
  );
}
