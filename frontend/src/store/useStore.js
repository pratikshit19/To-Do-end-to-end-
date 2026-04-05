import { create } from "zustand";
import API_BASE_URL from "../config";

const useStore = create((set, get) => ({
  todos: [],
  focusSessions: [],
  currentWorkspace: "personal", 
  teams: [],
  notifications: [],
  userProfile: {
    username: (() => {
      const u = localStorage.getItem("username") || sessionStorage.getItem("username");
      return (u && u !== "User") ? u : "My Workspace";
    })(),
    profilePhoto: (localStorage.getItem("profilePhoto") || sessionStorage.getItem("profilePhoto")) && 
                  !(localStorage.getItem("profilePhoto") || sessionStorage.getItem("profilePhoto")).includes("/uploads/")
      ? (localStorage.getItem("profilePhoto") || sessionStorage.getItem("profilePhoto")) 
      : ""
  },
  focusMode: localStorage.getItem("focusMode") === "true",
  darkMode: localStorage.getItem("darkMode") === "false" ? false : true,
  colorTheme: localStorage.getItem("colorTheme") || "blue",
  isLoading: true,
  searchQuery: "",
  showPricingModal: false,
  
  // Pro Features
  isPro: false,
  proSettings: {
    accentColor: null,
    customBackground: null
  },
  dailyFocusTarget: 60,

  /* ================= APP SETTINGS ================= */
  setFocusMode: (enabled) => {
    localStorage.setItem("focusMode", enabled);
    set({ focusMode: enabled });
    get().savePreferences({ focusMode: enabled });
  },
  setDarkMode: (enabled) => {
    localStorage.setItem("darkMode", enabled);
    set({ darkMode: enabled });
    get().savePreferences({ darkMode: enabled });
  },
  setColorTheme: (theme) => {
    localStorage.setItem("colorTheme", theme);
    set({ colorTheme: theme });
    get().savePreferences({ theme });
  },
  savePreferences: async (prefs) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/user/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(prefs)
      });
    } catch(err) { console.error("Failed to save prefs:", err); }
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowPricingModal: (show) => set({ showPricingModal: show }),
  
  setCurrentWorkspace: (workspaceId) => set({ currentWorkspace: workspaceId }),
  
  fetchTeams: async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      set({ teams: data.teams || [] });
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  },

  renameTeam: async (teamId, newName) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/team/${teamId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newName }),
      });
      if (response.ok) {
        const data = await response.json();
        set((state) => ({
          teams: state.teams.map((t) => t._id === teamId ? { ...t, name: data.team.name } : t)
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to rename team:", err);
      return false;
    }
  },

  deleteTeam: async (teamId) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/team/${teamId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        set((state) => {
          const newTeams = state.teams.filter((t) => t._id !== teamId);
          const nextWorkspace = state.currentWorkspace === teamId ? "personal" : state.currentWorkspace;
          return { teams: newTeams, currentWorkspace: nextWorkspace };
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to delete team:", err);
      return false;
    }
  },
  
  updateProSettings: async (settings) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/pro-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        const data = await response.json();
        set((state) => ({
          proSettings: { ...state.proSettings, ...data.proSettings },
          dailyFocusTarget: data.dailyFocusTarget ?? state.dailyFocusTarget
        }));
        
        // Legacy: We no longer set --accent manually from proSettings since we have proper colorThemes
      }
    } catch (err) {
      console.error("Failed to update pro settings", err);
    }
  },

  upgradeToPro: async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/upgrade-to-pro`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        set({ isPro: true });
        return true;
      }
    } catch (err) {
      console.error("Upgrade failed", err);
    }
    return false;
  },

  /* ================= AUTH ================= */
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  
  /* ================= PROFILE ================= */
  fetchUserProfile: async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle legacy local uploads that no longer exist on the server
        let photo = data.profilePhoto || "";
        if (photo.includes("/uploads/")) {
          photo = ""; // Fallback to initials
        }

        const profile = {
          username: data.username || "User",
          profilePhoto: photo,
          isPro: data.isPro || false,
          proSettings: data.proSettings || { accentColor: null, customBackground: null },
          dailyFocusTarget: data.dailyFocusTarget || 60
        };
        
        if (data._id) {
          localStorage.setItem("userId", data._id);
        }

        if (data.username && data.username !== "User") {
          localStorage.setItem("username", data.username);
        }

        if (data.preferences) {
          localStorage.setItem("darkMode", data.preferences.darkMode);
          localStorage.setItem("colorTheme", data.preferences.theme);
          localStorage.setItem("focusMode", data.preferences.focusMode);
          
          set({
            darkMode: data.preferences.darkMode,
            colorTheme: data.preferences.theme,
            focusMode: data.preferences.focusMode
          });
        }

        set({ 
          userProfile: profile,
          isPro: profile.isPro,
          proSettings: profile.proSettings,
          dailyFocusTarget: profile.dailyFocusTarget
        });

        // Legacy: We no longer set --accent manually from proSettings since we have proper colorThemes
        if (profile.profilePhoto) {
          localStorage.setItem("profilePhoto", profile.profilePhoto);
        } else {
          localStorage.removeItem("profilePhoto");
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  },

  setUserProfile: (profile) => set((state) => ({ 
    userProfile: { ...state.userProfile, ...profile } 
  })),

  /* ================= TODOS ================= */
  fetchTodos: async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const { currentWorkspace } = get();
      const response = await fetch(`${API_BASE_URL}/todos?teamId=${currentWorkspace}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      set({ todos: data.todos || [], isLoading: false });
    } catch (err) {
      console.error("Failed to fetch todos:", err);
      set({ isLoading: false });
    }
  },

  addTodo: (newTodo) => set((state) => ({ todos: [...state.todos, newTodo] })),
  
  updateTodo: async (id, updates) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updates),
      });
      const updated = await response.json();
      set((state) => ({
        todos: state.todos.map((t) => (t._id === id ? updated : t))
      }));
    } catch (err) {
      console.error("Failed to update todo:", err);
    }
  },

  deleteTodo: async (id) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({
        todos: state.todos.filter((t) => t._id !== id)
      }));
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  },

  /* ================= FOCUS SESSIONS ================= */
  fetchFocusSessions: async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/focus-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      set({ focusSessions: data.focusSessions || [] });
    } catch (err) {
      console.error("Failed to fetch focus sessions:", err);
    }
  },

  addFocusSession: async (duration) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/focus-sessions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ duration }),
      });
      const newSession = await response.json();
      set((state) => ({
        focusSessions: [newSession, ...state.focusSessions]
      }));
    } catch (err) {
      console.error("Failed to save focus session:", err);
    }
  },

  /* ================= NOTIFICATIONS ================= */
  fetchNotifications: async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      set({ notifications: data.notifications || [] });
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  },

  markNotificationAsRead: async (id) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({
        notifications: state.notifications.map((n) => 
          n._id === id ? { ...n, read: true } : n
        )
      }));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  },

  /* ================= DERIVED STATS ================= */
  getStats: () => {
    const { todos, focusSessions } = get();
    
    // Streak Logic
    const completedDays = todos
      .filter((t) => t.completed)
      .map((t) => new Date(t.completedAt || t.updatedAt).toDateString());
    
    const uniqueDays = [...new Set(completedDays)];
    const streak = uniqueDays.length; // Active Days Count is more intuitive for streaks

    // Completion Rate
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Focus Time
    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const focusHours = Math.floor(totalFocusMinutes / 60);
    const focusRemainingMinutes = totalFocusMinutes % 60;

    return {
      streak,
      completionRate: rate,
      totalFocusTime: `${focusHours}h ${focusRemainingMinutes}m`,
      completedCount: completed,
      totalCount: total
    };
  }
}));

export default useStore;
