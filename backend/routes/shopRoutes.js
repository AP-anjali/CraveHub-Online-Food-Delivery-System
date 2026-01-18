import express from "express";
import isAuth from "../middleware/isAuth.js";
import { createOrEditShop } from "../controllers/shopController.js";
import {upload} from "../middleware/multer.js";

const shopRouter = express.Router();

shopRouter.get("/create-or-edit-shop", isAuth, upload.single("image"), createOrEditShop);

export default shopRouter;