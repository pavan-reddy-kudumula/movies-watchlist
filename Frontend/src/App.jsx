import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import PrivateRoute from "./components/PrivateRoute"
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile";
import AddMovies from "./pages/AddMovies"
import Watchlist from "./pages/Watchlist"
import Recommendations from "./pages/Recommendations"

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>} 
        />
        <Route path="/addmovies" element={
          <PrivateRoute>
            <AddMovies />
          </PrivateRoute>} 
        />
        <Route path="/watchlist" element={
          <PrivateRoute>
            <Watchlist />
          </PrivateRoute>} 
        />
        <Route path="/recommendations" element={
          <PrivateRoute>
            <Recommendations />
          </PrivateRoute>} 
        />
      </Routes>
    </Router>
  );
}

export default App;