import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        username: {type: String, unique: true},
        email: {type: String, required: true, unique: true},
        displayEmail: { type: String, required: true },
        password: {type: String, required: true}
    }
)

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;