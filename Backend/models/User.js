import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        username: {type: String, unique: true},
        email: {type: String, required: true, unique: true},
        displayEmail: { type: String, required: true },
        password: {type: String, required: true},

        likedMovies: [
            {
                localId: { type: String, required: true },
                title: { type: String, required: true },
                poster: { type: String, required: true },
                review: { type: String, default: "" }
            }
        ]
    })

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;