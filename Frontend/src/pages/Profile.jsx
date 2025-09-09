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
                    <h2>username: {user.username}</h2>
                    <h2>email: {user.email}</h2>
                </div>
            </>
            ) : (
                <Navigate to="/" />
            )}
        </div>
        </div>
    )
}

export default Profile