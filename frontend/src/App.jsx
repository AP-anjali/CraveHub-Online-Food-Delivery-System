// /frontend/src/App.jsx

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import useGetCurrentUser from './hooks/useGetCurrentUser';
import { useSelector } from 'react-redux';
import useGetCity from './hooks/useGetCity';
import useGetMyShop from './hooks/useGetMyShop';
import CreateEditShop from './pages/CreateEditShop';
import AddFoodItem from './pages/AddFoodItem';
import EditFoodItem from './pages/EditFoodItem';
import useGetShopsByCity from './hooks/useGetShopsByCity';
import useGetFoodItemsByCity from './hooks/useGetFoodItemsByCity';
import CartPage from './pages/CartPage';
import CheckOut from './pages/CheckOut';
import OrderPlaced from './pages/OrderPlaced';
import MyOrders from './pages/MyOrders';
import useGetMyOrders from './hooks/useGetMyOrders';

export const serverUrl = "http://localhost:8000";

function App() {
  useGetCurrentUser();
  useGetCity();
  useGetMyShop();
  useGetShopsByCity();
  useGetFoodItemsByCity();
  useGetMyOrders();

  const {userData} = useSelector(state => state.user);

  return (
    <Routes>
      <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to={"/"} /> } />
      <Route path="/signin" element={!userData ? <SignIn /> : <Navigate to={"/"} /> } />
      <Route path="/forgot-password" element={!userData ? <ForgotPassword /> : <Navigate to={"/"} /> } />
      <Route path="/" element={userData ? <Home /> : <Navigate to={"/signin"} />} />
      <Route path="/create-edit-shop" element={userData ? <CreateEditShop /> : <Navigate to={"/signin"} />} />
      <Route path="/add-food-item" element={userData ? <AddFoodItem /> : <Navigate to={"/signin"} />} />
      <Route path="/edit-food-item/:itemId" element={userData ? <EditFoodItem /> : <Navigate to={"/signin"} />} />
      <Route path="/cart" element={userData ? <CartPage /> : <Navigate to={"/signin"} />} />
      <Route path="/checkout" element={userData ? <CheckOut /> : <Navigate to={"/signin"} />} />
      <Route path="/order-placed" element={userData ? <OrderPlaced /> : <Navigate to={"/signin"} />} />
      <Route path="/my-orders" element={userData ? <MyOrders /> : <Navigate to={"/signin"} />} />
    </Routes>
  )
}

export default App