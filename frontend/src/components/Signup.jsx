import { useState } from "react";
import "../Login.css";
import toast from "react-hot-toast";

export default function Signup({ setIsLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("All fields are required");
      return;
    }

    const toastId = toast.loading("Creating account...");

    try {
      const response = await fetch(
        "https://to-do-app-616k.onrender.com/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      toast.success("Account created 🎉 Please login", { id: toastId });
      setIsLogin(true);
    } catch (err) {
      toast.error(err.message || "Signup failed", { id: toastId });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSignup();
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Left Branding Panel */}
      <div className="auth-hero">
        <h1>TaskFlow</h1>
        <p>Start organizing your productivity today.</p>
      </div>

      {/* Right Signup Panel */}
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Sign up to get started</p>

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

          <button onClick={handleSignup} className="auth-button">
            Create Account
          </button>
        </div>

        <p className="auth-switch">
          Already have an account?
          <span onClick={() => setIsLogin(true)}> Sign In</span>
        </p>
      </div>
    </div>
  );
}