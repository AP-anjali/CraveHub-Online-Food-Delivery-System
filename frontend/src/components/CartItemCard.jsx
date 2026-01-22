import React from 'react'
import { FaMinus, FaPlus } from 'react-icons/fa'
import { FaRegTrashCan } from 'react-icons/fa6';
import { useDispatch } from 'react-redux';
import { removeCartItem, updateQuantity } from '../redux/userSlice';

function CartItemCard({data}) {
  
  const dispatch = useDispatch();
    
  const handleQuantityIncrease = (id, currentQty) => {
    dispatch(updateQuantity({id, quantity : currentQty+1}));
  };

  const handleQuantityDecrease = (id, currentQty) => {
    if(currentQty > 1)
    {
        dispatch(updateQuantity({id, quantity : currentQty-1}));
    }
  };

  return (
    <div className='flex items-center justify-between bg-white p-4 rounded-xl shadow border'>
        <div className='flex items-center gap-4'>
            <img src={data.image} alt="cart item" className='w-20 h-20 object-cover rounded-lg border' />
            <div>
                <h1 className='font-medium text-gray-800'>{data.name}</h1>
                <p className='text-sm text-gray-500'>₹{data.price} x {data.quantity}</p>
                <p className='font-bold text-gray-900'>₹{data.price * data.quantity}</p>
            </div>

            <div className='flex items-center gap-3'>
                <button onClick={() => handleQuantityDecrease(data.id, data.quantity)} className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer'>
                    <FaMinus size={12} />
                </button>
                
                <span>{data.quantity}</span>
                
                <button onClick={() => handleQuantityIncrease(data.id, data.quantity)} className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer'>
                    <FaPlus size={12} />
                </button>

                <button onClick={() => dispatch(removeCartItem(data.id))} className='p-2 bg-red-100 cursor-pointer text-red-600 rounded-full hover:bg-red-200'>
                    <FaRegTrashCan size={15} />
                </button>
            </div>
        </div>
    </div>
  )
}

export default CartItemCard