import jwt from "jsonwebtoken";

const JWT_SECRET = "p123475@#@$%&!90671237ghsvqVDJ2IE08WSN";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ msg: "No auth token" });
    
    const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;
    
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export default authMiddleware;
