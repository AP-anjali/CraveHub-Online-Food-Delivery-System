import uploadOnCloudynary from "../utils/cloudinary.js";
import Shop from "../models/Shop.js";

export const createOrEditShop = async (req, res) => {
    try
    {
        const {name, city, state, address} = req.body;

        let image;

        if(req.file)
        {
            image = await uploadOnCloudynary(req.file.path);    // uploading on cloudynary and getting the url
        }

        let shop = await Shop.findOne({owner : req.userId});

        if(!shop)
        {
            shop = await Shop.create({
                name, city, state, address, image, owner : req.userId   // we will have userId from isAuth middleware
            });
        }
        else
        {
            const updateData = {
                name,
                city,
                state,
                address
            };

            if (image) {
                updateData.image = image;
            }

            shop = await Shop.findByIdAndUpdate(
                shop._id,
                updateData,
                { new: true }
            );
        }

        await shop.populate("owner items");

        return res.status(201).json(shop);
    }
    catch(error)
    {
        return res.status(500).json({message : `create shop error : ${error}`});
    }
};

export const getMyShop = async (req, res) => {
    try
    {
        const shop = await Shop.findOne({owner : req.userId}).populate("owner").populate({
            path : "items",
            options : {sort : {updatedAt : -1}}
        });

        if(!shop)
        {
            return null;
        }

        return res.status(200).json(shop);
    }
    catch(error)
    {
        return res.status(500).json({message : `get my shop error : ${error}`});
    }
};