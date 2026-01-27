import express from "express";
import isAuth from "../middleware/isAuth.js";
import { addItem, deleteItem, editItem, getFoodItemsByCity, getItemById } from "../controllers/itemController.js";
import {upload} from "../middleware/multer.js";
import { getItemsByShop } from "../controllers/orderController.js";

const itemRouter = express.Router();

itemRouter.post("/add-item", isAuth, upload.single("image"), addItem);
itemRouter.post("/edit-item/:itemId", isAuth, upload.single("image"), editItem);
itemRouter.get("/get-item-by-id/:itemId", isAuth, getItemById);
itemRouter.get("/delete-item/:itemId", isAuth, deleteItem);
itemRouter.get("/get-food-items-by-city/:city", isAuth, getFoodItemsByCity);
itemRouter.get("/get-items-by-shop/:shopId", isAuth, getItemsByShop);

export default itemRouter;