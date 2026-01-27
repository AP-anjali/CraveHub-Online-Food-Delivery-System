import uploadOnCloudynary from "../utils/cloudinary.js";
import Shop from "../models/Shop.js";
import Item from "../models/Item.js";

export const addItem = async (req, res) => {
    try
    {
        const {name, category, foodType, price} = req.body;

        let image;
        
        if(req.file)
        {
            image = await uploadOnCloudynary(req.file.path);    // uploading on cloudynary and getting the url
        }

        const shop = await Shop.findOne({owner : req.userId});

        if(!shop)
        {
            return res.status(400).json({message : "shop not found !"});
        }

        const item = await Item.create({
            name, category, foodType, price, image, shop : shop._id
        });

        shop.items.push(item._id);
        await shop.save();
        await shop.populate("owner");
        await shop.populate({
            path : "items",
            options : {sort : {updatedAt : -1}}
        });

        return res.status(201).json(shop);
    }
    catch(error)
    {   
        return res.status(500).json({message : `adding item error : ${error}`});
    }
};

export const editItem = async (req, res) => {
    try
    {
        const itemId = req.params.itemId;

        const {name, category, foodType, price} = req.body;

        let image;
        
        if(req.file)
        {
            image = await uploadOnCloudynary(req.file.path);    // uploading on cloudynary and getting the url
        }

        const item = await Item.findByIdAndUpdate(itemId, {
            name, category, foodType, price, image
        }, {new : true});

        if(!item)
        {
            return res.status(400).json({message : "item not found !"});
        }

        const shop = await Shop.findOne({owner : req.userId}).populate({
            path : "items",
            options : {sort : {updatedAt : -1}}
        });
        return res.status(200).json(shop);
    }
    catch(error)
    {
        return res.status(500).json({message : `editing item error : ${error}`});
    }
};

export const getItemById = async (req, res) => {
    try
    {
        const itemId = req.params.itemId;

        const item = await Item.findById(itemId);

        if(!item)
        {
            return res.status(400).json({message : "item not found !"});
        }

        return res.status(200).json(item);
    }
    catch(error)
    {
        return res.status(500).json({message : `get item by id error : ${error}`});
    }
};

export const deleteItem = async (req, res) => {
    console.log("hi");
    try
    {
        const itemId = req.params.itemId;

        const item = await Item.findById(itemId);

        if(!item)
        {
            return res.status(400).json({message : "item not found !"});
        }

        await Item.findByIdAndDelete(itemId);

        const shop = await Shop.findOne({owner : req.userId});
        if (!shop) {
            return res.status(400).json({ message: "shop not found !" });
        }

        shop.items = shop.items.filter(
            (i) => i.toString() !== itemId
        );

        await shop.save();

        await shop.populate({
            path : "items",
            options : {sort : {updatedAt : -1}}
        });

        return res.status(200).json(shop);
    }
    catch(error)
    {
        return res.status(500).json({message : `delete item error : ${error}`});
      
    }
};

export const getFoodItemsByCity = async (req, res) => {
    try
    {
        const city = req.params.city;

        if(!city)
        {
            return res.status(400).json({message : "city is required !"});
        }

        const shops = await Shop.find({
            city : {$regex : new RegExp(`^${city}$`, "i")}
        }).populate("items");
        
        if(!shops)
        {
            return res.status(400).json({message : "No shop found in current city !"});
        }

        const shopIds = shops.map((shop) => shop._id);

        const items = await Item.find({shop : {$in : shopIds}});

        return res.status(200).json(items);
    }
    catch(error)
    {
        return res.status(500).json({message : `get food item by city error : ${error}`});
    }
};

export const searchItems = async (req, res) => {
    try
    {
        const {query, city} = req.query;

        if(!query || !city)
        {
            return null;
        }

        const shops = await Shop.find({
            city : {$regex : new RegExp(`^${city}$`, "i")}
        }).populate("items");

        if(!shops)
        {
            return res.status(400).json({message : "No shop found in current city !"});
        }

        const shopIds = shops.map(s => s._id);

        const items = await Item.find({
            shop:{$in : shopIds},
            $or : [
                {name : {$regex : query, $options : "i"}},
                {category : {$regex : query, $options : "i"}}
            ]
        }).populate("shop", "name image");

        return res.status(200).json(items);
    }   
    catch(error)
    {
        return res.status(500).json({message : `search item error : ${error}`});
    }
};