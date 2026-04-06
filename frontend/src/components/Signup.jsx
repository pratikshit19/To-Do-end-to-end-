import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, User as UserIcon } from "lucide-react";
import API_BASE_URL from "../config";

export default function Signup({ setIsLogin, setIsAuthenticated }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
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

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Invalid email format";
    }

    if (name === "password" && value.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (name === "confirmPassword" && value !== form.password) {
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

    const usernameError = validate("username", form.username);
    const emailError = validate("email", form.email);
    const passwordError = validate("password", form.password);
    const confirmError = validate(
      "confirmPassword",
      form.confirmPassword
    );

    if (usernameError || emailError || passwordError || confirmError) {
      setErrors({
        username: usernameError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmError,
      });

      return toast.error("Please fix the errors above");
    }

    setLoading(true);
    const toastId = toast.loading("Creating account...");

    try {
      const response = await fetch(
        `${API_BASE_URL}/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            email: form.email,
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
    if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/) && pwd.length >= 8)
      return "strong";
    return "medium";
  };

  const strength = getPasswordStrength();

  const strengthColor =
    strength === "weak"
      ? "text-red-500"
      : strength === "medium"
        ? "text-yellow-500"
        : "text-green-500";

  return (
    <div className="w-full">
      <form onSubmit={handleSignup} className="mt-8 space-y-5">

        {/* Username */}
        <div>
          <div className="relative">
            <UserIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary)"
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-(--card-bg) border border-(--border) text-(--text-primary) border transition ${errors.username
                ? "border-red-500"
                : "border-border focus:border-(--accent)"
                } focus:outline-none`}
            />
          </div>
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">
              {errors.username}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary)"
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-(--card-bg) border border-(--border) text-(--text-primary) border transition ${errors.email
                ? "border-red-500"
                : "border-border focus:border-(--accent)"
                } focus:outline-none`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary)"
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className={`w-full pl-10 pr-10 py-3 rounded-xl bg-(--card-bg) text-(--text-primary) border border-(--border) transition ${errors.password
                ? "border-red-500"
                : "border-border focus:border-(--accent)"
                } focus:outline-none`}
            />
            <button
              type="button"
              onClick={() =>
                setShowPassword((prev) => !prev)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary)"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {form.password && (
            <p className={`text-sm mt-1 ${strengthColor}`}>
              {strength === "weak" && "Weak password"}
              {strength === "medium" &&
                "Medium strength password"}
              {strength === "strong" &&
                "Strong password 💪"}
            </p>
          )}

          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary)"
            />
            <input
              type={
                showConfirmPassword ? "text" : "password"
              }
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`w-full pl-10 pr-10 py-3 rounded-xl bg-(--card-bg) border border-(--border) text-(--text-primary) border transition ${errors.confirmPassword
                ? "border-red-500"
                : "border-border focus:border-(--accent)"
                } focus:outline-none`}
            />
            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((prev) => !prev)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary)"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-(--accent) hover:bg-(--accent)/80 text-white font-semibold transition disabled:opacity-50"
        >
          {loading
            ? "Creating account..."
            : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-(--text-secondary) mt-6 mb-2">
        Already have an account?
        <span
          onClick={() => setIsLogin(true)}
          className="text-(--accent) cursor-pointer ml-1 hover:underline"
        >
          Sign In
        </span>
      </p>
    </div>
  );
}