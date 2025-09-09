import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const { user } = useContext(AuthContext);

  // If no user, redirect to the homepage
  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          {/* A proper title for the page */}
          <h2>Profile</h2>
        </div>

        {/* A dedicated section for the user's details */}
        <div className="profile-details">
          <div className="info-item">
            <span className="info-label">Username</span>
            <span className="info-value">{user.username}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;