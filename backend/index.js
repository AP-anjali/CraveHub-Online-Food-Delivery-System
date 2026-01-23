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

const app = express();
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

app.listen(port, () => {
    connectDb();
    console.log(`backend server started on http://localhost:${port}`);
});