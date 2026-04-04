import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

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
        `${API_BASE_URL}/reset-password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Reset failed");

      toast.success(
        "Password reset successfully! Please login.",
        { id: toastId }
      );

      setIsLogin(true);
    } catch (err) {
      toast.error(err.message || "Reset failed", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
        <form onSubmit={handleReset} className="space-y-5">
          {/* Username */}
          <div>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-(--card-bg) text-(--text-primary) border border(--border)
                  focus:outline-none focus:ring-1 transition
                  ${
                    errors.username
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-(--accent)"
                  }`}
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                placeholder="New Password"
                value={form.newPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-(--card-bg) text-(--text-primary) border border(--border)
                  focus:outline-none focus:ring-1 transition
                  ${
                    errors.newPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-(--accent)"
                  }`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold
              bg-(--accent) hover:bg-(--accent)/60
              text-white transition
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* Switch */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 mb-2">
          Remembered your password?
          <span
            onClick={() => setIsLogin(true)}
            className="ml-1 text-(--accent) hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>
    </div>
  );
}