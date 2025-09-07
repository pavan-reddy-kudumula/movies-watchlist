// src/context/ThemeContext.jsx

import { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // This effect applies the theme on initial load and when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // This effect syncs tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'darkMode') {
        const isNewDark = event.newValue === 'true';

        document.documentElement.classList.add('no-transition');
        // ✅ FIX: Apply the theme change to the DOM immediately
        if (isNewDark) {
          document.documentElement.classList.add('dark-mode');
        } else {
          document.documentElement.classList.remove('dark-mode');
        }
        
        // Then, update React's state to keep it in sync
        setDarkMode(isNewDark);

        setTimeout(() => {
          document.documentElement.classList.remove('no-transition');
        }, 2000);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);