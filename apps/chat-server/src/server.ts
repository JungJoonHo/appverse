import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

interface Message {
    id: string;
    text: string;
}

io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("sendMessage", (message: Message) => {
        io.emit("receiveMessage", message);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(3000, () => console.log("Server running on port 3000"));
