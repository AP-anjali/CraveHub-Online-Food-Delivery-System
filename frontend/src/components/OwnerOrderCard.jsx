import axios from 'axios';
import React, { useState } from 'react'
import {MdPhone} from "react-icons/md"
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';

function OwnerOrderCard({data}) {

  const dispatch = useDispatch();
  const [availableBoys, setAvailableBoys] = useState([]);

  const handleUpdateStatus = async (orderId, shopId, status) => {
    try
    {
        const result = await axios.post(`${serverUrl}/api/order/update-status/${orderId}/${shopId}`, {status}, {withCredentials:true});
        dispatch(updateOrderStatus({orderId, shopId, status}));
        setAvailableBoys(result.data.availableBoys);
        console.log(result.data);
    }
    catch(error)
    {
        console.log(error);
    }
  };

  return (
    <div className='bg-white rounded-lg shadow p-4 space-y-4'>
        <div>
            <h2 className='text-lg font-semibold text-gray-800'>{data.user.fullName}</h2>
            <p className='text-sm text-gray-500'>{data.user.email}</p>
            <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'><MdPhone /> <span>{data.user.mobile}</span></p>
        </div>

        <div className='flex flex-col items-start gap-2 text-gray-600 text-sm'>
            <p className='font-semibold'>{data?.deliveryAddress?.text}</p>
            <p className='text-xs text-gray-600'>
                Latitude : {data?.deliveryAddress?.latitude}, Longitude : {data?.deliveryAddress?.longitude}
            </p>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-2">
            {
                data.shopOrders.shopOrderItems.map((item, index) => (
                    <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
                        <img src={item.item.image} alt="item image" className='w-full h-24 object-cover rounded' />
                        <p className='text-sm font-semibold mt-1'>{item.name}</p>
                        <p className='text-xs text-gray-600'>Qty : {item.quantity} x ₹ {item.price}</p>
                    </div>
                ))
            }
        </div>

        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-400">
            <span className='text-sm'>
                Status : <span className='font-semibold capitalize text-[#ff4d2d]'>{data.shopOrders.status == "outForDelivery" ? "our For Delivery" : data.shopOrders.status}</span>
            </span>

            <select onChange={(e) => handleUpdateStatus(data._id, data.shopOrders.shop._id, e.target.value)} className='rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 border-[#ff4d2d] text-[#ff4d2d]'>
                <option value="" disabled selected>Change Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="outForDelivery">Our for Delivery</option>
            </select>
        </div>
        
        {
            data.shopOrders.status == "outForDelivery" &&

            <div className='mt-3 p-2 border rounded-lg text-sm bg-orange-50'>
                <p>Available Delivery Boys : </p>
                {
                    availableBoys.length > 0 ? (
                        availableBoys.map((b, index) => (
                            <div className='text-gray-300'>{b.fullName} - {b.mobile}</div>
                        ))
                    ) : (
                        <div>Waiting for delivery boy to accept !</div>
                    )
                }
            </div>
        }

        <div className='text-right font-bold text-gray-800 text-sm'>
            Total : ₹{data.shopOrders.subTotal}
        </div>
    </div>
  )
}

export default OwnerOrderCard