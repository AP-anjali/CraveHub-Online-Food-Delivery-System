import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/db.js';
dotenv.config();
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import shopRouter from "./routes/shopRoutes.js";
import itemRouter from "./routes/itemRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import cors from "cors";

import http from "http";
import { Server } from 'socket.io';
import { socketHandler } from './socket.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {     // creating socket io bidirectional server
    cors : {
        origin:"http://localhost:5173",
        credentials:true,
        methods : ['POST', 'GET']
    }
});

app.set("io", io);

const port = process.env.PORT || 5000;

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // to parse token in cookie

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

socketHandler(io);

server.listen(port, () => {
    connectDb();
    console.log(`backend server started on http://localhost:${port}`);
});