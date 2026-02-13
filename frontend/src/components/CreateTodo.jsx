import { useState } from "react";
import "../CreateTodo.css";

export function CreateTodo({ fetchTodos }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and Description cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add todo");
      }

      await fetchTodos();

      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-container">
      <div className="create-card">
        <h2 className="create-title">Add a Task</h2>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Adding..." : "Add Task"}
        </button>

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
