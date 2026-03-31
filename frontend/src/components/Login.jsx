import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function Login({ setIsAuthenticated, setIsLogin }) {
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
    }
  }, []);

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
        "https://to-do-app-616k.onrender.com/signin",
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
      } else {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("username", data.username);
      }

      toast.success("Welcome back 🎉", { id: toastId });
      setIsAuthenticated(true);
    } catch (err) {
      toast.error(err.message || "Login failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg text-[var(--text-primary)] px-6 transition-colors duration-300">

      {/* Brand */}
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Sign in to continue
        </p>

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
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--card-bg)] border ${
                  errors.username
                    ? "border-red-500"
                    : "border-[var(--border-color)]"
                } focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition`}
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
                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-[var(--card-bg)] border ${
                  errors.password
                    ? "border-red-500"
                    : "border-[var(--border-color)]"
                } focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition`}
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
        <p className="mt-8 text-sm text-[var(--text-secondary)]">
          Don’t have an account?
          <span
            onClick={() => setIsLogin(false)}
            className="ml-1 text-[var(--accent)] cursor-pointer hover:underline"
          >
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}