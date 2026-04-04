import { useState, useEffect } from "react";
import { ChevronRight, Bell, Moon, Sun, Lock, Shield, HelpCircle, FileText, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";

export default function Settings({
  setCurrentPage,
  darkMode,
  setDarkMode,
  colorTheme,
  setColorTheme,
  onLogout,
}) {
  const [notifications, setNotifications] = useState(false);
  const [focusMode, setFocusMode] = useState(
    localStorage.getItem("focusMode") === "true"
  );

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  /* ================= NOTIFICATIONS ================= */
  useEffect(() => {
    if ("Notification" in window) {
      setNotifications(Notification.permission === "granted");
    }
  }, []);

  const handleNotificationToggle = async () => {
    if (!("Notification" in window)) {
      toast.error("Your browser does not support notifications.");
      return;
    }

    if (notifications) {
      toast("You must disable notifications via your browser's site settings.", { icon: "ℹ️" });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifications(true);
      toast.success("Notifications enabled!");
    } else {
      toast.error("Notification request denied.");
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      toast.error("Session expired.");
      return;
    }

    const toastId = toast.loading("Updating password...");

    try {
      const res = await fetch(`${API_BASE_URL}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to change password");

      toast.success(data.message, { id: toastId });
      setOldPassword("");
      setNewPassword("");
      setIsChangingPassword(false);
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  /* ================= LOCAL STORAGE ================= */
  useEffect(() => {
    localStorage.setItem("focusMode", focusMode);
  }, [focusMode]);

  /* ================= SUPPORT HANDLERS ================= */
  const triggerSupport = (item) => {
    toast(`Opening ${item}...`, { icon: "🚀" });
  };

  /* ================= TOGGLE UI ================= */
  const Toggle = ({ enabled, onClick }) => (
    <div
      onClick={onClick}
      className={`w-12 h-6 flex items-center rounded-full cursor-pointer transition-colors duration-300 ${
        enabled ? "bg-(--gradient-start)" : "bg-(--border)"
      }`}
    >
      <div
        className={`h-5 w-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </div>
  );

  return (
    <div className="w-full pb-24 md:pb-6 transition-colors duration-300">
      
      {/* APPEARANCE */}
      <h3 className="text-xl font-bold mb-4 px-2">Appearance</h3>
      <div className="bg-(--card-bg) rounded-3xl p-6 shadow-sm border border-(--border)/60 mb-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-(--bg) flex items-center justify-center border border-(--border)/50">
               {darkMode ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-amber-500" />}
             </div>
             <div>
               <p className="font-semibold text-base">Dark Mode</p>
               <p className="text-xs opacity-60">Comfortable viewing for low-light.</p>
             </div>
          </div>
          <Toggle enabled={darkMode} onClick={() => setDarkMode(!darkMode)} />
        </div>

        <div className="pt-2 border-t border-(--border)/40">
          <p className="font-semibold text-base mb-3">Color Theme</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setColorTheme('blue')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 outline-none ${
                colorTheme === 'blue' 
                  ? 'border-2 border-blue-500 bg-blue-500/10 text-blue-500 shadow-md shadow-blue-500/10 scale-[1.02]' 
                  : 'border-2 border-(--border)/50 text-(--text-secondary) hover:border-blue-500/30'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 shadow-sm" />
              Ocean Blue
            </button>
            <button 
              onClick={() => setColorTheme('purple')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 outline-none ${
                colorTheme === 'purple' 
                  ? 'border-2 border-purple-500 bg-purple-500/10 text-purple-500 shadow-md shadow-purple-500/10 scale-[1.02]' 
                  : 'border-2 border-(--border)/50 text-(--text-secondary) hover:border-purple-500/30'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-linear-to-br from-purple-500 to-pink-500 shadow-sm" />
              Neon Purple
            </button>
          </div>
        </div>

      </div>

      {/* ACCOUNT & SECURITY */}
      <h3 className="text-xl font-bold mb-4 px-2">Account & Security</h3>
      <div className="bg-(--card-bg) rounded-3xl p-6 shadow-sm border border-(--border)/60 mb-8">
        
        <div className="flex flex-col space-y-4">
          <div 
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-(--bg) flex items-center justify-center border border-(--border)/50 group-hover:border-(--accent)/50 transition-colors">
                 <Shield size={20} className="text-(--accent)" />
               </div>
               <div>
                 <p className="font-semibold text-base">Change Password</p>
                 <p className="text-xs opacity-60">Update your workspace security key.</p>
               </div>
            </div>
            <button className="text-sm font-semibold px-4 py-2 rounded-lg bg-(--accent)/10 text-(--accent) hover:bg-(--accent)/20 transition-colors">
              {isChangingPassword ? "Cancel" : "Update"}
            </button>
          </div>

          {/* Password Form Expansion */}
          {isChangingPassword && (
             <form onSubmit={handlePasswordChange} className="mt-4 p-5 bg-(--bg) rounded-2xl border border-(--border)/40 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
               <div>
                 <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1.5 block">Current Password</label>
                 <input 
                   type="password" 
                   value={oldPassword} 
                   onChange={(e) => setOldPassword(e.target.value)} 
                   placeholder="Enter old password"
                   required
                   className="w-full px-4 py-2.5 bg-(--card-bg) border border-transparent focus:border-(--accent) focus:ring-2 ring-(--accent)/20 rounded-xl text-sm outline-none transition-all"
                 />
               </div>
               <div>
                 <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1.5 block">New Password</label>
                 <input 
                   type="password" 
                   value={newPassword} 
                   onChange={(e) => setNewPassword(e.target.value)} 
                   placeholder="Enter new password"
                   required
                   className="w-full px-4 py-2.5 bg-(--card-bg) border border-transparent focus:border-(--accent) focus:ring-2 ring-(--accent)/20 rounded-xl text-sm outline-none transition-all"
                 />
               </div>
               <button 
                 type="submit" 
                 className="w-full py-2.5 rounded-xl bg-(--accent) text-white font-bold hover:brightness-110 transition-all shadow-md shadow-(--gradient-start)/20"
               >
                 Confirm Change
               </button>
             </form>
          )}
        </div>

      </div>

      {/* PREFERENCES */}
      <h3 className="text-xl font-bold mb-4 px-2">Preferences</h3>
      <div className="bg-(--card-bg) rounded-3xl p-6 shadow-sm border border-(--border)/60 mb-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-(--bg) flex items-center justify-center border border-(--border)/50">
               <Bell size={20} className={notifications ? "text-green-500" : "text-(--text-secondary)"} />
             </div>
             <div>
               <p className="font-semibold text-base">Desktop Notifications</p>
               <p className="text-xs opacity-60">Push alerts for due dates via browser.</p>
             </div>
          </div>
          <Toggle enabled={notifications} onClick={handleNotificationToggle} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-(--bg) flex items-center justify-center border border-(--border)/50">
               <Lock size={20} className={focusMode ? "text-(--accent)" : "text-(--text-secondary)"} />
             </div>
             <div>
               <p className="font-semibold text-base">Focus Mode</p>
               <p className="text-xs opacity-60">Hides UI distractions during sessions.</p>
             </div>
          </div>
          <Toggle enabled={focusMode} onClick={() => setFocusMode(!focusMode)} />
        </div>

      </div>

      {/* SUPPORT */}
      <h3 className="text-xl font-bold mb-4 px-2">Legal & Support</h3>
      <div className="bg-(--card-bg) rounded-3xl shadow-sm border border-(--border)/60 mb-8 overflow-hidden">
        {[
          { label: "Send Feedback", icon: MessageSquare },
          { label: "Help Center & FAQ", icon: HelpCircle },
          { label: "Terms of Service", icon: FileText },
          { label: "Privacy Policy", icon: Shield }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              onClick={() => triggerSupport(item.label)}
              className={`flex items-center justify-between p-5 cursor-pointer hover:bg-(--border)/40 transition-colors
                ${index !== 3 ? "border-b border-(--border)/40" : ""}
              `}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-(--text-secondary)" />
                <span className="font-semibold text-sm">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-(--text-secondary)" />
            </div>
          );
        })}
      </div>

    </div>
  );
}