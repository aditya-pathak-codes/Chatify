import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {
    const { JWT_SECRET } = process.env;

    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured in environment variables");
    }

    const token = jwt.sign(
        { id: userId }, JWT_SECRET,
        { expiresIn: '7d' }
    );


    res.cookie("token", token, {
        httpOnly: true,      //XSS protection
        sameSite: "strict",  // CSRF protection
        secure: process.env.NODE_ENV === "development" ? false : true, // only send cookie over HTTPS in production
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
         
    });

    return token;
}

