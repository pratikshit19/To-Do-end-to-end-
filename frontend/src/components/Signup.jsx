import { useState } from "react";
import "../Login.css"; // reuse same styling

export default function Signup({ setIsLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (!username.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    try {
      const response = await fetch("https://to-do-app-616k.onrender.com/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      alert("Signup successful! Please login.");
      setIsLogin(true);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Create Account</h1>
        <p className="login-subtitle">Sign up to manage your tasks</p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="login-input"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />

        <button onClick={handleSignup} className="login-button">
          Sign Up
        </button>

        {error && <p style={{ color: "#ef4444" }}>{error}</p>}

        <p style={{ fontSize: "0.85rem", marginTop: "1rem", color:"#94a3b8" }}>
          Already have an account?{" "}
          <span
            style={{ color: "#3b82f6", cursor: "pointer" }}
            onClick={() => setIsLogin(true)}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
