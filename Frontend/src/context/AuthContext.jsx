import { createContext, useState, useEffect } from "react";
import API from "../api"

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // On app start, check for token & fetch profile
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");
      // We only need to run this if a token exists.
      // Your api.js interceptor will handle attaching it to the request.
      if (token) {
        try {
          const res = await API.get("/auth/profile");
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        } catch (err) {
          console.error("Token is invalid or expired, logging out.", err);
          // If the token is bad, clear everything
          logout();
        }
      }
    };
    verifyUser();
  }, []);

  // Sync login/logout across multiple tabs
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "user") {
        if (!event.newValue) {
          setUser(null); // Logged out in another tab
        } else {
          setUser(JSON.parse(event.newValue)); // User updated in another tab
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData); // could also call fetchProfile(token)
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}