import { useState, useEffect } from "react";
import { ChevronRight, Bell, Moon, Sun, Lock, Shield, HelpCircle, FileText, MessageSquare, X, Users } from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";
import useStore from "../store/useStore";


export default function Settings({
  setCurrentPage,
  darkMode,
  setDarkMode,
  colorTheme,
  setColorTheme,
  onLogout,
}) {
  const { focusMode, setFocusMode, isPro, userProfile, linkBuddy, unlinkBuddy, setShowPricingModal } = useStore();
  const [notifications, setNotifications] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState("bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showToSModal, setShowToSModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  /* ================= FOCUS BUDDY ================= */
  const [buddyDraft, setBuddyDraft] = useState("");
  const [isEditingBuddy, setIsEditingBuddy] = useState(false);

  const handleSaveBuddy = async (e) => {
    e.preventDefault();
    if (!buddyDraft.trim()) return;
    
    const res = await linkBuddy(buddyDraft);
    if (res.success) {
      toast.success(res.message);
      setIsEditingBuddy(false);
      setBuddyDraft("");
    } else {
      toast.error(res.message);
    }
  };

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
    if (!oldPassword || !newPassword) return;

    try {
      const res = await fetch(`${API_BASE_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Password updated!");
        setOldPassword("");
        setNewPassword("");
        setIsChangingPassword(false);
      } else {
        toast.error(data.message || "Failed to update password.");
      }
    } catch (err) {
      toast.error("Network error.");
    }
  };

  /* ================= SUPPORT HANDLERS ================= */
  const triggerSupport = (item) => {
    if (item === "Send Feedback") {
      setShowFeedbackModal(true);
    } else if (item === "Terms of Service") {
      setShowToSModal(true);
    } else if (item === "Privacy Policy") {
      setShowPrivacyModal(true);
    } else if (item === "FAQ") {
      setShowFAQModal(true);
    } else {
      toast(`Opening ${item}...`, { icon: "🚀" });
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    const toastId = toast.loading("Sending feedback...");
    setIsSubmittingFeedback(true);

    try {
      const res = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({ category: feedbackCategory, message: feedbackMessage }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Feedback sent!", { id: toastId });
        setFeedbackMessage("");
        setShowFeedbackModal(false);
      } else {
        toast.error(data.message || "Failed to send feedback.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error.", { id: toastId });
    } finally {
      setIsSubmittingFeedback(false);
    }
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
          <p className="font-semibold text-base mb-4">Color Theme</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'blue', name: 'Ocean Blue', colors: 'from-blue-500 to-cyan-500', base: 'blue-500', isFree: true },
              { id: 'purple', name: 'Neon Purple', colors: 'from-purple-500 to-pink-500', base: 'purple-500', isFree: true },
              { id: 'green', name: 'Emerald', colors: 'from-emerald-500 to-teal-500', base: 'emerald-500', isFree: false },
              { id: 'rose', name: 'Rose Pink', colors: 'from-rose-500 to-pink-500', base: 'rose-500', isFree: false },
              { id: 'orange', name: 'Sunset', colors: 'from-orange-500 to-amber-500', base: 'orange-500', isFree: false },
              { id: 'cyan', name: 'Electric', colors: 'from-cyan-500 to-blue-400', base: 'cyan-500', isFree: false },
            ].map((theme) => {
              const locked = !theme.isFree && !isPro;
              const active = colorTheme === theme.id;
              
              return (
                <button 
                  key={theme.id}
                  onClick={() => {
                    if (locked) {
                      toast("Unlock this theme with Pro! ✨", { icon: '🔒' });
                      return;
                    }
                    setColorTheme(theme.id);
                  }}
                  className={`relative p-3 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 transition-all duration-300 outline-none border-2
                    ${active 
                      ? `border-${theme.base} bg-${theme.base}/10 text-${theme.base} shadow-md scale-[1.02]` 
                      : 'border-(--border)/50 text-(--text-secondary) hover:border-(--border)'}
                    ${locked ? 'opacity-60 grayscale-[0.5]' : ''}
                  `}
                >
                  <div className={`w-8 h-8 rounded-full bg-linear-to-br ${theme.colors} shadow-sm`} />
                  <span className="text-[10px] uppercase tracking-wider">{theme.name}</span>
                  
                  {locked && (
                    <div className="absolute top-1.5 right-1.5 bg-linear-to-br from-amber-400 to-orange-500 text-white rounded-full p-1 shadow-sm">
                      <Lock size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
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

        <div className="pt-2 border-t border-(--border)/40">
           <div 
             onClick={() => {
                if(!isPro) {
                   toast("Pro Feature: Upgrade to link a focus buddy", { icon: <Lock size={16} /> });
                   setShowPricingModal(true);
                   return;
                }
                setIsEditingBuddy(!isEditingBuddy);
             }}
             className="flex items-center justify-between cursor-pointer group mb-2"
           >
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-(--bg) flex items-center justify-center border border-(--border)/50 group-hover:border-emerald-500/50 transition-colors">
                  <Users size={20} className={userProfile?.buddyName ? "text-emerald-500" : "text-(--text-secondary)"} />
                </div>
                <div>
                  <p className="font-semibold text-base flex items-center gap-2">
                      Focus Buddy Multiplexer
                      {!isPro && <span className="text-[9px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded-sm font-black tracking-wider uppercase">PRO</span>}
                  </p>
                  <p className="text-xs opacity-60">
                    {userProfile?.buddyName 
                      ? `Linked with ${userProfile.buddyName}` 
                      : "Pair up for live accountability sessions."}
                  </p>
                </div>
             </div>
             <button className="text-sm font-semibold px-4 py-2 rounded-lg bg-(--bg) border border-(--border)/60 hover:bg-(--border) transition-colors">
               {isEditingBuddy ? "Close" : userProfile?.buddyName ? "Linked" : "Connect"}
             </button>
           </div>
           
           {isPro && isEditingBuddy && (
              <div className="mt-4 p-5 bg-(--bg) rounded-2xl border border-(--border)/40 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block text-emerald-500">Your Invite Code</label>
                   <div className="flex items-center justify-between bg-(--bg) p-3 rounded-xl border border-emerald-500/20">
                      <span className="font-mono font-black text-lg tracking-widest text-emerald-500">{userProfile?.buddyCode || "------"}</span>
                      <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         if (userProfile?.buddyCode) {
                           navigator.clipboard.writeText(userProfile.buddyCode);
                           toast.success("Code copied!");
                         }
                       }}
                       className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-md"
                      >
                        Copy
                      </button>
                   </div>
                 </div>

                  {userProfile?.buddyName ? (
                     <div className="pt-2 border-t border-(--border)/40 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 block text-red-500">Connected with {userProfile.buddyName}</p>
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to disconnect from ${userProfile.buddyName}?`)) {
                              const res = await unlinkBuddy();
                              if (res.success) {
                                toast.success("Buddy disconnected");
                                setIsEditingBuddy(false);
                              } else {
                                toast.error(res.message);
                              }
                            }
                          }}
                          className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        >
                          Disconnect Buddy
                        </button>
                     </div>
                  ) : (
                    <form onSubmit={handleSaveBuddy} className="flex gap-3">
                      <input 
                        type="text" 
                        value={buddyDraft} 
                        onChange={(e) => setBuddyDraft(e.target.value)} 
                        placeholder="Enter Buddy's secret code"
                        className="flex-1 px-4 py-2 bg-(--card-bg) border border-transparent focus:border-emerald-500 focus:ring-2 ring-emerald-500/20 rounded-xl text-sm outline-none transition-all uppercase font-mono font-bold"
                      />
                      <button 
                        type="submit" 
                        className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:brightness-110 transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap"
                      >
                        Link Buddy
                      </button>
                    </form>
                  )}
              </div>
           )}
        </div>

      </div>

      {/* SUPPORT */}
      <h3 className="text-xl font-bold mb-4 px-2">Legal & Support</h3>
      <div className="bg-(--card-bg) rounded-3xl shadow-sm border border-(--border)/60 mb-8 overflow-hidden">
        {[
          { label: "Send Feedback", icon: MessageSquare },
          { label: "FAQ", icon: HelpCircle },
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

      {/* FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="w-full max-w-lg bg-(--card-bg) rounded-[2.5rem] p-8 shadow-2xl border border-(--border)/60 relative overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-(--accent)/10 rounded-full blur-[60px] pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-(--accent)/10 flex items-center justify-center text-(--accent)">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Send Feedback</h2>
                  <p className="text-xs font-bold opacity-50 uppercase tracking-widest">We're listening</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-(--border)/30 transition-colors opacity-60 hover:opacity-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-6 relative z-10">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 block">Topic Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "bug", label: "Bug 🐞" },
                    { id: "feature", label: "Idea 💡" },
                    { id: "love", label: "Love ❤️" },
                    { id: "other", label: "Other 💬" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedbackCategory(cat.id)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all tracking-wider
                        ${feedbackCategory === cat.id 
                          ? 'bg-(--accent) text-white shadow-lg shadow-(--accent)/20' 
                          : 'bg-(--bg) border border-(--border)/50 opacity-60 hover:opacity-100'}
                      `}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 block">Message Details</label>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what's on your mind... your feedback helps us build a better workspace!"
                  rows={4}
                  className="w-full px-5 py-4 bg-(--bg) rounded-2xl text-sm font-medium border border-transparent focus:border-(--accent) focus:ring-4 ring-(--accent)/50 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-(--border)/30 hover:bg-(--border)/50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="flex-[2] py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-linear-to-br from-(--gradient-start) to-(--gradient-end) text-white shadow-xl shadow-(--gradient-start)/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmittingFeedback ? "Sending..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEGAL MODALS */}
      <LegalModal 
        isOpen={showToSModal} 
        onClose={() => setShowToSModal(false)} 
        title="Terms of Service"
        icon={<FileText size={24} />}
        content={termsOfService}
      />

      <LegalModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
        title="Privacy Policy"
        icon={<Shield size={24} />}
        content={privacyPolicy}
      />

      <LegalModal 
        isOpen={showFAQModal} 
        onClose={() => setShowFAQModal(false)} 
        title="FAQ"
        icon={<HelpCircle size={24} />}
        content={faqData}
      />

    </div>
  );
}

/* ================= COMPONENT: LEGAL MODAL ================= */
const LegalModal = ({ isOpen, onClose, title, icon, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-2xl bg-(--card-bg) rounded-[2.5rem] p-8 shadow-2xl border border-(--border)/60 relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-(--accent)/10 rounded-full blur-[60px] pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-(--accent)/10 flex items-center justify-center text-(--accent)">
              {icon}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{title}</h2>
              <p className="text-xs font-bold opacity-50 uppercase tracking-widest">Effective Date: April 2026</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-(--border)/30 transition-colors opacity-60 hover:opacity-100"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 text-sm leading-relaxed space-y-6 opacity-80">
          {content.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-base font-black mb-3 text-(--text-primary)">{section.title}</h3>
              <p className="whitespace-pre-line">{section.text}</p>
            </div>
          ))}
        </div>

        <div className="pt-6 mt-2 relative z-10">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-linear-to-br from-(--gradient-start) to-(--gradient-end) text-white shadow-xl shadow-(--gradient-start)/20 hover:scale-[1.01] active:scale-95 transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= LEGAL CONTENT ================= */
const termsOfService = [
  {
    title: "1. Acceptance of Terms",
    text: "By accessing TaskFlow, you agree to comply with our Terms of Service. If you do not agree, please do not use our services."
  },
  {
    title: "2. Your Account",
    text: "You are responsible for maintaining the security of your workspace. TaskFlow is not liable for any actions taken under your account."
  },
  {
    title: "3. Pro Membership",
    text: "Pro features are provided on an 'as-is' basis. Subscriptions are billed periodically and are non-refundable unless specified otherwise. We reserve the right to modify subscription prices with prior notice."
  },
  {
    title: "4. User Content",
    text: "Your todos, focus sessions, and team data are yours. We do not claim ownership of your content. However, by using TaskFlow, you grant us permission to host and process this data to provide the service."
  },
  {
    title: "5. Limitation of Liability",
    text: "TaskFlow is not responsible for any productivity loss, data corruption, or missed deadlines. We strive for 99.9% uptime but do not guarantee it."
  }
];

const privacyPolicy = [
  {
    title: "1. Data Collection",
    text: "We collect only what's necessary: your email (for auth), profile info, and your task/focus data. We do not sell your personal data to third parties."
  },
  {
    title: "2. AI Processing",
    text: "Premium features like Mind Sweep AI process your textual inputs using secure, state-of-the-art models. Your data is not used to train global AI models without your explicit consent."
  },
  {
    title: "3. Focus Tracking",
    text: "We record focus session durations to provide you with insights and streaks. This data is private to you and your linked Focus Buddy."
  },
  {
    title: "4. Security",
    text: "We use standard industry practices, including JWT authentication and encrypted database storage, to protect your digital workspace."
  },
  {
    title: "5. Cookies",
    text: "We use essential cookies to maintain your login session. No tracking or advertising cookies are used in the main application."
  }
];

const faqData = [
  {
    title: "1. How do I link a Focus Buddy?",
    text: "Go to Settings > Preferences > Focus Buddy Multiplexer. Your unique Invite Code is listed there. Give this code to your partner (who must also be a Pro user) and have them enter it into their 'Connect' field."
  },
  {
    title: "2. What is Mind Sweep AI?",
    text: "Mind Sweep is a Pro-exclusive feature that uses AI to analyze your raw thoughts or brain-dumps and automatically organizes them into a structured task list and schedule. You can access it via the Brain icon in your Navbar."
  },
  {
    title: "3. What is Frog Eater Mode?",
    text: "It's based on Mark Twain's 'Eat the Frog' philosophy. It forces you to complete your most dreaded task first by setting a non-pausable timer and locking your focus until the task is marked done."
  },
  {
    title: "4. Is my data secure?",
    text: "Yes! Your data is protected using industry-standard JWT authentication and encrypted in our database. We do not sell your personal data to any third parties."
  },
  {
    title: "5. Can I use TaskFlow on multiple devices?",
    text: "Absolutely! Just log in with your account on any supported device, and all your tasks, focus sessions, and team data will be synchronized instantly."
  }
];
