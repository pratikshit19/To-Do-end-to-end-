import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { CreateTodo } from "./components/CreateTodo";
import Todos from "./components/Todos";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Schedule from "./components/Schedule";
import Onboarding from "./components/Onboarding";
import Navbar from "./components/Navbar";
import Insights from "./components/Insights";
import { Toaster } from "react-hot-toast";
import { Home, Calendar, TrendingUp, User, Settings as SettingsIcon, Sun, Moon, Plus, Zap } from "lucide-react";
import API_BASE_URL from "./config";
import useStore from "./store/useStore";
import FocusTimer from "./components/FocusTimer";

function AppContent() {
  /* ================= STATE ================= */
  const navigate = useNavigate();
  const location = useLocation();

  const {
    todos,
    userProfile,
    isLoading,
    focusMode,
    fetchTodos,
    fetchUserProfile,
    fetchFocusSessions,
    searchQuery,
    setSearchQuery
  } = useStore();

  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem("onboardingDone")
  );

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!(localStorage.getItem("token") || sessionStorage.getItem("token"))
  );
  const [isLogin, setIsLogin] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  const openModal = (todo = null) => {
    setEditingTodo(todo);
    setShowModal(true);
  };

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "false" ? false : true
  );

  const [colorTheme, setColorTheme] = useState(
    localStorage.getItem("colorTheme") || "blue"
  );

  const currentPage = location.pathname === '/' ? 'home' : location.pathname.substring(1);

  const setCurrentPage = (page) => {
    navigate(page === 'home' ? '/' : `/${page}`);
  };

  /* ================= THEME ================= */
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-color-theme", colorTheme);
    localStorage.setItem("colorTheme", colorTheme);

    // Clear out the obsolete inline style that the old Settings approach left stuck on your HTML tag!
    document.documentElement.style.removeProperty("--accent");
  }, [colorTheme]);

  /* ================= TOKEN ================= */
  const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setIsAuthenticated(false);
    useStore.setState({ todos: [], focusSessions: [], userProfile: { username: "User", profilePhoto: "" } });
    setCurrentPage("home");
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
      fetchUserProfile();
      fetchFocusSessions();
    } else {
      useStore.setState({ isLoading: false });
    }
  }, [isAuthenticated, fetchTodos, fetchUserProfile, fetchFocusSessions]);

  /* ================= FLOW ================= */

  if (showOnboarding) {
    return (
      <Onboarding
        onFinish={() => {
          localStorage.setItem("onboardingDone", "true");
          setShowOnboarding(false);
          setIsLogin(true);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden bg-(--bg) text-(--text-primary)">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-(--gradient-start)/10 blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-(--gradient-end)/10 blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>

        <div className="w-full max-w-md bg-(--card-bg) shadow-2xl shadow-(--gradient-start)/5 rounded-[2rem] p-8 sm:p-10 border border-(--border)/80 relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center justify-center mb-5 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-(--gradient-start) to-(--gradient-end) text-white flex items-center justify-center text-2xl shadow-xl shadow-(--gradient-start)/30 ring-4 ring-(--gradient-start)/10">
              <span className="font-extrabold pb-[2px]">T</span>
            </div>
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-(--gradient-start) to-(--gradient-end) bg-clip-text text-transparent">
                TaskFlow
              </h1>
              <p className="text-sm font-medium opacity-60">
                {isLogin === true
                  ? "Sign in to your workspace"
                  : isLogin === false
                    ? "Start your journey today"
                    : "Securely reset your password"}
              </p>
            </div>
          </div>

          <div className="w-full">
            {isLogin === true ? (
              <Login
                setIsAuthenticated={setIsAuthenticated}
                setIsLogin={setIsLogin}
              />
            ) : isLogin === false ? (
              <Signup setIsLogin={setIsLogin} />
            ) : (
              <ForgotPassword setIsLogin={setIsLogin} />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-(--bg) flex flex-col items-center justify-center text-(--text-primary)">
        <div className="w-12 h-12 border-4 border-(--accent) border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-5 text-sm opacity-60 font-medium tracking-wide">Loading workspace...</p>
      </div>
    );
  }

  /* ================= CONFIG ================= */
  const NAV_ITEMS = [
    { id: "home", label: "Dashboard", icon: Home },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "insights", label: "Insights", icon: TrendingUp },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  /* ================= MAIN APP ================= */

  return (
    <div className="md:flex h-screen bg-(--bg) text-(--text-primary) overflow-hidden">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex md:flex-col w-64 bg-(--card-bg) border-r border-(--border) relative shadow-sm z-20">
        <div className="p-6">
          <div className="text-2xl font-bold mb-8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-(--gradient-start) to-(--gradient-end) text-white flex items-center justify-center text-lg shadow-lg">
              <span className="font-extrabold pb-[2px]">T</span>
            </div>
            <span className="bg-linear-to-r from-(--gradient-start) to-(--gradient-end) bg-clip-text text-transparent">TaskFlow</span>
          </div>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 font-medium group ${isActive
                    ? "bg-(--accent)/10 text-(--accent)"
                    : "text-(--text-primary) opacity-70 hover:opacity-100 hover:bg-(--border)/60"
                    }`}
                >
                  <Icon size={20} className={`${isActive ? "text-(--accent)" : "opacity-80 group-hover:opacity-100"} transition-colors`} />
                  {item.label}
                </div>
              );
            })}

            {focusMode && (
              <div
                onClick={() => setShowFocusTimer(true)}
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 mt-4 group"
              >
                <Zap size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
                Focus Mode
              </div>
            )}
          </nav>
        </div>

        {/* User Mini Profile */}
        <div className="mt-auto p-4 border-t border-(--border)">
          <div
            onClick={() => setCurrentPage('profile')}
            className="flex items-center gap-3 cursor-pointer hover:bg-(--border)/60 p-2.5 rounded-2xl transition"
          >
            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-(--gradient-start) to-(--gradient-end) shadow-md flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
              {userProfile.profilePhoto ? (
                <img src={userProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userProfile.username?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{userProfile.username || "My Workspace"}</span>
              <span className="text-xs opacity-60">Pro Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN AREA ================= */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center px-8 py-5 border-b border-(--border) bg-(--bg)/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-50 font-medium">TaskFlow</span>
            <span className="opacity-40">/</span>
            <span className="font-semibold text-(--accent) capitalize">
              {currentPage === 'home' ? 'Dashboard' : currentPage}
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* Desktop Search */}
            <div className="relative hidden lg:block w-64 xl:w-80 group">
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-(--card-bg) border border-(--border)/60 text-sm focus:ring-2 focus:ring-(--accent)/30 outline-none transition-all shadow-sm"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                <Plus size={16} className="rotate-45" />
              </div>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-(--border) transition text-(--text-primary) opacity-70 hover:opacity-100 focus:outline-none"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-(--accent) text-white font-medium hover:brightness-110 active:scale-95 shadow-md shadow-(--gradient-start)/20 transition-all duration-200"
            >
              <Plus size={18} />
              Create Task
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 md:p-8 w-full">
          <div className="max-w-6xl mx-auto h-full">
            <Routes>
              <Route path="/" element={
                <Todos
                  todos={todos}
                  fetchTodos={fetchTodos}
                  onLogout={handleLogout}
                  setCurrentPage={setCurrentPage}
                  onEdit={openModal}
                />
              } />
              <Route path="/schedule" element={<Schedule todos={todos} />} />
              <Route path="/insights" element={<Insights setCurrentPage={setCurrentPage} todos={todos} />} />
              <Route path="/profile" element={
                <Profile
                  onLogout={handleLogout}
                  setCurrentPage={setCurrentPage}
                />
              } />
              <Route path="/settings" element={
                <Settings setCurrentPage={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} colorTheme={colorTheme} setColorTheme={setColorTheme} />
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* ================= MOBILE EXTRAS ================= */}

      {/* Floating buttons for mobile */}
      {!showOnboarding && isAuthenticated && (
        <div className="md:hidden fixed bottom-32 right-5 flex flex-col gap-4 z-40">
          {focusMode && (
            <button
              onClick={() => setShowFocusTimer(true)}
              className="w-14 h-14 rounded-2xl bg-(--card-bg) text-amber-500 flex items-center justify-center shadow-lg border border-amber-500/20 active:scale-95 transition-all"
            >
              <Zap size={24} fill="currentColor" className="opacity-20" />
            </button>
          )}
          <button
            onClick={() => openModal()}
            className="w-16 h-16 bg-linear-to-br from-(--gradient-start) to-(--gradient-end) text-white rounded-2xl flex items-center justify-center shadow-xl shadow-(--gradient-start)/30 active:scale-95 transition-all"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Mobile Navbar */}
      <div className="md:hidden z-50 relative bg-(--bg)">
        <Navbar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* ================= MODALS ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] transition-opacity duration-300">
          <div
            className="bg-transparent rounded-2xl w-[95%] max-w-md flex items-center justify-center z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            <CreateTodo
              fetchTodos={fetchTodos}
              closeModal={() => {
                setShowModal(false);
                setEditingTodo(null);
              }}
              currentTodo={editingTodo}
            />
          </div>
        </div>
      )}

      {showFocusTimer && (
        <FocusTimer closeModal={() => setShowFocusTimer(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <AppContent />
    </Router>
  );
}