import Order from "../models/Order.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js"

export const placeOrder = async (req, res) => {
    try
    {
        const {cartItems, paymentMethod, deliveryAddress, totalAmount} = req.body;

        if(!cartItems || cartItems.length == 0)
        {
            return res.status(400).json({message : "cart is empty !"});
        }

        if(!deliveryAddress.text || !deliveryAddress.latitude || !deliveryAddress.longitude)
        {
            return res.status(400).json({message : "send complete delivery address !"});
        }

        const groupItemsByShop = {};

        cartItems.forEach(item => {
            const shopId = item.shop;
            if (!groupItemsByShop[shopId]) 
            {
                groupItemsByShop[shopId] = [];    
            }

            groupItemsByShop[shopId].push(item);
        });

        const shopOrders = await Promise.all ( Object.keys(groupItemsByShop).map(async (shopId) => {
            const shop = await Shop.findById(shopId).populate("owner");

            if(!shop)
            {
                return res.status(400).json({message : "shop not found !"});
            }

            const items = groupItemsByShop[shopId];
            const subTotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)

            return {
                shop : shop._id,
                owner : shop.owner._id,
                subTotal,
                shopOrderItems : items.map((i) => ({
                    item : i.id,
                    name : i.name,
                    price : i.price,
                    quantity : i.quantity
                }))
            }
        }));

        const newOrder = await Order.create({
            user : req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            shopOrders
        });

        await newOrder.populate("shopOrders.shopOrderItems.item", "name image price");
        await newOrder.populate("shopOrders.shop", "name");

        return res.status(201).json(newOrder);
    }
    catch(error)
    {
        return res.status(500).json({message : `order placement error : ${error}`});
    }
};

export const getMyOrders = async (req, res) => {
    try
    {
        const user = await User.findById(req.userId);

        if(user.role == "user")
        {
            const orders = await Order.find({user:req.userId}).sort({createdAt : -1}).populate("shopOrders.shop", "name").populate("shopOrders.owner", "name email mobile").populate("shopOrders.shopOrderItems.item", "name image price");
            return res.status(200).json(orders);
        }
        else if(user.role == "owner")
        {
            const orders = await Order.find({"shopOrders.owner" : req.userId}).sort({createdAt : -1}).populate("shopOrders.shop", "name").populate("user", "fullName email mobile").populate("shopOrders.shopOrderItems.item", "name image price");

            const filteredOrders = orders.map(order => {
                return {
                    _id: order._id,
                    paymentMethod: order.paymentMethod,
                    user: order.user,
                    shopOrders: order.shopOrders.find(
                    o => o.owner._id.toString() === req.userId
                    ),
                    createdAt: order.createdAt,
                    deliveryAddress : order.deliveryAddress
                };
            });
            
            return res.status(200).json(filteredOrders);
        }
    }
    catch(error)
    {
        return res.status(500).json({message : `get user order error : ${error}`});
    }
};
