import { Home, Calendar, LineChart, User, LogOut, Users, MoreHorizontal, Settings, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Navbar({ currentPage, setCurrentPage, onLogout }) {
  const [showMore, setShowMore] = useState(false);
  const moreMenuRef = useRef(null);

  const mainNavItems = [
    { id: "home", label: "Today", icon: Home },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "teams", label: "Teams", icon: Users },
    { id: "profile", label: "Profile", icon: User },
  ];

  const secondaryNavItems = [
    { id: "insights", label: "Insights", icon: LineChart },
    { id: "coach", label: "AI Coach", icon: Sparkles },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "logout", label: "Sign out", icon: LogOut, color: "text-red-500" },
  ];

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMore(false);
      }
    };
    if (showMore) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMore]);

  const handleItemClick = (id) => {
    setShowMore(false);
    if (id === "logout") {
      onLogout();
    } else {
      setCurrentPage(id);
    }
  };

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm z-50">
      
      {/* More Menu Popover */}
      {showMore && (
        <div 
          ref={moreMenuRef}
          className="absolute bottom-20 right-0 w-48 bg-(--card-bg)/95 backdrop-blur-2xl border border-(--border)/60 rounded-3xl shadow-2xl p-2 animate-in slide-in-from-bottom-5 fade-in duration-200 z-50"
        >
          <div className="space-y-1">
            {secondaryNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-95 text-sm font-bold ${
                  item.id === "logout" 
                    ? "text-red-500 hover:bg-red-500/10" 
                    : "text-(--text-primary) hover:bg-(--border)/40"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Navbar Bar */}
      <div className="bg-(--card-bg)/80 backdrop-blur-xl border border-(--border)/60 flex justify-around items-center py-3 px-2 rounded-4xl shadow-2xl relative transition-all duration-300">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="flex flex-col items-center justify-center cursor-pointer p-1 w-14 relative"
            >
              {isActive && (
                <div className="absolute inset-0 bg-linear-to-b from-(--gradient-start)/20 to-transparent rounded-2xl pointer-events-none -z-10 opacity-70"></div>
              )}

              <div className={`transition-all duration-300 transform ${isActive ? "-translate-y-1 text-(--accent)" : "translate-y-0.5 text-(--text-secondary) hover:text-(--text-primary)"}`}>
                <Icon size={22} className={`${isActive ? "drop-shadow-md" : ""}`} />
              </div>

              <span
                className={`text-[10px] font-extrabold tracking-wide transition-all duration-300 overflow-hidden ${
                  isActive ? "max-h-4 opacity-100 mt-1.5 text-(--text-primary)" : "max-h-0 opacity-0 mt-0 text-(--text-secondary)"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}

        {/* More Button */}
        <div
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center justify-center cursor-pointer p-1 w-14 relative transition-colors ${
            showMore ? "text-(--accent)" : "text-(--text-secondary) hover:text-(--text-primary)"
          }`}
        >
           <div className={`transition-all duration-300 transform ${showMore ? "-translate-y-1" : "translate-y-0.5"}`}>
              <MoreHorizontal size={22} />
           </div>
           <span className={`text-[10px] font-extrabold tracking-wide transition-all duration-300 overflow-hidden ${
             showMore ? "max-h-4 opacity-100 mt-1.5" : "max-h-0 opacity-0 mt-0"
           }`}>
             More
           </span>
        </div>
      </div>
    </div>
  );
}