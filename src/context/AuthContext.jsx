import { createContext, useEffect, useState } from "react";
import axiosInstance from "../api/axios";

export const AuthContext = createContext();

function AuthProvider({ children }) {
  // Initialize user from localStorage so it's never null on first render
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Keep localStorage in sync whenever user changes
  const setUserAndCache = (userData) => {
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
    setUser(userData);
  };

  const getProfile = async () => {
    try {
      const response = await axiosInstance.get("/profile");
      setUserAndCache(response.data.data);
    } catch (error) {
      console.log("PROFILE ERROR:", error?.response?.status);
      // Only clear user on auth errors (401/403), not network errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        localStorage.removeItem("token");
        setUserAndCache(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getProfile();
    } else {
      setUserAndCache(null);
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser: setUserAndCache, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
