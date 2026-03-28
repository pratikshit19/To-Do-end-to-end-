import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import "../Login.css"; // same styling as Login

export default function ForgotPassword({ setIsLogin }) {
  const [form, setForm] = useState({ username: "", newPassword: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (name, value) => {
    if (!value.trim()) return `${name} is required`;
    if (name === "newPassword" && value.length < 6)
      return "Password must be at least 6 characters";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: validate(name, value) });
  };

  const handleReset = async (e) => {
    e.preventDefault();

    const usernameError = validate("username", form.username);
    const passwordError = validate("newPassword", form.newPassword);

    if (usernameError || passwordError) {
      setErrors({ username: usernameError, newPassword: passwordError });
      return toast.error("Please fix the errors above");
    }

    setLoading(true);
    const toastId = toast.loading("Resetting password...");

    try {
      const response = await fetch(
        "https://to-do-app-616k.onrender.com/reset-password",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Reset failed");

      toast.success("Password reset successfully! Please login.", { id: toastId });
      setIsLogin(true); // go back to login page
    } catch (err) {
      toast.error(err.message || "Reset failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <h1 className="brand-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your username and new password</p>

        <form onSubmit={handleReset} className="auth-form">
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className={`auth-input ${errors.username ? "input-error" : ""}`}
            />
          </div>
          {errors.username && <span className="error-text">{errors.username}</span>}

          <div className="input-group password-group">
            <Lock size={18} className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="newPassword"
              placeholder="New Password"
              value={form.newPassword}
              onChange={handleChange}
              className={`auth-input ${errors.newPassword ? "input-error" : ""}`}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.newPassword && (
            <span className="error-text">{errors.newPassword}</span>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="auth-switch">
          Remembered your password?
          <span onClick={() => setIsLogin(true)}> Login</span>
        </p>
      </div>
    </div>
  );
}