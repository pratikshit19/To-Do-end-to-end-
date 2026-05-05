import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, User as UserIcon } from "lucide-react";
import { useGoogleLogin } from '@react-oauth/google';
import { motion } from "framer-motion";
import API_BASE_URL from "../config";
import useStore from "../store/useStore";

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

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      const toastId = toast.loading("Connecting with Google...");
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await res.json();

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

        toast.success("Account ready 🎉", { id: toastId });
        if (setIsAuthenticated) setIsAuthenticated(true);

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <form onSubmit={handleSignup} className="mt-8 space-y-5">
        {/* Username */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
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
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-(--card-bg) border text-(--text-primary) transition ${errors.username
                ? "border-red-500"
                : "border-(--border) hover:border-(--accent)/50"
                } focus:ring-4 focus:ring-(--accent)/10 focus:border-(--accent) outline-none transition-all`}
            />
          </div>
          {errors.username && (
            <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase tracking-wider">
              {errors.username}
            </p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
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
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-(--card-bg) border text-(--text-primary) transition ${errors.email
                ? "border-red-500"
                : "border-(--border) hover:border-(--accent)/50"
                } focus:ring-4 focus:ring-(--accent)/10 focus:border-(--accent) outline-none transition-all`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase tracking-wider">
              {errors.email}
            </p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
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
              className={`w-full pl-10 pr-10 py-3 rounded-xl bg-(--card-bg) text-(--text-primary) border transition ${errors.password
                ? "border-red-500"
                : "border-(--border) hover:border-(--accent)/50"
                } focus:ring-4 focus:ring-(--accent)/10 focus:border-(--accent) outline-none transition-all`}
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
            <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase tracking-wider">
              {errors.password}
            </p>
          )}
        </motion.div>

        {/* Confirm Password */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
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
              className={`w-full pl-10 pr-10 py-3 rounded-xl bg-(--card-bg) border text-(--text-primary) transition ${errors.confirmPassword
                ? "border-red-500"
                : "border-(--border) hover:border-(--accent)/50"
                } focus:ring-4 focus:ring-(--accent)/10 focus:border-(--accent) outline-none transition-all`}
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
            <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase tracking-wider">
              {errors.confirmPassword}
            </p>
          )}
        </motion.div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-linear-to-r from-(--gradient-start) to-(--gradient-end) text-white font-bold shadow-lg shadow-(--gradient-start)/25 hover:shadow-xl hover:shadow-(--gradient-start)/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : "Create Account"}
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
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </motion.button>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-(--text-secondary) mt-6 mb-2 font-medium"
      >
        Already have an account?
        <span
          onClick={() => setIsLogin(true)}
          className="text-(--accent) cursor-pointer ml-1 hover:underline font-bold"
        >
          Sign In
        </span>
      </motion.p>
    </motion.div>
  );
}