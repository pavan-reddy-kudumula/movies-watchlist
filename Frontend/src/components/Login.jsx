import {useState, useContext} from "react"
import { useNavigate, Link, Navigate } from "react-router-dom";
import API from "../api"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AuthContext } from "../context/AuthContext"
import "./AuthForm.css"

function Login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { user, login } = useContext(AuthContext)
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try{
            await API.post("/auth/login", {email, password})
            await login() 
            toast.success("Login successful 🎉");
            navigate("/")
        }
        catch(err){
            console.error(err)
            const backendMsg = err.response?.data?.msg || "Login failed. Try again.";
            setError(backendMsg);
            toast.error(backendMsg);
        }
        finally{
            setLoading(false)
        }
    }

    return(
        <>
        {!user ? (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Login</h2>
                
                {error && <p className="error">{error}</p>}

                <form onSubmit={handleSubmit}>
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
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </div>

                </form>

                <p className="switch-link">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>) : (<Navigate to="/" />)}
        </>
    )
}

export default Login