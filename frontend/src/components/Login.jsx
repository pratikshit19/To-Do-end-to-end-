import { useState } from "react";
import "../Login.css";
import toast from "react-hot-toast";

export default function Login({ setIsAuthenticated, setIsLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      return toast.error("Please enter username and password");
    }

    const toastId = toast.loading("Logging in...");

    try {
      const response = await fetch(
        "https://to-do-app-616k.onrender.com/signin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("username", data.username);
      localStorage.setItem("token", data.token);

      setIsAuthenticated(true);
      toast.success("Login successful 🎉", { id: toastId });
    } catch (err) {
      toast.error(err.message || "Login failed", { id: toastId });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Left Branding Panel */}
      <div className="auth-hero">
        <h1>TaskFlow</h1>
        <p>Organize your day. Focus on what matters.</p>
      </div>

      {/* Right Login Panel */}
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue</p>

        <div className="auth-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyPress}
            className="auth-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyPress}
            className="auth-input"
          />

          <button onClick={handleLogin} className="auth-button">
            Sign In
          </button>
        </div>

        <p className="auth-switch">
          Don’t have an account?
          <span onClick={() => setIsLogin(false)}> Create Account</span>
        </p>
      </div>
    </div>
  );
}