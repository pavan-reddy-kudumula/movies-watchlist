import jwt from "jsonwebtoken"
import UserModel from "../models/User.js"

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.jwt
        if(!token) {
            return res.status(401).json({message: "Unauthorized - No token provided"})
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if(!decoded) {
           return res.status(401).json({message: "Unauthorized - Invalid token"})
        }
        
        const user = await UserModel.findById(decoded.userId).select("-password")
        if(!user) {
            return res.status(404).json({message: "User not found"})
        }

        req.user = user
        next()
    } catch(error) {
        console.log("error in authMiddleware:", error.message)
        res.status(500).json({message: "Internal server error"})
    }
}

export default authMiddleware;