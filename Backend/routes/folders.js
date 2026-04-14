import express from "express";
import UserModel from "../models/User.js";
import MovieModel from "../models/Movie.js";
import FolderModel from "../models/Folder.js";
import authMiddleware from "./auth.js";

const router = express.Router();

const DEFAULT_FOLDER_NAME = "General";

const normalizeFolderName = (name) => name.trim().toLowerCase();

const ensureGeneralFolder = async (userId) => {
  const existingFolder = await FolderModel.findOne({
    userId,
    normalizedName: normalizeFolderName(DEFAULT_FOLDER_NAME)
  });

  if (existingFolder) {
    return existingFolder;
  }

  return FolderModel.create({
    userId,
    name: DEFAULT_FOLDER_NAME,
    normalizedName: normalizeFolderName(DEFAULT_FOLDER_NAME)
  });
};

const getTargetFolder = async (userId, folderId) => {
  if (folderId) {
    const folder = await FolderModel.findOne({ _id: folderId, userId });
    if (!folder) {
      return null;
    }
    return folder;
  }

  return ensureGeneralFolder(userId);
};

const mapFolderResponse = (folder) => ({
  id: folder._id,
  name: folder.name,
  normalizedName: folder.normalizedName,
  isDefault: folder.normalizedName === normalizeFolderName(DEFAULT_FOLDER_NAME)
});

router.get("/api/auth/folders", authMiddleware, async (req, res) => {
  try {
    await ensureGeneralFolder(req.user._id);
    const folders = await FolderModel.find({ userId: req.user._id }).sort({ name: 1 });
    res.json({ folders: folders.map(mapFolderResponse) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/api/auth/folders", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const trimmedName = name.trim();
    const normalizedName = normalizeFolderName(trimmedName);

    const existingFolder = await FolderModel.findOne({ userId: req.user._id, normalizedName });
    if (existingFolder) {
      return res.status(400).json({ message: "Folder already exists" });
    }

    const folder = await FolderModel.create({
      userId: req.user._id,
      name: trimmedName,
      normalizedName
    });

    res.status(201).json({ folder: mapFolderResponse(folder) });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Folder already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/api/auth/folders/:folderId", authMiddleware, async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const folder = await FolderModel.findOne({ _id: folderId, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (folder.normalizedName === normalizeFolderName(DEFAULT_FOLDER_NAME)) {
      return res.status(400).json({ message: "Default folder cannot be renamed" });
    }

    const trimmedName = name.trim();
    const normalizedName = normalizeFolderName(trimmedName);

    const duplicateFolder = await FolderModel.findOne({
      userId: req.user._id,
      normalizedName,
      _id: { $ne: folderId }
    });

    if (duplicateFolder) {
      return res.status(400).json({ message: "Folder already exists" });
    }

    folder.name = trimmedName;
    folder.normalizedName = normalizedName;
    await folder.save();

    res.json({ folder: mapFolderResponse(folder) });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Folder already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/api/auth/folders/:folderId", authMiddleware, async (req, res) => {
  try {
    const { folderId } = req.params;
    const deleteItemsRaw = req.query.deleteItems;
    const shouldDeleteItems = deleteItemsRaw === true || deleteItemsRaw === "true";

    const folder = await FolderModel.findOne({ _id: folderId, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (folder.normalizedName === normalizeFolderName(DEFAULT_FOLDER_NAME)) {
      return res.status(400).json({ message: "Default folder cannot be deleted" });
    }

    if (shouldDeleteItems) {
      const deletedMoviesResult = await MovieModel.deleteMany({ userId: req.user._id, folderId: folder._id });

      const likedUser = await UserModel.findById(req.user._id).select("likedMovies");
      const deletedLikedCount = (likedUser?.likedMovies || []).filter(
        (item) => item.folderId && item.folderId.toString() === folder._id.toString()
      ).length;

      await UserModel.updateOne(
        { _id: req.user._id },
        { $pull: { likedMovies: { folderId: folder._id } } }
      );

      await FolderModel.deleteOne({ _id: folder._id, userId: req.user._id });

      return res.json({
        message: "Folder and its items deleted",
        deleteItems: true,
        deletedMovies: deletedMoviesResult.deletedCount || 0,
        deletedLikedMovies: deletedLikedCount
      });
    }

    await MovieModel.updateMany(
      { userId: req.user._id, folderId: folder._id },
      { $set: { folderId: null } }
    );

    await UserModel.updateOne(
      { _id: req.user._id },
      { $set: { "likedMovies.$[item].folderId": null } },
      { arrayFilters: [{ "item.folderId": folder._id }] }
    );

    await FolderModel.deleteOne({ _id: folder._id, userId: req.user._id });

    res.json({ message: "Folder deleted", deleteItems: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/auth/folders/:folderId/items", authMiddleware, async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await FolderModel.findOne({ _id: folderId, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const movies = await MovieModel.find({ userId: req.user._id, folderId: folder._id });
    const likedUser = await UserModel.findById(req.user._id).select("likedMovies");
    const likedMovies = (likedUser?.likedMovies || []).filter(
      (item) => item.folderId && item.folderId.toString() === folder._id.toString()
    );

    res.json({ folder: mapFolderResponse(folder), movies, likedMovies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/api/auth/folders/:folderId/items", authMiddleware, async (req, res) => {
  try {
    const { folderId } = req.params;
    const { movieIds = [], likedLocalIds = [] } = req.body;

    const folder = await FolderModel.findOne({ _id: folderId, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const updatedMovies = movieIds.length
      ? await MovieModel.updateMany(
          { _id: { $in: movieIds }, userId: req.user._id },
          { $set: { folderId: folder._id } }
        )
      : null;

    const updatedLiked = likedLocalIds.length
      ? await UserModel.updateMany(
          { _id: req.user._id, "likedMovies.localId": { $in: likedLocalIds } },
          { $set: { "likedMovies.$[item].folderId": folder._id } },
          { arrayFilters: [{ "item.localId": { $in: likedLocalIds } }] }
        )
      : null;

    res.json({
      message: "Items added to folder",
      folder: mapFolderResponse(folder),
      moviesUpdated: updatedMovies?.modifiedCount || 0,
      likedUpdated: updatedLiked?.modifiedCount || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/api/auth/folders/:folderId/items", authMiddleware, async (req, res) => {
  try {
    const { folderId } = req.params;
    const { movieIds = [], likedLocalIds = [] } = req.body;

    const folder = await FolderModel.findOne({ _id: folderId, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const updatedMovies = movieIds.length
      ? await MovieModel.updateMany(
          { _id: { $in: movieIds }, userId: req.user._id, folderId: folder._id },
          { $set: { folderId: null } }
        )
      : null;

    const updatedLiked = likedLocalIds.length
      ? await UserModel.updateMany(
          { _id: req.user._id, "likedMovies.localId": { $in: likedLocalIds } },
          { $set: { "likedMovies.$[item].folderId": null } },
          { arrayFilters: [{ "item.localId": { $in: likedLocalIds }, "item.folderId": folder._id }] }
        )
      : null;

    res.json({
      message: "Items removed from folder",
      folder: mapFolderResponse(folder),
      moviesUpdated: updatedMovies?.modifiedCount || 0,
      likedUpdated: updatedLiked?.modifiedCount || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export { ensureGeneralFolder, getTargetFolder };
export default router;