import React, { useEffect, useRef, useState } from 'react'
import Nav from './Nav'
import {categories} from "../category.js"
import CategoryCard from './CategoryCard'
import {FaCircleChevronLeft, FaCircleChevronRight} from "react-icons/fa6"
import { useSelector } from 'react-redux'
import FoodItemCard from './FoodItemCard.jsx'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { serverUrl } from '../App.jsx'

function UserDashboard() {
  const {currentCity, shopsInMyCity, foodItemsInMyCity, searchItems} = useSelector(state => state.user);
  const cateScrollRef = useRef();
  const shopScrollRef = useRef();
  const [showLeftCateButton, setShowLeftCateButton] = useState(false);
  const [showRightCateButton, setShowRightCateButton] = useState(false);

  const [showLeftShopButton, setShowLeftShopButton] = useState(false);
  const [showRightShopButton, setShowRightShopButton] = useState(false);
  const [updatedItemsList, setUpdatedItemsList] = useState([]);

  const navigate = useNavigate();

  const handleFilterByCategory = (category) => {
    if (!foodItemsInMyCity) return;

    if(category == "All")
    {
      setUpdatedItemsList(foodItemsInMyCity);
    }
    else
    {
      const filteredList = foodItemsInMyCity.filter(i => i.category.toLowerCase() === category.toLowerCase());
      setUpdatedItemsList(filteredList);
    }
  }; 

  useEffect(() => {
    setUpdatedItemsList(foodItemsInMyCity || []);
  }, [foodItemsInMyCity]);

  const updateButton = (ref, setLeftButton, setRightButton) => {
    const element = ref.current;

    if(element)
    {
      setLeftButton(element.scrollLeft > 0);
      setRightButton(element.scrollLeft + element.clientWidth < element.scrollWidth);
    }
  };

  const scrollHandler = (ref, direction) => {
    if(ref.current)
    {
      ref.current.scrollBy({
        left: direction == "left"?-200:200,
        behavior : "smooth" 
      })
    }
  };

  useEffect(() => {
    const element = cateScrollRef.current;
    const element2 = shopScrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton);
    };

    const handleScroll2 = () => {
      updateButton(shopScrollRef, setShowLeftShopButton, setShowRightShopButton);
    };

    handleScroll();
    handleScroll2();

    element.addEventListener("scroll", handleScroll);
    element2.addEventListener("scroll", handleScroll2);

    return () => {
      element.removeEventListener("scroll", handleScroll);
      element2.removeEventListener("scroll", handleScroll2);
    };
  }, []);

  return (
    <div className='w-full min-h-screen bg-[#fff9f6] flex flex-col gap-5 overflow-y-auto items-center'>
        <Nav />

        {
          (searchItems && searchItems.length > 0) &&
          <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4'>
            <h1 className='text-gray-900 text-xl sm:text-2xl font-semibold border-b border-gray-200 pb-2'>
              Search Results
            </h1>

            <div className='w-full h-auto flex flex-wrap gap-6 justify-center'>
              {
                searchItems.map((item) => (
                  <FoodItemCard key={item._id} data={item} />
                ))
              }
            </div>
          </div>
        }

        {/* categories */}
        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
          <h1 className='text-gray-800 text-2xl sm'>Inspiration for your first order</h1>

          <div className='w-full relative'>

            {
              showLeftCateButton && 
              <button onClick={() => scrollHandler(cateScrollRef, "left")} className='absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10 cursor-pointer'>
                <FaCircleChevronLeft />
              </button>
            }

            <div className='w-full flex overflow-x-auto gap-4 pb-2' ref={cateScrollRef}>
              {
                categories.map((cate, index) => (
                  <CategoryCard name={cate.category} image={cate.image} key={index} onClick={() => handleFilterByCategory(cate.category)} />
                ))
              }
            </div>

            {
              showRightCateButton && 
              <button onClick={() => scrollHandler(cateScrollRef, "right")} className='absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10 cursor-pointer'>
                <FaCircleChevronRight />
              </button>
            }
          </div>

        </div>

        {/* shops in my city */}
        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
          <h1 className='text-gray-800 text-2xl sm'>Best Shop in {currentCity}</h1>
          
          <div className='w-full relative'>

            {
              showLeftShopButton && 
              <button onClick={() => scrollHandler(shopScrollRef, "left")} className='absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10 cursor-pointer'>
                <FaCircleChevronLeft />
              </button>
            }

            <div className='w-full flex overflow-x-auto gap-4 pb-2' ref={shopScrollRef}>
              {
                shopsInMyCity?.map((shop, index) => (
                  <CategoryCard name={shop.name} image={shop.image} key={index} onClick={() => navigate(`/shop/${shop._id}`)} />
                ))
              }
            </div>

            {
              showRightShopButton && 
              <button onClick={() => scrollHandler(shopScrollRef, "right")} className='absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10 cursor-pointer'>
                <FaCircleChevronRight />
              </button>
            }
          </div>
        </div>

        {/* food items */}
        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
          <h1 className='text-gray-800 text-2xl sm'>Suggested Food Items</h1>
          
          <div className='w-full h-auto flex flex-wrap gap-[20px] justify-center'>
            {
              updatedItemsList && updatedItemsList.length > 0 ? (
                updatedItemsList.map((item, index) => (
                  <FoodItemCard key={index} data={item} />
                ))
              ) : (
                <p className="text-gray-500">No food items found for this category</p>
              )
            }
          </div>
        </div>
    </div>
  )
}

export default UserDashboard