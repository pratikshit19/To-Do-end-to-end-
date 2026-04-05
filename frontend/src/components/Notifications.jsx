import { Bell, Check, X, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import useStore from "../store/useStore";

export default function Notifications() {
  const { notifications, fetchNotifications, markNotificationAsRead } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = (e, id) => {
    e.stopPropagation();
    markNotificationAsRead(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-(--card-bg) border border-(--border)/60 text-(--text-secondary) hover:text-(--accent) transition-all relative"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-(--card-bg) rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-80 max-h-[400px] bg-(--card-bg) border border-(--border)/60 rounded-3xl shadow-2xl overflow-hidden z-[70] animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="p-4 border-b border-(--border)/60 flex justify-between items-center bg-(--bg)/30">
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-(--accent)/10 text-(--accent) px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="overflow-y-auto max-h-[320px] divide-y divide-(--border)/40">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markNotificationAsRead(n._id)}
                  className={`p-4 hover:bg-(--bg)/50 transition-colors cursor-pointer relative group ${!n.read ? "bg-(--accent)/5" : "opacity-60"}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      n.type === 'assignment' ? 'bg-indigo-500/10 text-indigo-500' : 
                      n.type === 'team_task' ? 'bg-emerald-500/10 text-emerald-500' :
                      n.type === 'team_deleted' ? 'bg-red-500/10 text-red-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      <Bell size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-(--text-primary) leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[10px] mt-1 opacity-40 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, n._id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-(--text-secondary) hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-(--bg) flex items-center justify-center mb-3 opacity-20">
                  <Bell size={24} />
                </div>
                <p className="text-xs font-bold opacity-40">All caught up!</p>
                <p className="text-[10px] opacity-30 mt-1">No new notifications at the moment.</p>
              </div>
            )}
          </div>
          
          <div className="p-3 bg-(--bg)/30 border-t border-(--border)/60 text-center">
            <button className="text-[10px] font-bold uppercase tracking-widest text-(--text-secondary) hover:text-(--text-primary) transition-colors">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
