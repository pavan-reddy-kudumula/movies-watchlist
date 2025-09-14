import { createContext, useState, useEffect, useCallback } from "react";
import {jwtDecode} from "jwt-decode";
import API from "../api";

export const AuthContext = createContext();

let logoutTimer;

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const login = (token, userData) => {
    const decodedToken = jwtDecode(token);
    const expiryTime = decodedToken.exp * 1000; // Get expiry in milliseconds
    const remainingTime = expiryTime - Date.now();

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("tokenExpiry", expiryTime);

    setUser(userData); // could also call fetchProfile(token)

    logoutTimer = setTimeout(logout, remainingTime);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    
    if(logoutTimer){
      clearTimeout(logoutTimer);
    }
    setUser(null);
  }, []);
  
  // On app start, check for token & fetch profile
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");
      const tokenExpiry = localStorage.getItem("tokenExpiry");

      if (!token || !tokenExpiry) {
        return; // No token, nothing to do
      }
      
      // First, check if token is expired locally
      const remainingTime = tokenExpiry - Date.now();
      if (remainingTime <= 1000) {
        logout();
        return;
      }

      try {
          const res = await API.get("/auth/profile");
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
          logoutTimer = setTimeout(logout, remainingTime);
        } catch (err) {
          console.error("Token is invalid or expired, logging out.", err);
          logout();
        }
    };
    verifyUser();
  }, [logout]);

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


  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}