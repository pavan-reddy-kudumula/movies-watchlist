import {useState, useContext} from "react"
import API from "../api"
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {useNavigate, Link, Navigate} from "react-router-dom"
import {AuthContext} from "../context/AuthContext"
import "./AuthForm.css"

function Signup(){
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");  
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);  
    const {user} = useContext(AuthContext)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("");
        setLoading(true);
        try{
            await API.post("/auth/signup", {username,email,password})
            toast.success("Signup successful! 🎉 Please log in.");
            navigate("/login")
        }
        catch(err){
            console.log(err)
            setUsername("")
            setEmail("")
            setPassword("")
            const backendMsg = err.response?.data?.msg || "Signup failed. Try again.";
            setError(backendMsg);
            toast.error(backendMsg);
        } 
        finally {
            setLoading(false);
        }
    }

    return(
        <>{!user ? (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Sign up</h2>

                {error && <p className="error">{error}</p>}

                <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input className="input" type="text" name="username" value={username} placeholder=" " onChange={(e) => setUsername(e.target.value)} required/>
                    <label className="label">Username</label>
                </div>

                <div className="input-group">
                    <input className="input" type="email" name="email" value={email} placeholder=" " onChange={(e) => setEmail(e.target.value)} required/>
                    <label className="label">Email</label>
                </div>

                <div className="input-group">
                    <input className="input" type="password" name="password" value={password} placeholder=" " onChange={(e) => setPassword(e.target.value)} required/>
                    <label className="label">Password</label>
                </div>

                <div className="actions">
                    <button className="auth-btn" type="submit" disabled={loading}>
                        {loading ? "Signing up..." : "Signup"}
                    </button>
                </div>
                
                </form>
                <p className="switch-link">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>

            <ToastContainer position="top-right" theme="colored" autoClose={2000} />
        </div>) : (<Navigate to="/" />)}</>
    )
}

export default Signup