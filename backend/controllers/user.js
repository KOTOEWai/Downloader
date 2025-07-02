import User from '../models/User.js'
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';




export async function login (req,res){
 const { email, password } = req.body;

    // input validation
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please enter all fields.' });
    }

    try {
        // Email နဲ့ User ကို ရှာပါ
        const user = await User.findOne({ email });

        const valid = await bcrypt.compare(req.body.password,user.password);
        // User မရှိရင် ဒါမှမဟုတ် password မမှန်ရင်
        if (!user || !valid ) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
          const token = jwt.sign({ id: user._id },process.env.JWT_SECRET, { expiresIn: "2d" });
        // Login အောင်မြင်ရင် Token ထုတ်ပေးပါ
        res.json({
            success: true,
            message: 'Logged in successfully!',
            user: {
                id: user._id,
                email: user.email,
            },
            token: token, 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }

}



export async function register (req,res){
    const { username,email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // input validation
    if (!email || !password || !username) {
        return res.status(400).json({ success: false, message: 'Please enter all fields.' });
    }

    try {
        // User ရှိပြီးသားလား စစ်ဆေးခြင်း
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with this email already exists.' });
        }

        // User အသစ်ဖန်တီးခြင်း (password က save hook မှာ auto hash ဖြစ်မှာပါ)
        const user = await User.create({
            username,
            email,
            password:hashedPassword,
        });

        if (user) {
            res.status(201).json({
                success: true,
                message: 'User registered successfully!',
                user: {
                    id: user._id,
                    email: user.email,
                },
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data.' });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
}