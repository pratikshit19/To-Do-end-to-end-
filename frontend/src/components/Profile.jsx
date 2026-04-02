import { ArrowLeft, Settings, Edit } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function Profile({
  setCurrentPage,
  todos = [],
  focusSessions = [],
}) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const [username, setUsername] = useState("");
    const [profilePhoto, setProfilePhoto] = useState("");

  useEffect(() => {
    const storedUsername =
      localStorage.getItem("username") ||
      sessionStorage.getItem("username");

    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);
    useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          "https://to-do-app-616k.onrender.com/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setProfilePhoto(data.profilePhoto || "");
      } catch (err) {
        console.error("Profile fetch failed:", err);
      }
    };

    fetchProfile();
  }, [token]);

  /* ---------------- TOTAL COMPLETED ---------------- */
  const totalCompleted = useMemo(() => {
    return todos.filter((t) => t.completed).length;
  }, [todos]);

  /* ---------------- COMPLETION % ---------------- */
  const completionPercentage = useMemo(() => {
    if (!todos.length) return 0;
    const completed = todos.filter((t) => t.completed).length;
    return Math.round((completed / todos.length) * 100);
  }, [todos]);

  /* ---------------- STREAK ---------------- */
  const streak = useMemo(() => {
    const completedDates = todos
      .filter((t) => t.completed)
      .map((t) => new Date(t.completedAt).toDateString());

    const uniqueDates = [...new Set(completedDates)].sort(
      (a, b) => new Date(b) - new Date(a)
    );

    let count = 0;
    let currentDate = new Date();

    for (let i = 0; i < uniqueDates.length; i++) {
      const compareDate = new Date(uniqueDates[i]);

      if (
        compareDate.toDateString() ===
        currentDate.toDateString()
      ) {
        count++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
  }, [todos]);

  /* ---------------- FOCUS TIME ---------------- */
  const totalFocusTime = useMemo(() => {
    const totalMinutes = focusSessions.reduce(
      (acc, session) => acc + (session.duration || 0),
      0
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  }, [focusSessions]);

  /* ---------------- WEEKLY RANK ---------------- */
  const weeklyRank = useMemo(() => {
    if (completionPercentage >= 90) return "Top 5%";
    if (completionPercentage >= 75) return "Top 15%";
    if (completionPercentage >= 60) return "Top 30%";
    return "Keep Pushing";
  }, [completionPercentage]);

  /* ---------------- GOALS ---------------- */
  const goals = useMemo(() => {
    const today = new Date().toDateString();

    const todaytodos = todos.filter(
      (t) =>
        t.completed &&
        new Date(t.completedAt).toDateString() === today
    );

    const dailyReading = Math.min(
      Math.round((todaytodos.length / 5) * 100),
      100
    );

    const meditation = Math.min(
      Math.round((focusSessions.length / 7) * 100),
      100
    );

    return [
      { name: "Daily Productivity", percent: dailyReading },
      { name: "Focus Consistency", percent: meditation },
    ];
  }, [todos, focusSessions]);

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:px-10 lg:px-20 
                  bg-(--bg) ">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <ArrowLeft
          className="cursor-pointer opacity-70 hover:opacity-100 transition"
          onClick={() => setCurrentPage("home")}
        />
        <h3 className="text-lg font-semibold">Profile</h3>
        <Settings
          className="cursor-pointer opacity-70 hover:opacity-100 transition"
          onClick={() => setCurrentPage("settings")}
        />
      </div>

      {/* Avatar Card */}
      <div className="flex items-center justify-between 
                     bg-(--card-bg) text-(--text-primary) 
                      p-5 rounded-2xl mb-8 shadow-md">

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center 
                          rounded-full 
                          bg-gradient-to-br from-cyan-400 to-blue-500 
                          text-white text-xl font-bold">
           {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              username?.charAt(0).toUpperCase() || "U"
            )}
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              {username || "User"}
            </h3>
            <span className="text-xs px-2 py-1 rounded-full 
                             bg-(--accent)/30
                             text-(--accent)">
              PRO MEMBER
            </span>
          </div>
        </div>

        <Edit size={18} className="opacity-70" />
      </div>

      {/* Accomplishments */}
      <div className="mb-8">
        <p className="text-xs tracking-widest opacity-60 mb-2">
          TOTAL ACCOMPLISHMENTS
        </p>
        <h1 className="text-3xl md:text-4xl font-bold">
          {totalCompleted.toLocaleString()}{" "}
          <span className="text-base font-normal opacity-60">
            todos Completed
          </span>
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-(--card-bg) p-4 rounded-xl shadow-md">
          <p className="text-xs opacity-60 mb-1">CURRENT STREAK</p>
          <h3 className="text-lg font-semibold">{streak} Days</h3>
        </div>

        <div className="bg-(--card-bg) p-4 rounded-xl shadow-md">
          <p className="text-xs opacity-60 mb-1">FOCUS TIME</p>
          <h3 className="text-lg font-semibold">{totalFocusTime}</h3>
        </div>

        <div className="bg-(--card-bg) p-4 rounded-xl shadow-md">
          <p className="text-xs opacity-60 mb-1">COMPLETION</p>
          <h3 className="text-lg font-semibold">{completionPercentage}%</h3>
        </div>

        <div className="bg-(--card-bg) p-4 rounded-xl shadow-md">
          <p className="text-xs opacity-60 mb-1">WEEKLY RANK</p>
          <h3 className="text-lg font-semibold">{weeklyRank}</h3>
        </div>
      </div>

      {/* Goals */}
      <div className="mb-10">
        <h4 className="font-semibold mb-4">Active Goals</h4>

        <div className="space-y-5">
          {goals.map((goal, index) => (
            <div key={index}>
              <div className="flex justify-between mb-2 text-sm">
                <span>{goal.name}</span>
                <span>{goal.percent}%</span>
              </div>

              <div className="w-full h-2 bg-(--card-bg) rounded-full">
                <div
                  className="h-2 bg-(--accent) rounded-full transition-all"
                  style={{ width: `${goal.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-4 md:flex md:gap-4 md:space-y-0">
        {/* <button className="w-full md:w-auto px-6 py-3 rounded-xl 
                           bg-(--accent) hover:bg-(--accent)/80 
                           text-white font-medium transition">
          Edit Profile
        </button> */}

        <button
          className="w-full md:w-auto px-6 py-3 rounded-xl border border-(--accent) 
                     text-(--accent) hover:bg-(--accent)/20
                     hover:opacity-90 transition font-medium"
          onClick={() => setCurrentPage("insights")}
        >
          View Full Insights
        </button>
      </div>
    </div>
  );
}