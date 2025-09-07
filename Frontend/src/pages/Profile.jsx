import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import { Navigate } from "react-router-dom";
import "./Profile.css"

function Profile() {
    const {user} = useContext(AuthContext)

    return(
        <div className="container">
        <div className="card">
            {user ? (
            <>
                <div className="profile-header">
                    <h2>Welcome, {user.username}</h2>
                </div>
                <p className="kicker">{user.email}</p>
            </>
            ) : (
                <Navigate to="/login" />
            )}
        </div>
        </div>
    )
}

export default Profile