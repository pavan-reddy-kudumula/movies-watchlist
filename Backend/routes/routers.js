import express from "express"
const router = express.Router()
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import UserModel from "../models/User.js"
import MovieModel from "../models/Movie.js"
import authMiddleware from "./auth.js"
import axios from "axios"
import dotenv from "dotenv"
dotenv.config()

const JWT_SECRET = "p123475@#@$%&!90671237ghsvqVDJ2IE08WSN"
const API_KEY = process.env.API_KEY;
const url = `http://www.omdbapi.com/?apikey=${API_KEY}&t=`;

router.post('/api/auth/signup', async (req, res)=>{
    try{
        const {username, email, password} = req.body
    
        const normalizedEmail = email.trim().toLowerCase();
        const existingEmail = await UserModel.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({ msg: "Email already in use" });
        }

        const existingUsername = await UserModel.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ msg: "Username already taken" });
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
    
        const newUser = new UserModel({username, email: normalizedEmail, displayEmail: email.trim(), password: hashedPassword})
        await newUser.save()
        res.json({msg: "User created successfully"})
    }
    catch(err){
        console.error(err)
        if (err.code === 11000) {
            console.log("keypattern :", err.keyPattern)
            if (err.keyPattern?.email) {
                return res.status(400).json({ msg: "Email already in use" })
            }
            if (err.keyPattern?.username) {
                return res.status(400).json({ msg: "Username already taken" })
            }
            return res.status(400).json({ msg: "Duplicate field value" })
        }
        res.status(500).json({msg: "Server error"})
    }
})

router.post("/api/auth/login", async (req, res)=>{
    try
    {
        const {email, password} = req.body

        const normalizedEmail = email.trim().toLowerCase();
        const user = await UserModel.findOne({email: normalizedEmail})
        if(!user) return res.status(400).json({msg: "No account found with this email"})

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) return res.status(400).json({msg: "Invalid password"})

        const token = jwt.sign({id: user._id, username: user.username, email: user.email}, JWT_SECRET, {expiresIn: "1h"})
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.displayEmail,
            }
        });
    }
    catch(err){
        res.status(500).json({msg: "Server error"})
    }    
})

router.get("/api/auth/profile", authMiddleware, async (req, res)=>{
    try {
        const user = await UserModel.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        res.json({ username: user.username, email: user.email });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
})

router.get('/api/auth/getMovie', authMiddleware, async (req, res) => {
  try {
    const response = await MovieModel.find({ userId: req.user.id });
    res.status(200).json({ movies: response });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.post('/api/auth/postMovie/:title', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(url + `${req.params.title}`)
    if (response.data.Response === "False") {
      return res.status(404).json({ msg: "Movie not found" });
    }

    const movieData = {
      title: response.data.Title,
      director: response.data.Director,
      actors: response.data.Actors,
      plot: response.data.Plot,
      imdb: response.data.imdbRating,
      poster: response.data.Poster,
      userId: req.user.id
    };

    const movie = new MovieModel(movieData);
    await movie.save();
    res.status(200).json({ msg: 'Movie added successfully!', movie });
  } 
  catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Movie already in your watchlist" });
    }
    console.error("Error adding movie:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete('/api/auth/deleteMovie/:id', authMiddleware, async (req, res) => {
  try {
    const movie = await MovieModel.findById(req.params.id);
    if (!movie || movie.userId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not allowed" });

    const response = await MovieModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: 'Movie deleted successfully!', movie: response });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

export default router