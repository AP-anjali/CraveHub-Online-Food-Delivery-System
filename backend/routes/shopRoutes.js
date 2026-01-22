import express from "express";
import isAuth from "../middleware/isAuth.js";
import { createOrEditShop, getMyShop, getShopByCity } from "../controllers/shopController.js";
import {upload} from "../middleware/multer.js";

const shopRouter = express.Router();

shopRouter.post("/create-or-edit-shop", isAuth, upload.single("image"), createOrEditShop);
shopRouter.get("/get-my-shop", isAuth, getMyShop);
shopRouter.get("/get-shop-by-city/:city", isAuth, getShopByCity);

export default shopRouter;