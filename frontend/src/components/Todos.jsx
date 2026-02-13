export function Todos({ todos, fetchTodos }) {

  const token = localStorage.getItem("token");

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`https://to-do-app-616k.onrender.com/todos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }

      await fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (id) => {
    try {
      const response = await fetch(`https://to-do-app-616k.onrender.com/todos/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      await fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  if (!todos || todos.length === 0) {
    return <p>No todos available.</p>;
  }

  return (
    <div className="todo-container">
      {todos.map((todo) => (
        <div
          key={todo._id}
          className={`todo-card ${todo.completed ? "completed" : ""}`}
        >
          <span
            className="delete-cross"
            onClick={() => handleDelete(todo._id)}
          >
            ×
          </span>

          <div>
            <h2 className="todo-title">{todo.title}</h2>
            <p className="todo-description">{todo.description}</p>
          </div>

          <button
            onClick={() => handleToggleComplete(todo._id)}
          >
            {todo.completed ? "Completed ✓" : "Mark as Completed"}
          </button>
        </div>
      ))}
    </div>
  );
}
