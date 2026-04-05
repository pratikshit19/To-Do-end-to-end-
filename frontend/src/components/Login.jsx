import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";
import useStore from "../store/useStore";

export default function Login({ setIsAuthenticated, setIsLogin, setUserProfile, fetchUserProfile }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= AUTO REDIRECT ================= */
  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      useStore.getState().fetchTodos();
      useStore.getState().fetchUserProfile();
      useStore.getState().fetchFocusSessions();
    }
  }, [setIsAuthenticated]);

  /* ================= VALIDATION ================= */
  const validate = (name, value) => {
    if (!value.trim()) return `${name} is required`;
    if (name === "password" && value.length < 6)
      return "Password must be at least 6 characters";
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

  /* ================= LOGIN ================= */
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
        `${API_BASE_URL}/signin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Login failed");

      if (rememberMe) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userId", data.userId);
      } else {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("userId", data.userId);
      }

      toast.success("Welcome back 🎉", { id: toastId });
      setIsAuthenticated(true);
      
      const store = useStore.getState();
      store.setUserProfile({ username: data.username });
      store.fetchTodos();
      store.fetchUserProfile();
      store.fetchFocusSessions();
    } catch (err) {
      toast.error(err.message || "Login failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Username */}
          <div>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-(--card-bg) border ${
                  errors.username
                    ? "border-red-500"
                    : "border-(--border)"
                } focus:outline-none transition`}
              />
            </div>
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">
                {errors.username}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-(--card-bg) border ${
                  errors.password
                    ? "border-red-500"
                    : "border-(--border)"
                } focus:outline-none transition`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() =>
                  setRememberMe(!rememberMe)
                }
                className="accent-[var(--accent)]"
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => setIsLogin("forgot")}
              className="text-[var(--accent)] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Switch */}
        <p className="mt-8 text-sm text-[var(--text-secondary)] text-center mb-2">
          Don’t have an account?
          <span
            onClick={() => setIsLogin(false)}
            className="ml-1 text-[var(--accent)] cursor-pointer hover:underline"
          >
            Create one
          </span>
        </p>
    </div>
  );
}