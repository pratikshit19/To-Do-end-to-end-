import { useState, useEffect } from "react";
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";
import useStore from "../store/useStore";

export default function Login({ setIsAuthenticated, setIsLogin, setUserProfile, fetchUserProfile }) {
  const [form, setForm] = useState({
    identifier: "",
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

    const identifierError = validate("identifier", form.identifier);
    const passwordError = validate("password", form.password);

    if (identifierError || passwordError) {
      setErrors({ identifier: identifierError, password: passwordError });
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

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      const toastId = toast.loading("Connecting with Google...");
      try {
        // We'll fetch user info using the access token since we changed to useGoogleLogin
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await res.json();

        // Send to our backend
        const response = await fetch(`${API_BASE_URL}/google-auth-custom`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            googleId: googleUser.sub,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Google login failed");

        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userId", data.userId);

        toast.success("Welcome back 🎉", { id: toastId });
        setIsAuthenticated(true);

        const store = useStore.getState();
        store.setUserProfile({ username: data.username });
        store.fetchTodos();
        store.fetchUserProfile();
        store.fetchFocusSessions();
      } catch (err) {
        toast.error(err.message || "Google login failed", { id: toastId });
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google Login Failed"),
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Username or Email */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
              />
              <input
                type="text"
                name="identifier"
                placeholder="Username or Email"
                value={form.identifier}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-(--card-bg) border ${
                  errors.identifier
                    ? "border-red-500"
                    : "border-(--border) hover:border-(--accent)/50"
                } focus:ring-4 focus:ring-(--accent)/10 focus:border-(--accent) outline-none transition-all`}
              />
            </div>
            {errors.identifier && (
              <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase tracking-wider">
                {errors.identifier}
              </p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
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
                    : "border-(--border) hover:border-(--accent)/50"
                } focus:ring-4 focus:ring-(--accent)/10 focus:border-(--accent) outline-none transition-all`}
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
              <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase tracking-wider">
                {errors.password}
              </p>
            )}
          </motion.div>

          {/* Remember + Forgot */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between text-xs font-medium"
          >
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
          </motion.div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-linear-to-r from-(--gradient-start) to-(--gradient-end) text-white font-bold shadow-lg shadow-(--gradient-start)/25 hover:shadow-xl hover:shadow-(--gradient-start)/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Sign In"}
          </motion.button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-(--border) opacity-40"></div>
          <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Or continue with</span>
          <div className="flex-1 h-[1px] bg-(--border) opacity-40"></div>
        </div>

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          onClick={() => loginWithGoogle()}
          className="w-full py-3.5 rounded-2xl bg-(--card-bg) border border-(--border) flex items-center justify-center gap-3 font-semibold hover:bg-(--border)/30 transition-all shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </motion.button>

        {/* Switch */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-xs text-[var(--text-secondary)] text-center mb-2 font-medium"
        >
          Don’t have an account?
          <span
            onClick={() => setIsLogin(false)}
            className="ml-1 text-[var(--accent)] cursor-pointer hover:underline font-bold"
          >
            Create one
          </span>
        </motion.p>
    </motion.div>
  );
}