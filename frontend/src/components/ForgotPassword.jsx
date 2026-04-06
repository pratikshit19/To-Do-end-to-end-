import { useState } from "react";
import { Lock, Eye, EyeOff, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";

export default function ForgotPassword({ setIsLogin, resetToken }) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFetchResetLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email is required");

    setLoading(true);
    const toastId = toast.loading("Processing...");

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send link");

      toast.success(data.message || "Reset link sent!", { id: toastId });
      setIsSent(true);
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    const toastId = toast.loading("Updating password...");

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Reset failed");

      toast.success("Password updated successfully!", { id: toastId });
      setIsLogin(true); // Redirect to login
      // Clean up URL if needed (handled by App.jsx usually)
      window.history.replaceState({}, document.title, "/");
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET MODE ================= */
  if (resetToken) {
    return (
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-xl font-bold mb-2 text-center">Create New Password</h2>
        <p className="text-sm opacity-60 mb-6 text-center">Enter a strong password for your account.</p>
        
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-(--card-bg) border border-(--border) focus:border-(--accent) outline-none transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-(--card-bg) border border-(--border) focus:border-(--accent) outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-(--accent) text-white font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    );
  }

  /* ================= SUCCESS MODE ================= */
  if (isSent) {
    return (
      <div className="w-full text-center py-6 animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
        <p className="text-sm opacity-60 mb-8 px-4">
          We've sent a recovery link to <b>{email}</b>. Please check your email to continue.
        </p>
        <button
          onClick={() => setIsLogin(true)}
          className="flex items-center justify-center gap-2 mx-auto text-sm font-bold text-(--accent) hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>
      </div>
    );
  }

  /* ================= FORGOT MODE ================= */
  return (
    <div className="w-full animate-in fade-in duration-500">
      <h2 className="text-xl font-bold mb-2 text-center">Forgot Password?</h2>
      <p className="text-sm opacity-60 mb-6 text-center px-4">
        Enter the email associated with your account and we'll send you a reset link.
      </p>

      <form onSubmit={handleFetchResetLink} className="space-y-4">
        <div className="relative">
          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-(--card-bg) border border-(--border) focus:border-(--accent) outline-none transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-(--accent) text-white font-bold hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          onClick={() => setIsLogin(true)}
          className="text-sm font-bold text-(--accent) hover:underline"
        >
          Remembered? Back to Login
        </button>
      </div>
    </div>
  );
}