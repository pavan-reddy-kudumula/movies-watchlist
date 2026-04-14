import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        normalizedName: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        }
    }
);

FolderSchema.index({ userId: 1, normalizedName: 1 }, { unique: true });

const FolderModel = mongoose.model("Folder", FolderSchema);

export default FolderModel;