import express from "express";
import isAuth from "../middleware/isAuth.js";
import { createOrEditShop, getMyShop } from "../controllers/shopController.js";
import {upload} from "../middleware/multer.js";

const shopRouter = express.Router();

shopRouter.post("/create-or-edit-shop", isAuth, upload.single("image"), createOrEditShop);
shopRouter.post("/get-my-shop", isAuth, getMyShop);

export default shopRouter;