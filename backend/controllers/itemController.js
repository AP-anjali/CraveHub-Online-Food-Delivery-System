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
        await shop.populate("items owner");

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

        return res.status(200).json(item);
    }
    catch(error)
    {
        return res.status(500).json({message : `editing item error : ${error}`});
    }
};