import { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile";
import AddMovies from "./pages/AddMovies"
import Watchlist from "./pages/Watchlist"
import HomePage from "./pages/Homepage"
import Recommendations from "./pages/Recommendations"
import LikedMovies from "./pages/LikedMovies";
import {AuthContext} from "./context/AuthContext"
import { ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";


function App() {
  const {user, loading} = useContext(AuthContext)
  
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Navbar />
      
      <ToastContainer position="top-right" theme="colored" autoClose={2000} />

      <Routes>
        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/" />}
        />
        
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />

        {/* Public Home */}
        <Route path="/" element={<HomePage />} />

        {/* Protected Pages */}
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />

        <Route
          path="/addmovies"
          element={user ? <AddMovies /> : <Navigate to="/login" />}
        />

        <Route
          path="/watchlist"
          element={user ? <Watchlist /> : <Navigate to="/login" />}
        />

        <Route
          path="/recommendations"
          element={user ? <Recommendations /> : <Navigate to="/login" />}
        />

        <Route
          path="/favorites"
          element={user ? <LikedMovies /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;