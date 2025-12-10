import { createContext, useState, useEffect, useCallback } from "react";
import API from "../api";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [likedMovies, setLikedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      const [profileRes, likedRes] = await Promise.all([
        API.get("/auth/profile"),
        API.get("/auth/liked")
      ]);

      setUser(profileRes.data);
      setLikedMovies(likedRes.data);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setUser(null);
      setLikedMovies([]);
    }
  }, []);

  const login = async () => {
     await fetchUserData();
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout"); 
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      setLikedMovies([]);
      sessionStorage.clear();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await fetchUserData();
      } catch {
        setUser(null);
        setLikedMovies([]);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, likedMovies, setLikedMovies }}>
      {children}
    </AuthContext.Provider>
  );
}