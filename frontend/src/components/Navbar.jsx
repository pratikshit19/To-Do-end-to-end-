import { Home, Calendar, LineChart, User } from "lucide-react";

export default function Navbar({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: "home", label: "Today", icon: Home },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "insights", label: "Insights", icon: LineChart },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm bg-(--card-bg)/80 backdrop-blur-xl border border-(--border)/60 flex justify-around items-center py-3 px-2 rounded-4xl shadow-2xl z-50 transition-all duration-300">

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;

        return (
          <div
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className="flex flex-col items-center justify-center cursor-pointer p-1.5 w-16 relative"
          >
            {/* Active Indicator Glow */}
            {isActive && (
              <div className="absolute inset-0 bg-linear-to-b from-(--gradient-start)/20 to-transparent rounded-2xl pointer-events-none -z-10 opacity-70"></div>
            )}

            <div className={`transition-all duration-300 transform ${isActive ? "-translate-y-1 text-(--accent)" : "translate-y-0.5 text-(--text-secondary) hover:text-(--text-primary)"}`}>
              <Icon size={22} className={`${isActive ? "drop-shadow-md" : ""}`} />
            </div>

            <span
              className={`text-[10px] font-extrabold tracking-wide transition-all duration-300 overflow-hidden ${isActive ? "max-h-4 opacity-100 mt-1.5 text-(--text-primary)" : "max-h-0 opacity-0 mt-0 text-(--text-secondary)"
                }`}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}