import React from 'react'
import { useNavigate } from 'react-router-dom'

function UserOrderCard({data}) {

  const formateDate = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleString('en-GB', {
        day : "2-digit",
        month : "short",
        year : "numeric"
    })
  };

  const navigate = useNavigate();

  return (
    <div className='bg-white rounded-lg shadow p-4 space-y-4'>
        <div className='flex justify-between border-b pb-2'>
            <div>
                <p className='font-semibold'>
                    order #{data._id}
                </p>
                <p className="text-sm text-gray-600">
                    Date : {formateDate(data.createdAt)}
                </p>
            </div>

            <div className='text-right'>
                {
                    data.paymentMethod == "cod" ?
                    <p className='text-sm text-gray-500 font-semibold'>
                        Payment : {data.paymentMethod?.toUpperCase()}
                    </p>
                    :
                    <p className='text-sm text-gray-500 font-semibold'>
                        Payment : {data.payment ? "True" : "False"}
                    </p>
                }
                <p className='font-medium text-blue-600'>
                    Order status : {data.shopOrders?.[0].status == "outForDelivery" ? "Out For Delivery" : data.shopOrders?.[0].status}
                </p>
            </div>
        </div>

        {
            data.shopOrders.map((shopOrder, index) => (
                <div className='border rounded-lg p-3 bg-[#fffaf7] space-y-3' key={index}>
                    <p>{shopOrder.shop.name}</p>

                    <div className="flex space-x-4 overflow-x-auto pb-2">
                        {
                            shopOrder.shopOrderItems.map((item, index) => (
                                <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
                                    <img src={item.item.image} alt="item image" className='w-full h-24 object-cover rounded' />
                                    <p className='text-sm font-semibold mt-1'>{item.name}</p>
                                    <p className='text-xs text-gray-600'>Qty : {item.quantity} x ₹ {item.price}</p>
                                </div>
                            ))
                        }
                    </div>

                    <div className="flex justify-between items-center border-t pt-2">
                        <p className='font-semibold'>Subtotal : {shopOrder.subTotal}</p>
                        <p className='text-sm font-medium text-blue-600'>Status : {shopOrder.status == "outForDelivery" ? "Out For Delivery" : shopOrder.status}</p>
                    </div>
                </div>
            ))
        }

        <div className='flex justify-between items-center border-t pt-2'>
            <p className='font-semibold'>Total : ₹ {data.totalAmount}</p>
            <button onClick={() => navigate(`/track-order/${data._id}`)} className='bg-[#ff4d2d] hover:bg-[#e64526] cursor-pointer text-white font-semibold px-4 py-2 rounded-lg text-sm'>
                Track Order
            </button>
        </div>
    </div>
  )
}

export default UserOrderCard