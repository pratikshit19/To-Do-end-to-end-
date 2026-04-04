import toast from "react-hot-toast";
import { useState, useRef } from "react";
import { Trash2, Circle, CheckCircle2, ClipboardList, Pencil } from "lucide-react";
import API_BASE_URL from "../config";
import useStore from "../store/useStore";
import confetti from "canvas-confetti";

export default function Todos({ onEdit }) {
  const { todos, updateTodo, deleteTodo } = useStore();
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const [activeFilter, setActiveFilter] = useState("focused");
  const { searchQuery, setSearchQuery } = useStore();
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [dragX, setDragX] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const startXRef = useRef(0);
  const [openId, setOpenId] = useState(null);
  const ACTION_WIDTH = 120; // Expanded to fit both Edit and Delete

  /* ================= DATE LOGIC ================= */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const filteredTodos = todos.filter((todo) => {
    // 1. Filter by Search Query
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    // 2. Filter by Priority
    if (priorityFilter !== "all" && todo.priority !== priorityFilter) return false;

    // 3. Filter by Tab (Active Filter)
    if (activeFilter === "all") return true;
    if (activeFilter === "completed") return todo.completed;

    // Date-based filters (focused/upcoming)
    if (!todo.dueDate) return false;
    const due = new Date(todo.dueDate);
    due.setHours(0, 0, 0, 0);

    if (activeFilter === "focused") return isSameDay(due, today) && !todo.completed;
    if (activeFilter === "upcoming") return due > today && !todo.completed;

    return true;
  });

  /* ================= DELETE ================= */
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteTodo(id);
      setOpenId(null);
      setDragX(0);
      toast.success("Task crushed!");
    } catch (err) {
      toast.error("Failed to delete task.");
    }
  };

  /* ================= TOGGLE COMPLETE ================= */
  const handleToggleComplete = async (todo, e) => {
    if (e) e.stopPropagation();
    try {
      const isCompleting = !todo.completed;
      await updateTodo(todo._id, { completed: isCompleting });

      if (isCompleting) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#8b5cf6', '#22c55e']
        });
        toast.success("Awesome work!");
      }
    } catch (err) {
      toast.error("Failed to update task.");
    }
  };

  /* ================= PROGRESS ================= */
  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercentage =
    todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  /* ================= SWIPE LOGIC ================= */
  const handleStart = (clientX, id) => {
    startXRef.current = clientX;
    setDraggingId(id);
  };

  const handleMove = (clientX, id) => {
    if (draggingId !== id) return;
    const delta = startXRef.current - clientX;
    // Only allow swiping left
    if (delta > 0) setDragX(Math.min(delta, ACTION_WIDTH));
    else setDragX(0);
  };

  const handleEnd = (id) => {
    if (dragX > ACTION_WIDTH / 2) {
      setDragX(ACTION_WIDTH);
      setOpenId(id);
    } else {
      setDragX(0);
      setOpenId(null);
    }
    setDraggingId(null);
  };

  return (
    <div className="w-full pb-24 md:pb-6 transition-colors duration-300">

      {/* ================= MOBILE SEARCH (Top) ================= */}
      <div className="md:hidden relative group mb-6 pt-[env(safe-area-inset-top,0px)] mt-2">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-(--card-bg) border border-(--border)/60 text-sm font-medium focus:ring-2 focus:ring-(--accent)/30 outline-none transition-all shadow-sm"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">
          <ClipboardList size={20} />
        </div>
      </div>

      {/* ================= PROGRESS CARD ================= */}
      <div className="bg-linear-to-br from-(--card-bg) to-(--bg) p-6 sm:p-8 rounded-[2rem] mb-8 shadow-sm border border-(--border)/60 relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-(--gradient-start)/20 rounded-full blur-[50px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium opacity-60 mb-1 tracking-wide uppercase">Your Progress</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold bg-linear-to-r from-(--gradient-start) to-(--gradient-end) bg-clip-text text-transparent">
                {progressPercentage}%
              </h2>
              <span className="text-sm opacity-60 font-medium">Completed</span>
            </div>
          </div>

          <div className="w-full md:max-w-md flex flex-col gap-2">
            <div className="flex justify-between text-xs font-medium opacity-70 px-1">
              <span>{completedCount} Tasks Done</span>
              <span>{todos.length - completedCount} Remaining</span>
            </div>
            <div className="w-full h-3 bg-(--border)/50 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-linear-to-r from-(--gradient-start) to-(--gradient-end) rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="space-y-4 mb-6 pt-1">
        <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none snap-x -mx-1 px-1">
          {["focused", "upcoming", "completed", "all"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 snap-start whitespace-nowrap outline-none border ${activeFilter === filter
                ? "bg-(--accent) text-white border-(--accent) shadow-md shadow-(--gradient-start)/20 scale-105"
                : "bg-(--card-bg) text-(--text-primary) opacity-70 hover:opacity-100 hover:bg-(--border)/50 border-(--border)/60"
                }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}

          <div className="w-[1px] bg-(--border)/60 mx-2 shrink-0"></div>

          {/* Desktop Only Inline Search (Fallback for smaller desktops) */}
          <div className="hidden md:flex lg:hidden relative group w-48">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-(--card-bg) border border-(--border)/60 text-xs focus:ring-2 focus:ring-(--accent)/30 outline-none transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30">
              <ClipboardList size={14} />
            </div>
          </div>

          {["all", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 snap-start whitespace-nowrap outline-none border ${priorityFilter === p
                ? "bg-slate-800 text-white border-slate-800 scale-105"
                : "bg-(--card-bg) text-(--text-primary) opacity-50 hover:opacity-100 border-(--border)/60"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TASK LIST ================= */}
      {filteredTodos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 mt-8 bg-(--card-bg)/30 border border-dashed border-(--border) rounded-3xl opacity-80">
          <div className="w-16 h-16 rounded-full bg-(--border)/50 flex items-center justify-center mb-4 text-(--text-secondary)">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-lg font-semibold mb-1">You're all caught up!</h3>
          <p className="text-sm opacity-60 text-center max-w-[250px]">
            {activeFilter === 'completed' ? "You haven't finished any tasks yet." : "There are no pending tasks in this view. Enjoy your day!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map((todo) => (
            <div key={todo._id} className="relative w-full max-w-full overflow-hidden rounded-2xl group">

              {/* Swipe Background (Actions) */}
              <div className="absolute right-0 top-0 bottom-0 w-[120px] flex rounded-r-2xl overflow-hidden">
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenId(null); onEdit && onEdit(todo); }}
                  className="w-[60px] h-full flex items-center justify-center bg-blue-500 text-white"
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={(e) => handleDelete(todo._id, e)}
                  className="w-[60px] h-full flex items-center justify-center bg-red-500 text-white"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Foreground Task Card */}
              <div
                className="bg-(--card-bg) rounded-2xl p-4 sm:p-5 flex items-center gap-4 w-full shadow-sm border border-(--border)/60 hover:shadow-md transition-shadow relative z-10"
                style={{
                  transform:
                    openId === todo._id
                      ? `translateX(-${ACTION_WIDTH}px)`
                      : draggingId === todo._id
                        ? `translateX(-${dragX}px)`
                        : "translateX(0px)",
                  transition: draggingId === todo._id ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}

                // Touch events for Mobile Swipe
                onTouchStart={(e) => handleStart(e.targetTouches[0].clientX, todo._id)}
                onTouchMove={(e) => handleMove(e.targetTouches[0].clientX, todo._id)}
                onTouchEnd={() => handleEnd(todo._id)}

                // Mouse events for Desktop Swipe
                onMouseDown={(e) => handleStart(e.clientX, todo._id)}
                onMouseMove={(e) => draggingId && handleMove(e.clientX, todo._id)}
                onMouseUp={() => handleEnd(todo._id)}
                onMouseLeave={() => draggingId && handleEnd(todo._id)}
              >

                {/* Custom Checkbox */}
                <button
                  onClick={(e) => handleToggleComplete(todo, e)}
                  className="shrink-0 flex items-center justify-center focus:outline-none rounded-full transition-transform active:scale-90"
                >
                  {todo.completed ? (
                    <CheckCircle2 size={24} className="text-(--accent) fill-(--accent)/10" />
                  ) : (
                    <Circle size={24} className="text-(--text-secondary) opacity-50 hover:opacity-100 transition-opacity" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 pointer-events-none sm:pointer-events-auto cursor-pointer" onClick={(e) => handleToggleComplete(todo, e)}>
                  <div className="flex justify-between items-start gap-2">
                    <h3
                      className={`text-base sm:text-lg font-semibold truncate transition-colors duration-300 ${todo.completed ? "opacity-40 line-through" : "text-(--text-primary)"
                        }`}
                    >
                      {todo.title}
                    </h3>

                    {/* Priority Badge */}
                    {todo.priority && (
                      <span
                        className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shrink-0 mt-0.5 ${todo.priority === "high"
                          ? "bg-red-500/10 text-red-500"
                          : todo.priority === "low"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                          } ${todo.completed ? 'opacity-40' : ''}`}
                      >
                        {todo.priority}
                      </span>
                    )}
                  </div>

                  {todo.description && (
                    <p className={`text-sm mt-0.5 line-clamp-2 transition-opacity duration-300 ${todo.completed ? "opacity-30" : "opacity-60"}`}>
                      {todo.description}
                    </p>
                  )}

                  {todo.dueDate && (
                    <div className={`text-xs mt-2 font-medium flex items-center gap-1 ${todo.completed ? "opacity-30" : "text-(--accent)/80"}`}>
                      {new Date(todo.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {todo.dueTime && ` • ${todo.dueTime}`}
                    </div>
                  )}
                </div>

                {/* Desktop Hover Edit Action (Hidden on touch devices, shown on parent group hover) */}
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit && onEdit(todo); }}
                  className="hidden sm:flex shrink-0 w-10 h-10 items-center justify-center rounded-xl text-blue-500 opacity-0 group-hover:opacity-100 hover:bg-blue-500/10 transition-all active:scale-95"
                  aria-label="Edit Task"
                >
                  <Pencil size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}