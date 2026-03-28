import { useState, useEffect } from "react";
import "../Login.css";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Signup({ setIsLogin, setIsAuthenticated }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- AUTO REDIRECT IF LOGGED IN ---------------- */
  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (token && setIsAuthenticated) {
      setIsAuthenticated(true);
    }
  }, []);

  /* ---------------- VALIDATION ---------------- */
  const validate = (name, value) => {
    if (!value.trim()) return `${name} is required`;

    if (name === "password") {
      if (value.length < 6)
        return "Password must be at least 6 characters";
    }

    if (name === "confirmPassword") {
      if (value !== form.password)
        return "Passwords do not match";
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

  /* ---------------- SIGNUP ---------------- */
  const handleSignup = async (e) => {
    e.preventDefault();

    const usernameError = validate(
      "username",
      form.username
    );
    const passwordError = validate(
      "password",
      form.password
    );
    const confirmError = validate(
      "confirmPassword",
      form.confirmPassword
    );

    if (usernameError || passwordError || confirmError) {
      setErrors({
        username: usernameError,
        password: passwordError,
        confirmPassword: confirmError,
      });

      return toast.error("Please fix the errors above");
    }

    setLoading(true);
    const toastId = toast.loading("Creating account...");

    try {
      const response = await fetch(
        "https://to-do-app-616k.onrender.com/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      toast.success(
        "Account created 🎉 Redirecting to login...",
        { id: toastId }
      );

      setTimeout(() => {
        setIsLogin(true);
      }, 1000);
    } catch (err) {
      toast.error(err.message || "Signup failed", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- PASSWORD STRENGTH ---------------- */
  const getPasswordStrength = () => {
    const pwd = form.password;
    if (pwd.length < 6) return "weak";
    if (
      pwd.match(/[A-Z]/) &&
      pwd.match(/[0-9]/) &&
      pwd.length >= 8
    )
      return "strong";
    return "medium";
  };

  const strength = getPasswordStrength();

  return (
    <div className="auth-container">
      <div className="auth-content">
        <h1 className="brand-title">Create Account</h1>
        <p className="auth-subtitle">
          Start organizing your productivity
        </p>

        <form onSubmit={handleSignup} className="auth-form">
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
            <span className="error-text">
              {errors.username}
            </span>
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

          {form.password && (
            <div className={`password-strength ${strength}`}>
              {strength === "weak" && "Weak password"}
              {strength === "medium" &&
                "Medium strength password"}
              {strength === "strong" &&
                "Strong password 💪"}
            </div>
          )}

          {errors.password && (
            <span className="error-text">
              {errors.password}
            </span>
          )}

          {/* Confirm Password */}
          <div className="input-group password-group">
            <Lock size={18} className="input-icon" />
            <input
              type={
                showConfirmPassword ? "text" : "password"
              }
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`auth-input ${
                errors.confirmPassword
                  ? "input-error"
                  : ""
              }`}
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() =>
                setShowConfirmPassword((prev) => !prev)
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {errors.confirmPassword && (
            <span className="error-text">
              {errors.confirmPassword}
            </span>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?
          <span onClick={() => setIsLogin(true)}>
            {" "}
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}