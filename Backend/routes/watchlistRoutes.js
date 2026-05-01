import express from "express";
import axios from "axios";
import UserModel from "../models/User.js";
import MovieModel from "../models/Movie.js";
import authMiddleware from "./auth.js";
import { getTargetFolder } from "./folders.js";

const router = express.Router();

const API_KEY = process.env.API_KEY;
const url = `http://www.omdbapi.com/?apikey=${API_KEY}&t=`;

router.get("/api/auth/getMovie", authMiddleware, async (req, res) => {
  try {
    const response = await MovieModel.find({ userId: req.user._id });
    res.status(200).json({ movies: response });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.post("/api/auth/postMovie/:title", authMiddleware, async (req, res) => {
  try {
    const title = req.params.title;
    const year = req.query.year;
    const folder = await getTargetFolder(req.user._id, req.body?.folderId);

    if (req.body?.folderId && !folder) {
      return res.status(404).json({ msg: "Folder not found" });
    }

    let apiUrl = `${url}${encodeURIComponent(title)}`;

    if (year) {
      apiUrl += `&y=${year}`;
    }

    const response = await axios.get(apiUrl);

    if (response.data.Response === "False") {
      return res.status(404).json({ msg: "Movie not found" });
    }

    const movieTitle = response.data.Title;
    const movieDirector = response.data.Director;
    const localId = `${movieTitle.trim().toLowerCase()}#${movieDirector.trim().toLowerCase()}`;

    const likedExists = await UserModel.findOne({
      _id: req.user._id,
      "likedMovies.localId": localId
    });

    const existingMovie = await MovieModel.findOne({
      userId: req.user._id,
      title: movieTitle,
      director: movieDirector
    });

    if (existingMovie) {
      return res.status(400).json({ msg: "Movie already in your watchlist", liked: Boolean(likedExists) });
    }

    const posterImage = response.data.Poster === "N/A"
      ? "https://via.placeholder.com/300x450?text=No+Poster"
      : response.data.Poster;

    const movieData = {
      title: response.data.Title,
      director: response.data.Director,
      actors: response.data.Actors,
      plot: response.data.Plot,
      imdb: response.data.imdbRating,
      poster: posterImage,
      userId: req.user._id,
      folderId: folder?._id || null
    };

    const movie = new MovieModel(movieData);
    await movie.save();

    res.status(200).json({ msg: "Movie added successfully!", movie, liked: Boolean(likedExists) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Movie already in your watchlist" });
    }
    console.error("Error adding movie:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/api/auth/deleteMovie/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMovie = await MovieModel.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!deletedMovie) {
      return res.status(404).json({ message: "Movie not found or not authorized" });
    }

    res.status(200).json({ msg: "Movie deleted successfully!", movie: deletedMovie });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/api/auth/delete/items", authMiddleware, async (req, res) => {
  try {
    const { movieIds = [] } = req.body;

    if (movieIds.length === 0) {
      return res.status(400).json({ msg: "No IDs provided for deletion" });
    }

    const result = await MovieModel.deleteMany({
      _id: {$in: movieIds},
      userId: req.user._id
    })

    res.status(200).json({
      msg: "Deleted successfully",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
})

export default router;