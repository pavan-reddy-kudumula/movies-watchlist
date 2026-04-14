import express from "express";
import UserModel from "../models/User.js";
import MovieModel from "../models/Movie.js";
import authMiddleware from "./auth.js";
import { getTargetFolder } from "./folders.js";

const router = express.Router();

router.get("/api/auth/liked", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select("likedMovies");
    res.json(user.likedMovies || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/api/auth/like/:movieId", authMiddleware, async (req, res) => {
  try {
    const { movieId } = req.params;
    const folder = await getTargetFolder(req.user._id, req.body?.folderId);

    if (req.body?.folderId && !folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const movie = await MovieModel.findOne({
      _id: movieId,
      userId: req.user._id
    });

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const movieTitle = movie.title;
    const movieDirector = movie.director;
    const localId = `${movieTitle.trim().toLowerCase()}#${movieDirector.trim().toLowerCase()}`;

    const alreadyLiked = await UserModel.exists({
      _id: req.user._id,
      "likedMovies.localId": localId
    });

    if (alreadyLiked) {
      return res.status(400).json({ message: "Movie already liked" });
    }

    await UserModel.findByIdAndUpdate(req.user._id, {
      $push: {
        likedMovies: {
          localId,
          title: movie.title,
          poster: movie.poster,
          review: "",
          folderId: folder?._id || null
        }
      }
    });

    res.json({ message: "Movie liked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/api/auth/like/:localId/review", authMiddleware, async (req, res) => {
  try {
    const { localId } = req.params;
    const { review } = req.body;

    const result = await UserModel.updateOne(
      { _id: req.user._id, "likedMovies.localId": localId },
      { $set: { "likedMovies.$.review": review } }
    );

    if (result.matchedCount === 0) {
      return res.status(400).json({ message: "Cannot update review. Movie not liked." });
    }

    res.json({ message: "Review updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/api/auth/like/:localId", authMiddleware, async (req, res) => {
  try {
    const { localId } = req.params;

    const result = await UserModel.updateOne(
      { _id: req.user._id },
      {
        $pull: {
          likedMovies: { localId }
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: "Movie is not liked" });
    }

    res.json({ message: "Movie unliked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;