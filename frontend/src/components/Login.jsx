import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import "../Login.css";

export default function Login({ setIsAuthenticated, setIsLogin }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- AUTO REDIRECT ---------------- */
  useEffect(() => {
    const token =
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  /* ---------------- REAL TIME VALIDATION ---------------- */
  const validate = (name, value) => {
    if (!value.trim()) {
      return `${name} is required`;
    }

    if (name === "password" && value.length < 6) {
      return "Password must be at least 6 characters";
    }

    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({ ...form, [name]: value });

    setErrors({
      ...errors,
      [name]: validate(name, value),
    });
  };

  /* ---------------- LOGIN ---------------- */
  const handleLogin = async (e) => {
  e.preventDefault();

  const usernameError = validate("username", form.username);
  const passwordError = validate("password", form.password);

  if (usernameError || passwordError) {
    setErrors({ username: usernameError, password: passwordError });
    return toast.error("Please fix the errors above");
  }

  setLoading(true);
  const toastId = toast.loading("Signing in...");

  try {
    const response = await fetch(
      "https://to-do-app-616k.onrender.com/signin",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        // credentials: "include",
      }
    );

    const data = await response.json();
    console.log("Login response:", response.status, data);

    if (!response.ok) throw new Error(data.message || "Login failed");

    if (rememberMe) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
    } else {
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("username", data.username);
    }

    toast.success("Welcome back 🎉", { id: toastId });
    setIsAuthenticated(true);
  } catch (err) {
    console.error(err);
    toast.error(err.message || "Login failed", { id: toastId });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-container">
      <div className="auth-content">
        <h1 className="brand-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue</p>

        <form onSubmit={handleLogin} className="auth-form">
          {/* Username */}
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className={`auth-input ${
                errors.username ? "input-error" : ""
              }`}
            />
          </div>
          {errors.username && (
            <span className="error-text">{errors.username}</span>
          )}

          {/* Password */}
          <div className="input-group password-group">
            <Lock size={18} className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className={`auth-input ${
                errors.password ? "input-error" : ""
              }`}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() =>
                setShowPassword((prev) => !prev)
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
          {errors.password && (
            <span className="error-text">{errors.password}</span>
          )}

          {/* REMEMBER + FORGOT */}
          <div className="auth-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() =>
                  setRememberMe(!rememberMe)
                }
              />
              Remember me
            </label>

            <button
  type="button"
  className="forgot-password"
  onClick={() => setIsLogin("forgot")}
>
  Forgot password?
</button>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          Don’t have an account?
          <span onClick={() => setIsLogin(false)}>
            {" "}
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}