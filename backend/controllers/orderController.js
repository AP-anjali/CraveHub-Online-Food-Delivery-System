import Order from "../models/Order.js";
import DeliveryAssignment from "../models/DeliveryAssignment.js";
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

export const updateOrderStatus = async (req, res) => {
    try
    {
        const {orderId, shopId} = req.params;
        const {status} = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
           return res.status(404).json({ message: "Order not found" });
        }

        const shopOrder = await order.shopOrders.find( o => o.shop.toString() === shopId )

        if(!shopOrder)
        {
            return res.status(400).json({message : "shop order not found !"});
        }

        shopOrder.status = status;

        let deliveryBoysPayload = [];

        if(status == "outForDelivery" && !shopOrder.assignment)
        {
            const {longitude, latitude} = order.deliveryAddress;

            const nearByDeliveryBoys = await User.find({
                role : "deliveryBoy",
                location : {
                    $near : {
                        $geometry : {type : "Point", coordinates : [Number(longitude), Number(latitude)]},
                        $maxDistance : 5000
                    }
                }
            });

            const nearByDeliveryBoysIds = nearByDeliveryBoys.map(user => user._id);

            const busyDeliveryBoysIds = await DeliveryAssignment.find({
                assignedTo : {$in : nearByDeliveryBoysIds},
                status : {$nin : ["broadcasted", "completed"]}
            }).distinct("assignedTo");

            const busyDeliveryBoysIdsSet = new Set(busyDeliveryBoysIds.map(id => String(id)));

            const availableDeliveryBoys = nearByDeliveryBoys.filter(user => !busyDeliveryBoysIdsSet.has(String(user._id)));
            
            const candidates = availableDeliveryBoys.map(b => b._id);

            if(candidates.length == 0)
            {
                await order.save();
                return res.json({
                    message : "order status has been updated.. but there is no available delivery boy..!"
                });
            }

            const deliveryAssignment = await DeliveryAssignment.create({
                order : order._id,
                shop : shopOrder.shop,
                shopOrderId : shopOrder._id,
                broadcastedTo : candidates,
                status : "broadcasted"
            });

            shopOrder.assignedDeliveryBoy = deliveryAssignment.assignedTo;
            shopOrder.assignment = deliveryAssignment._id;

            deliveryBoysPayload = availableDeliveryBoys.map(user => ({
                id : user._id,
                fullName : user.fullName,
                longitude : user.location.coordinates?.[0],
                latitude : user.location.coordinates?.[1],
                mobile : user.mobile
            }));
        }

        await order.save();

        const updatedShopOrder = order.shopOrders.find(o => o.shop == shopId);

        await order.populate("shopOrders.shop", "name");
        await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile");

        return res.status(200).json({
            shopOrder : updatedShopOrder,
            assignedDeliveryBoy : updatedShopOrder?.assignedDeliveryBoy,
            availableBoys : deliveryBoysPayload,
            assignment : updatedShopOrder?.assignment._id
        });
    }
    catch(error)
    {
        return res.status(500).json({message : `update order status error : ${error}`});
    }
};

export const getDeliveryBoyAssignment = async (req, res) => {
    try
    {
        const deliveryBoyId = req.userId;

        const assignments = await DeliveryAssignment.find({
            broadcastedTo : deliveryBoyId,
            status : "broadcasted"
        })
        .populate("order")
        .populate("shop");

        const formated = assignments.map(a => ({
            assignmentId : a._id,
            orderId : a.order._id,
            shopName : a.shop.name,
            deliveryAddress : a.order.deliveryAddress,
            items : a.order.shopOrders.find(so => so._id.equals(a.shopOrderId)).shopOrderItems || [],
            subTotal : a.order.shopOrders.find(so => so._id.equals(a.shopOrderId))?.subTotal,
        }));

        return res.status(200).json(formated);
    }
    catch(error)
    {
        return res.status(500).json({message : `get delivery boy assignment error : ${error}`});
    }
};

const acceptOrder = async(req, res) => {
    try
    {
        const {assignmentId} = req.params;

        const assignment = await DeliveryAssignment.findById(assignmentId);

        if(!assignment)
        {
            return res.status(400).json({message : "assignment not found !"});
        }

        if(assignment.status !== "broadcasted")
        {
            return res.status(400).json({message : "assignment is expired !"});
        }
    }
    catch(error)
    {

    }
};