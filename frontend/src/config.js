const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:5000" 
    : "https://to-do-app-616k.onrender.com");

export default API_BASE_URL;
