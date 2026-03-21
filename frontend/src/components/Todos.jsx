import toast from "react-hot-toast";

export function Todos({ todos, fetchTodos }) {
  const token = localStorage.getItem("token");

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

  const handleToggleComplete = async (id) => {
    try {
      const response = await fetch(
        `https://to-do-app-616k.onrender.com/todos/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  if (!todos || todos.length === 0) {
    return <div className="empty-state"><p >No tasks yet.Your tasks will appear here!</p></div>;
  }

  // ✅ Progress calculations
  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercentage = Math.round(
    (completedCount / todos.length) * 100
  );

  return (
    <div className="mobile-container">
      <div className="tasks-header">
        <p>Create your tasks and track their status</p>
      </div>

      <div className="task-card">
        <p className="task-count">
          {completedCount} of {todos.length} Tasks Completed
        </p>

        {/* ✅ Progress Bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {todos.map((todo) => (
          <div key={todo._id} className="task-row">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleComplete(todo._id)}
            />

            <div className="task-text">
              <span
                className={`task-title ${
                  todo.completed ? "completed-text" : ""
                }`}
              >
                {todo.title}
              </span>
              <small>{todo.description}</small>
            </div>

            <span
              className="delete-btn"
              onClick={() => handleDelete(todo._id)}
            >
              ×
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
