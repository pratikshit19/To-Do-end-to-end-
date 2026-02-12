import { useState } from "react";

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
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                })
            });

            if (!response.ok) {
                throw new Error("Failed to add todo");
            }

            // 🔥 Refetch all todos after adding
            await fetchTodos();

            // Reset inputs
            setTitle("");
            setDescription("");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginBottom: "2rem" }}>
            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ padding: 10, margin: 10 }}
            />

            <br />

            <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ padding: 10, margin: 10 }}
            />

            <br />

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ padding: 10, margin: 10 }}
            >
                {loading ? "Adding..." : "Add To-do"}
            </button>

            {error && (
                <p style={{ color: "red" }}>
                    {error}
                </p>
            )}
        </div>
    );
}
