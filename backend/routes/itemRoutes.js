import express from "express";
import isAuth from "../middleware/isAuth.js";
import { addItem, deleteItem, editItem, getItemById } from "../controllers/itemController.js";
import {upload} from "../middleware/multer.js";

const itemRouter = express.Router();

itemRouter.post("/add-item", isAuth, upload.single("image"), addItem);
itemRouter.post("/edit-item/:itemId", isAuth, upload.single("image"), editItem);
itemRouter.get("/get-item-by-id/:itemId", isAuth, getItemById);
itemRouter.get("/delete-item/:itemId", isAuth, deleteItem);

export default itemRouter;