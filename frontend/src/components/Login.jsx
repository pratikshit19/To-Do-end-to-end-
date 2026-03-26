import { useState } from "react";
import "../Login.css";
import toast from "react-hot-toast";

export default function Login({ setIsAuthenticated, setIsLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const toastId = toast.loading("Logging in...");
//https://to-do-app-616k.onrender.com/signin
    try {
      const response = await fetch("https://to-do-app-616k.onrender.com/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

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
            style={{ color: "#2daaee", cursor: "pointer" }}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
