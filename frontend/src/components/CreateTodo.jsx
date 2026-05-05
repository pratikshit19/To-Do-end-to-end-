import { useState } from "react";
import toast from "react-hot-toast";
import { X, Users } from "lucide-react";
import API_BASE_URL from "../config";
import useStore from "../store/useStore";

export function CreateTodo({ fetchTodos, closeModal, currentTodo }) {
  const { currentWorkspace } = useStore();
  const today = new Date().toISOString().split("T")[0];


  const [title, setTitle] = useState(currentTodo ? currentTodo.title : "");
  const [description, setDescription] = useState(currentTodo ? currentTodo.description : "");
  const [priority, setPriority] = useState(currentTodo && currentTodo.priority ? currentTodo.priority : "medium");
  const [recurrence, setRecurrence] = useState(currentTodo && currentTodo.recurrence ? currentTodo.recurrence : "none");
  const [assignedTo, setAssignedTo] = useState(currentTodo && currentTodo.assignedTo ? (currentTodo.assignedTo._id || currentTodo.assignedTo) : "");

  const [dueDate, setDueDate] = useState(
    currentTodo && currentTodo.dueDate
      ? new Date(currentTodo.dueDate).toISOString().split("T")[0]
      : today
  );
  const [dueTime, setDueTime] = useState(currentTodo && currentTodo.dueTime ? currentTodo.dueTime : "");
  const [reminderOffset, setReminderOffset] = useState(""); // "" | "30" | "60"

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

      let reminderAt = null;
      if (dueDate && dueTime && reminderOffset) {
        const dueDateTime = new Date(`${dueDate}T${dueTime}`);
        dueDateTime.setMinutes(dueDateTime.getMinutes() - parseInt(reminderOffset, 10));
        reminderAt = dueDateTime.toISOString();
      }

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
          teamId: currentWorkspace !== "personal" ? currentWorkspace : null,
          assignedTo: currentWorkspace !== "personal" ? assignedTo : null,
          reminderAt,
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

      <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-(--gradient-end)/10 rounded-full blur-[60px] pointer-events-none"></div>
      <div className="absolute bottom-[-40px] left-[-40px] w-48 h-48 bg-(--gradient-start)/10 rounded-full blur-[60px] pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex flex-col">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <span className="bg-linear-to-r from-(--gradient-start) to-(--gradient-end) bg-clip-text text-transparent">
              {currentTodo ? "Edit Task" : "New Task"}
            </span>
          </h2>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">
            {currentWorkspace !== "personal" && !currentTodo ? "Team Workspace" : "Personal"}
          </span>
        </div>
        <button
          type="button"
          onClick={closeModal}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-(--border)/30 hover:bg-(--border)/80 transition-colors opacity-70 hover:opacity-100"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full bg-(--bg)/60 px-5 py-4 rounded-2xl text-lg font-bold text-(--text-primary) border border-(--border)/50 focus:border-(--accent) focus:ring-4 ring-(--accent)/20 transition-all outline-none shadow-inner"
          />
        </div>

        {/* Description */}
        <div>
          <textarea
            placeholder="Add context or notes... (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-5 py-3 border border-(--border)/50 rounded-2xl bg-(--bg)/60 text-sm font-medium text-(--text-secondary) focus:border-(--accent) focus:ring-4 ring-(--accent)/20 transition-all resize-none outline-none shadow-inner"
          />
        </div>

        {/* Date & Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50 ml-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="px-5 py-3.5 bg-(--bg)/60 border border-(--border)/50 rounded-xl text-sm font-bold text-(--text-primary) focus:border-(--accent) focus:ring-4 ring-(--accent)/20 outline-none transition-all shadow-inner uppercase tracking-wider"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50 ml-1">
              Time (Optional)
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => {
                setDueTime(e.target.value);
                if (!e.target.value) setReminderOffset("");
              }}
              className="px-5 py-3.5 bg-(--bg)/60 border border-(--border)/50 rounded-xl text-sm font-bold text-(--text-primary) focus:border-(--accent) focus:ring-4 ring-(--accent)/20 outline-none transition-all shadow-inner tracking-wider"
            />
          </div>
        </div>

        {/* Reminder (Only shown if Time is set) */}
        {dueTime && (
          <div className="pt-1 animate-in fade-in slide-in-from-top-2">
            <label className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50 ml-1 block mb-2">
              Background Reminder
            </label>
            <div className="flex gap-2 bg-(--bg)/40 p-1.5 rounded-xl border border-(--border)/40">
              {[
                { label: "None", value: "" },
                { label: "30 min before", value: "30" },
                { label: "1 hr before", value: "60" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReminderOffset(opt.value)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 outline-none
                    ${reminderOffset === opt.value
                      ? "bg-(--accent) text-white shadow-xl shadow-(--accent)/20 scale-[1.02] border border-(--accent)"
                      : "text-(--text-secondary) hover:bg-(--border)/60 border border-transparent opacity-70 hover:opacity-100"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Assign To (Only for Team Workspaces) */}
        {currentWorkspace !== "personal" && (
          <div className="pt-2">
            <label className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50 ml-1 flex items-center gap-2 mb-2">
              <Users size={12} className="text-(--accent)" />
              Delegate Task
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-5 py-3.5 bg-(--bg)/60 border border-(--border)/50 rounded-xl text-sm font-bold text-(--text-primary) focus:border-(--accent) focus:ring-4 ring-(--accent)/20 outline-none transition-all shadow-inner appearance-none cursor-pointer"
            >
              <option value="">No one (Unassigned)</option>
              {useStore.getState().teams.find(t => t._id === currentWorkspace)?.members?.map(member => (
                <option key={member._id} value={member._id}>
                  {member.username} {member._id === (localStorage.getItem("userId") || sessionStorage.getItem("userId")) ? "(You)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority Tabs */}
        <div className="pt-1">
          <label className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50 ml-1 block mb-2">
            Priority Level
          </label>
          <div className="flex gap-2 p-1.5 bg-(--bg)/40 rounded-xl border border-(--border)/40">
            {["low", "medium", "high"].map((level) => {
              const isActive = priority === level;
              let activeColors = "";
              if (level === "low") activeColors = "bg-green-500 text-white shadow-lg shadow-green-500/20 border-green-500";
              else if (level === "medium") activeColors = "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20 border-yellow-500";
              else if (level === "high") activeColors = "bg-red-500 text-white shadow-lg shadow-red-500/20 border-red-500";

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  className={`flex-1 py-3 rounded-lg text-xs font-black tracking-[0.1em] uppercase transition-all duration-300 outline-none border
                    ${isActive
                      ? `${activeColors} scale-[1.02]`
                      : "border-transparent text-(--text-secondary) hover:bg-(--border)/60 opacity-70 hover:opacity-100"
                    }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recurrence */}
        <div className="pt-1">
          <label className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50 ml-1 block mb-2">
            Automation (Repeat Task)
          </label>
          <div className="flex gap-2 p-1 bg-(--bg)/40 rounded-xl border border-(--border)/40">
            {["none", "daily", "weekly", "monthly"].map((option) => {
              const isActive = recurrence === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRecurrence(option)}
                  className={`flex-1 py-2.5 rounded-lg text-[9px] font-black tracking-[0.1em] uppercase transition-all duration-300 outline-none border
                    ${isActive
                      ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "border-transparent text-(--text-secondary) hover:bg-(--border)/60 opacity-60 hover:opacity-100"
                    }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-(--border)/50 mt-8">
          <button
            type="button"
            onClick={closeModal}
            className="flex-1 sm:flex-none px-6 py-4 sm:py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-(--text-secondary) bg-(--bg)/80 hover:bg-(--border) border border-(--border)/50 transition-colors focus:outline-none"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex-[2] sm:flex-none px-8 py-4 sm:py-3 rounded-2xl bg-linear-to-br from-(--gradient-start) to-(--gradient-end) text-white font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] shadow-xl shadow-(--gradient-start)/20 active:scale-95 transition-all focus:outline-none"
          >
            {currentTodo ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}