import Order from "../models/Order.js";
import DeliveryAssignment from "../models/DeliveryAssignment.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js"
import { sendDeliveryOtpMail } from "../utils/mail.js";
import RazorPay from "RazorPay"
import dotenv from 'dotenv'
dotenv.config()

let instance = new RazorPay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_KEY_SECRET,
});

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

        if(paymentMethod == "online")
        {
            const razorpayOrder = await instance.orders.create({
                amount : Math.round(totalAmount*100),
                currency : 'INR',
                receipt : `receipt_${Date.now()}`
            });

            const newOrder = await Order.create({
                user : req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                shopOrders,
                razorpayOrderId : razorpayOrder.id,
                payment : false
            });

            return res.status(200).json({
                razorpayOrder,
                orderId : newOrder._id
            });
        }
        
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

export const verifyOnlinePayment = async (req, res) => {
    try
    {
        const {razorpay_payment_id, orderId} = req.body;
        const payment = await instance.payments.fetch(razorpay_payment_id);

        if(!payment || payment.status != "captured")
        {
            return res.status(400).json({message : "payment not captured !"});
        }

        const order = await Order.findById(orderId);
        
        if(!order)
        {
            return res.status(400).json({message : "order not found !"});
        }

        order.payment = true;
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        await order.populate("shopOrders.shopOrderItems.item", "name image price");
        await order.populate("shopOrders.shop", "name");

        return res.status(200).json(order);
    }
    catch(error)
    {
        return res.status(500).json({message : `verify online payment error : ${error}`});
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
            const orders = await Order.find({"shopOrders.owner" : req.userId}).sort({createdAt : -1}).populate("shopOrders.shop", "name").populate("user", "fullName email mobile").populate("shopOrders.shopOrderItems.item", "name image price").populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

            const filteredOrders = orders.map(order => {
                return {
                    _id: order._id,
                    paymentMethod: order.paymentMethod,
                    user: order.user,
                    shopOrders: order.shopOrders.find(
                    o => o.owner._id.toString() === req.userId
                    ),
                    createdAt: order.createdAt,
                    deliveryAddress : order.deliveryAddress,
                    payment : order.payment
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

export const acceptOrder = async(req, res) => {
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

        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo : req.userId,
            status : {$nin : ["broadcasted", "completed"]}  // delivery assignments mathi koy bhi assignment na assignedTo ma aa user ni id hoy.. and ae assignment nu status "broadcasted" ke "completed" na hoy.. matalab "assigned" hoy.. to ae delivery boy atyare hal koy delivery ne assigned chhe
        });

        if(alreadyAssigned)
        {
            return res.status(400).json({message : "you are already assigned to another order !"});
        }

        assignment.assignedTo = req.userId;
        assignment.status = 'assigned';
        assignment.acceptedAt = new Date();

        await assignment.save();

        const order = await Order.findById(assignment.order);

        if(!order)
        {
            return res.status(400).json({message : "order not found !"});
        }

        const shopOrder = order.shopOrders.id(assignment.shopOrderId);
        shopOrder.assignedDeliveryBoy = req.userId;

        await order.save();

        return res.status(200).json({message : "order accepted !"});
    }
    catch(error)
    {
        return res.status(500).json({message : `accept order error : ${error}`});
    }
};

// for delivery boy
export const getCurrentOrder = async (req, res) => {
    try
    {
        const assignment = await DeliveryAssignment.findOne({
            assignedTo : req.userId,
            status : "assigned"
        }).populate("shop", "name")
        .populate("assignedTo", "fullName email mobile location")
        .populate({
            path : "order",
            populate : [{path : "user", select : "fullName email location mobile"}]
        });

        if(!assignment)
        {
            return res.status(400).json({message : "assignment not found !"});
        }

        if(!assignment.order)
        {
            return res.status(400).json({message : "order not found !"});
        }

        const shopOrder = assignment.order.shopOrders.find(so => String(so._id) == String(assignment.shopOrderId));

        if(!shopOrder)
        {
            return res.status(400).json({message : "shopOrder not found !"});
        }

        let deliveryBoyLocation = {lat : null, lon : null};
        if(assignment.assignedTo.location.coordinates.length == 2)
        {
            deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1];
            deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0];
        }

        let customerLocation = {lat : null, lon : null};
        if(assignment.order.deliveryAddress)
        {
            customerLocation.lat = assignment.order.deliveryAddress.latitude;
            customerLocation.lon = assignment.order.deliveryAddress.longitude;
        }

        return res.status(200).json({
            _id : assignment.order._id,
            user : assignment.order.user,
            shopOrder,
            deliveryAddress : assignment.order.deliveryAddress,
            deliveryBoyLocation,
            customerLocation
        });

    }
    catch(error)
    {
        return res.status(500).json({message : `get current order error : ${error}`});
    }
};

// for customer
export const getOrderById = async (req, res) => {
    try
    {
        const {orderId} = req.params;

        const order = await Order.findById(orderId)
        .populate("user")
        .populate({
            path : "shopOrders.shop",
            model : "Shop"
        })
        .populate({
            path : "shopOrders.assignedDeliveryBoy",
            model : "User"
        })
        .populate({
            path : "shopOrders.shopOrderItems.item",
            model : "Item"
        })
        .lean();

        if(!order)
        {
            return res.status(400).json({message : "order not found !"});
        }

        return res.status(200).json(order);
    }
    catch(error)
    {
        return res.status(500).json({message : `get order by ID error : ${error}`});
    }
};

export const sendDeliveryOtp = async (req, res) => {
    try
    {
        const {orderId, shopOrderId} = req.body;

        const order = await Order.findById(orderId).populate("user");
        const shopOrder = order.shopOrders.id(shopOrderId);

        if(!order || !shopOrder)
        {
            return res.status(400).json({message : "invalid order/shopOrder id"});
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        shopOrder.deliveryOtp = otp;
        shopOrder.otpExpires = Date.now() + 5 * 60 * 1000;
        await order.save();

        await sendDeliveryOtpMail(order.user, otp);

        return res.status(200).json({message : `OTP sent successfuly to ${order?.user?.fullName} !`});
    }
    catch(error)
    {
        return res.status(500).json({message : `send delivery otp error : ${error}`});
    }
};

export const verifyDeliveryOtp = async (req, res) => {
    try
    {
        const {orderId, shopOrderId, otp} = req.body;

        const order = await Order.findById(orderId).populate("user");
        const shopOrder = order.shopOrders.id(shopOrderId);

        if(!order || !shopOrder)
        {
            return res.status(400).json({message : "invalid order/shopOrder id"});
        }

        if(shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < Date.now())
        {
            return res.status(400).json({message : "invalid or expired OTP !"});
        }

        shopOrder.status = "delivered";
        shopOrder.deliveredAt = Date.now();

        await order.save();

        await DeliveryAssignment.deleteOne({
            shopOrderId : shopOrder._id,
            order : order._id,
            assignedTo : shopOrder.assignedDeliveryBoy
        });

        return res.status(200).json({message : "Order Delivered Successfuly !"})
    }
    catch(error)
    {
        return res.status(500).json({message : `verify delivery otp error : ${error}`});
    }
};

export const getItemsByShop = async (req, res) => {
    try
    {
        const {shopId} = req.params;
        const shop = await Shop.findById(shopId).populate("items");

        if(!shop)
        {
            return res.status(400).json({message : "shop not found !"});
        }

        return res.status(200).json({
            shop, items : shop.items
        });
    }
    catch(error)
    {
        return res.status(500).json({message : `get items by shop error : ${error}`});
    }
};

