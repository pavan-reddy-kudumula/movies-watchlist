import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    director : {
        type : String,
        required : true
    },
    actors : {
        type : String,
        required : true
    },
    plot : {
        type : String,
        required : true
    },
    imdb : {
        type : String,
        required : true
    },
    poster : {
        type : String,
        required : true
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
    }
})

movieSchema.index({ title: 1, userId: 1, director: 1 }, { unique: true });


const MovieModel = mongoose.model('Movie', movieSchema)

export default MovieModel