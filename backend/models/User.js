// backend/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, match: [/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email'] },
    password: { type: String, required: true, minlength: [8, 'Password must be at least 8 characters'] }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
