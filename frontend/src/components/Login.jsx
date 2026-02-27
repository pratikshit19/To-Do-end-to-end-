import { useState } from "react";
import "../Login.css";

export default function Login({ setIsAuthenticated , setIsLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const response = await fetch("https://to-do-app-616k.onrender.com/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      setIsAuthenticated(true);
    } else {
      alert(data.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Login to manage your tasks</p>

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

        <button onClick={handleLogin} className="login-button">
          Login
        </button>
        <p style={{ fontSize: "0.85rem", marginTop: "1rem", color:"#94a3b8" }}>
  Don’t have an account?{" "}
  <span
    style={{ color: "#3b82f6", cursor: "pointer" }}
    onClick={() => setIsLogin(false)}
  >
    Sign Up
  </span>
</p>
      </div>
    </div>
  );
}
