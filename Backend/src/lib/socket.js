import {Server} from 'socket.io';
import http from 'http';
import express from 'express';
import {ENV} from './env.js';
import {socketAuthMiddleware} from './middleware/socketAuthMiddleware.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [ENV.CLIENT_URL],
        credetials: true,
    }
    
});

io.use(socketAuthMiddleware);  

// storing online users and their socket connections
const userSocketsMap = {};
    // userId: [socketId1, socketId2, ...]
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.user.fullName);
        
        const userId = socket.userId
        userSocketsMap[userId] = socket.id


        // broadcast online users
        io.emit('getOnlineUsers', Object.keys(userSocketsMap)); 

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.user.fullName);
            delete userSocketsMap[userId];
            io.emit('getOnlineUsers', Object.keys(userSocketsMap)); 
        });



    })


export {io, app, server};