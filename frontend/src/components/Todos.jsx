import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import { Trash2, Circle, CheckCircle2, ClipboardList, Pencil, Search, ChevronDown, Filter, Check } from "lucide-react";
import API_BASE_URL from "../config";
import useStore from "../store/useStore";
import confetti from "canvas-confetti";

export default function Todos({ onEdit }) {
  const { todos, updateTodo, deleteTodo, currentWorkspace } = useStore();
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const [activeFilter, setActiveFilter] = useState("focused");
  const { searchQuery, setSearchQuery } = useStore();
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [dragX, setDragX] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const startXRef = useRef(0);
  const [openId, setOpenId] = useState(null);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const priorityDropdownRef = useRef(null);
  const ACTION_WIDTH = 120; // Expanded to fit both Edit and Delete

  // Close priority dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(e.target)) {
        setShowPriorityDropdown(false);
      }
    };
    if (showPriorityDropdown) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPriorityDropdown]);

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
  }).sort((a, b) => {
    // For 'All' and 'Completed' tabs, show newest tasks first (latest added on top)
    if (activeFilter === "all" || activeFilter === "completed") {
      return new Date(b.createdAt || b._id.getTimestamp?.() || 0) - new Date(a.createdAt || a._id.getTimestamp?.() || 0);
    }
    
    // For Focused and Upcoming, sort by Due Date ascending, then by Priority
    const dateA = new Date(a.dueDate + (a.dueTime ? `T${a.dueTime}` : ""));
    const dateB = new Date(b.dueDate + (b.dueTime ? `T${b.dueTime}` : ""));
    if (dateA - dateB !== 0) return dateA - dateB;

    const priorities = { high: 1, medium: 2, low: 3 };
    return (priorities[a.priority] || 4) - (priorities[b.priority] || 4);
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
          colors: ["#3b82f6", "#8b5cf6", "#22c55e"],
        });
        toast.success("Awesome work!");

        // Handle Recurrence (Pro Feature)
        if (todo.recurrence && todo.recurrence !== "none") {
          const nextDate = new Date(todo.dueDate);
          if (todo.recurrence === "daily")
            nextDate.setDate(nextDate.getDate() + 1);
          else if (todo.recurrence === "weekly")
            nextDate.setDate(nextDate.getDate() + 7);
          else if (todo.recurrence === "monthly")
            nextDate.setMonth(nextDate.getMonth() + 1);

          try {
            const resp = await fetch(`${API_BASE_URL}/todo`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: todo.title,
                description: todo.description,
                priority: todo.priority,
                dueDate: nextDate.toISOString().split("T")[0],
                dueTime: todo.dueTime || "",
                recurrence: todo.recurrence,
              }),
            });
            if (resp.ok) {
              const { todo: newTodo } = await resp.json();
              useStore.getState().addTodo(newTodo);
              toast.success(
                `Recurring task created for ${nextDate.toLocaleDateString()}`
              );
            }
          } catch (err) {
            console.error("Failed to create recurring task:", err);
          }
        }
      } else {
        toast("Task marked as incomplete", { icon: "↩️" });
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
      <div className="md:hidden pt-[env(safe-area-inset-top,0px)] mb-6 mt-2">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-(--card-bg) border border-(--border)/60 text-sm font-medium focus:ring-2 focus:ring-(--accent)/30 outline-none transition-all shadow-sm"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <Search size={20} />
          </div>
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
      <div className="flex items-center gap-2 mb-8">
        {/* Status Segmented Control */}
        <div className="flex-1 flex bg-(--card-bg) p-1 rounded-2xl border border-(--border)/60 shadow-sm overflow-x-auto hide-scrollbar sm:overflow-visible">
          {["focused", "upcoming", "completed", "all"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap outline-none flex-1 sm:flex-initial ${activeFilter === filter
                ? "bg-(--accent) text-white shadow-lg shadow-(--gradient-start)/20 translate-y-[-1px]"
                : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border)/40"
                }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Priority Selector (Responsive) */}
        <div className="relative shrink-0" ref={priorityDropdownRef}>
          {/* Mobile: Just Icon */}
          <button
            onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
            className={`sm:hidden flex items-center justify-center w-11 h-11 rounded-2xl bg-(--card-bg) border border-(--border)/60 shadow-sm transition-all active:scale-95 outline-none relative ${priorityFilter !== 'all' ? 'text-(--accent) ring-2 ring-(--accent)/10' : 'text-(--text-secondary)'}`}
          >
            <Filter size={18} />
            {priorityFilter !== 'all' && (
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-(--card-bg) ${priorityFilter === 'high' ? 'bg-red-500' : priorityFilter === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
            )}
          </button>

          {/* Desktop: Full Button */}
          <button
            onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
            className={`hidden sm:flex items-center gap-2 px-4 py-3 rounded-2xl bg-(--card-bg) border border-(--border)/60 shadow-sm text-xs font-bold transition-all active:scale-95 outline-none ${priorityFilter !== 'all' ? 'text-(--accent) ring-2 ring-(--accent)/10' : 'text-(--text-secondary)'}`}
          >
            <Filter size={14} />
            <span className="capitalize">{priorityFilter === 'all' ? 'Priority' : `${priorityFilter}`}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${showPriorityDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showPriorityDropdown && (
            <div className="absolute top-14 right-0 w-48 bg-(--card-bg) border border-(--border)/60 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="p-2 space-y-1">
                {[
                  { id: 'all', label: 'All Priorities', color: 'bg-slate-400' },
                  { id: 'high', label: 'High Priority', color: 'bg-red-500' },
                  { id: 'medium', label: 'Medium Priority', color: 'bg-yellow-500' },
                  { id: 'low', label: 'Low Priority', color: 'bg-green-500' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setPriorityFilter(p.id); setShowPriorityDropdown(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${priorityFilter === p.id ? 'bg-(--accent)/10 text-(--accent)' : 'text-(--text-primary) hover:bg-(--border)/40'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${p.color}`} />
                      {p.label}
                    </div>
                    {priorityFilter === p.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}
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
              <div className="absolute right-0 top-0 bottom-0 w-[120px] flex rounded-r-4xl overflow-hidden">
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
                className="bg-(--card-bg) rounded-3xl p-4 sm:p-5 flex items-center gap-4 w-full shadow-sm border border-(--border)/60 hover:shadow-md transition-shadow relative z-10"
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

                  {/* Task Ownership & Completion & Assignment Attribution */}
                  {currentWorkspace !== "personal" && (
                    <div className="flex flex-col gap-1.5 mt-2">
                       <div className={`text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-wider ${todo.completed ? "opacity-30" : "opacity-40"}`}>
                          {todo.completed && todo.completedBy ? (
                            <>
                              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[8px] overflow-hidden">
                                 {todo.completedBy.profilePhoto ? (
                                   <img src={todo.completedBy.profilePhoto} alt={todo.completedBy.username || "User"} className="w-full h-full object-cover" />
                                 ) : (
                                   (todo.completedBy.username || "U").charAt(0).toUpperCase()
                                 )}
                              </div>
                              <span>Completed by {todo.completedBy.username || "a member"}</span>
                            </>
                          ) : todo.userId && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-linear-to-tr from-(--gradient-start) to-(--gradient-end) flex items-center justify-center text-white text-[8px] overflow-hidden">
                                 {todo.userId.profilePhoto ? (
                                   <img src={todo.userId.profilePhoto} alt={todo.userId.username || "User"} className="w-full h-full object-cover" />
                                 ) : (
                                   (todo.userId.username || "U").charAt(0).toUpperCase()
                                 )}
                              </div>
                              <span>Added by {todo.userId.username || "a member"}</span>
                            </>
                          )}
                       </div>

                       {todo.assignedTo && (
                         <div className={`text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-wider ${todo.completed ? "opacity-30" : "text-indigo-500"}`}>
                            <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[8px] overflow-hidden shadow-sm">
                               {todo.assignedTo.profilePhoto ? (
                                 <img src={todo.assignedTo.profilePhoto} alt={todo.assignedTo.username || "User"} className="w-full h-full object-cover" />
                               ) : (
                                 (todo.assignedTo.username || "U").charAt(0).toUpperCase()
                               )}
                            </div>
                            <span>Assigned to {todo.assignedTo.username || "a member"}</span>
                         </div>
                       )}
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