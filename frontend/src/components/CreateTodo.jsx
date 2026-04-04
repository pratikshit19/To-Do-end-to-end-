import { useState } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import API_BASE_URL from "../config";

export function CreateTodo({ fetchTodos, closeModal, currentTodo }) {
  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState(currentTodo ? currentTodo.title : "");
  const [description, setDescription] = useState(currentTodo ? currentTodo.description : "");
  const [priority, setPriority] = useState(currentTodo && currentTodo.priority ? currentTodo.priority : "medium");
  const [recurrence, setRecurrence] = useState(currentTodo && currentTodo.recurrence ? currentTodo.recurrence : "none");
  
  const [dueDate, setDueDate] = useState(
    currentTodo && currentTodo.dueDate 
      ? new Date(currentTodo.dueDate).toISOString().split("T")[0] 
      : today
  );
  const [dueTime, setDueTime] = useState(currentTodo && currentTodo.dueTime ? currentTodo.dueTime : "");

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please login first");
      return;
    }

    const toastId = toast.loading(currentTodo ? "Updating task..." : "Creating task...");

    try {
      const endpoint = currentTodo 
        ? `${API_BASE_URL}/todos/${currentTodo._id}`
        : `${API_BASE_URL}/todo`;
        
      const method = currentTodo ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
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
          recurrence,
        }),
      });

      if (response.status === 403) {
        localStorage.clear();
        sessionStorage.clear();
        toast.error("Session expired. Please login again.", { id: toastId });
        window.location.reload();
        return;
      }

      if (!response.ok) throw new Error(currentTodo ? "Failed to update task" : "Failed to create task");

      await fetchTodos();
      toast.success(currentTodo ? "Task updated!" : "Task created!", { id: toastId });

      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(today);
      setDueTime("");
      setRecurrence("none");
      closeModal();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative bg-(--card-bg) rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-(--gradient-start)/10 border border-(--border)/80 animate-in fade-in zoom-in-95 duration-500">

      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-(--gradient-end)/10 rounded-full blur-[40px] pointer-events-none"></div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-(--text-primary) to-(--text-secondary) bg-clip-text text-transparent">
          {currentTodo ? "Edit Task" : "Create New Task"}
        </h2>
        <button
          onClick={closeModal}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-(--border)/50 hover:bg-(--border) text-(--text-secondary) transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full bg-(--bg) px-5 py-3.5 rounded-xl text-lg font-medium text-(--text-primary) border border-transparent focus:border-(--accent) focus:ring-4 ring-(--accent)/10 transition-all outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <textarea
            placeholder="Add context or notes... (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-5 py-3 rounded-xl bg-(--bg) text-sm text-(--text-secondary) border border-transparent focus:border-(--accent) focus:ring-4 ring-(--accent)/10 transition-all resize-none outline-none"
          />
        </div>

        {/* Date & Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold tracking-wide uppercase opacity-60">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="px-4 py-3 bg-(--bg) rounded-xl text-sm font-medium text-(--text-primary) border border-transparent focus:border-(--accent) focus:ring-4 ring-(--accent)/10 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold tracking-wide uppercase opacity-60">
              Time (Optional)
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="px-4 py-3 bg-(--bg) rounded-xl text-sm font-medium text-(--text-primary) border border-transparent focus:border-(--accent) focus:ring-4 ring-(--accent)/10 outline-none transition-all"
            />
          </div>
        </div>

        {/* Priority Tabs */}
        <div className="pt-2 space-y-2.5">
          <label className="text-xs font-semibold tracking-wide uppercase opacity-60">
            Priority Level
          </label>
          <div className="flex gap-2 p-1.5 bg-(--bg) rounded-xl border border-(--border)/50">
            {["low", "medium", "high"].map((level) => {
              const isActive = priority === level;

              let activeColors = "";
              if (level === "low") activeColors = "bg-green-500 text-white shadow-md shadow-green-500/20";
              else if (level === "medium") activeColors = "bg-yellow-500 text-white shadow-md shadow-yellow-500/20";
              else if (level === "high") activeColors = "bg-red-500 text-white shadow-md shadow-red-500/20";

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase transition-all duration-200 outline-none
                    ${isActive
                      ? activeColors
                      : "text-(--text-secondary) hover:bg-(--border)/80"
                    }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recurrence */}
        <div className="pt-2 space-y-2.5">
          <label className="text-xs font-semibold tracking-wide uppercase opacity-60">
             Repeat Task
          </label>
          <div className="flex gap-2 p-1.5 bg-(--bg) rounded-xl border border-(--border)/50">
            {["none", "daily", "weekly", "monthly"].map((option) => {
              const isActive = recurrence === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRecurrence(option)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-200 outline-none
                    ${isActive
                      ? "bg-(--accent) text-white shadow-md shadow-(--accent)/20"
                      : "text-(--text-secondary) hover:bg-(--border)/80"
                    }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-(--border)/50 mt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-6 py-2.5 rounded-xl font-medium text-(--text-secondary) hover:bg-(--border) transition-colors focus:outline-none"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-8 py-2.5 rounded-xl bg-(--accent) text-white font-medium hover:brightness-110 shadow-md shadow-(--gradient-start)/20 active:scale-95 transition-all focus:outline-none"
          >
            {currentTodo ? "Save Changes" : "Save Task"}
          </button>
        </div>
      </form>
    </div>
  );
}