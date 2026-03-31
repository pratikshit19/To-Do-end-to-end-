import { Home, Calendar, LineChart, User } from "lucide-react";

export default function Navbar({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: "home", label: "Today", icon: Home },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "insights", label: "Insights", icon: LineChart },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-(--card-bg) flex justify-around items-center py-4 z-50">

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;

        return (
          <div
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex flex-col items-center justify-center text-xs cursor-pointer transition-all duration-200 ${
              isActive
                ? "text-(--accent)"
                : "text-(--text-secondary) hover:text-(--accent)"
            }`}
          >
            <Icon size={22} />
            <span className="mt-1">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}