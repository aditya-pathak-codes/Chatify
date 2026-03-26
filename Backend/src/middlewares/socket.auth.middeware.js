import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {ENV} from '../lib/env.js';

export const socketAuthMiddleware = async (socket, next) => {
    try {
        // extract the token from http-onny cookie header

        const token = socket.handshake.headers.cookie
            ?.split(';')
            .find(cookie => cookie.trim().startsWith('jwt='))
            ?.split('=')[1];

            if (!token) {
                console.log("Socket connection rejected: No token provided");
                return next(new Error("Unauthorized: No token provided"));

                //verify the token

                const decoded = jwt.verify(token, ENV.JWT_SECRET);
                if (!decoded){
                    console.log("Socket connection rejected: Invalid token");
                    return next(new Error("Unauthorized: Invalid token"));
                }

                //find the user from database

                const user = await User.findById(decoded.id).select("-password");
                if (!user) {
                    console.log("Socket connection rejected: User not found");
                    return next(new Error("Unauthorized: User not found"));
                }
            }

            //attach user info to socket

            socket.user = user;
            socket.userId = user._id.toString();
            console.log(`Socket authenticated for user: ${user.fullName} (${user._id})`);
            next();


    } catch (error) {
        console.log("Error during socket authentication:", error.message);
        next(new Error("Unauthorized: Internal service error"));
    }
}