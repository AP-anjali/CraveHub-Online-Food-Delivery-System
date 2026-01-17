import React, { useState } from 'react';
import {IoIosArrowRoundBack} from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import axios from "axios";
import { serverUrl } from '../App';

function ForgotPassword() {

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [err, setErr] = useState("");

  const handleSendOtp = async () => {
    try
    {
        const result = await axios.post(`${serverUrl}/api/auth/send-otp`, {email}, {withCredentials : true});
        console.log(result);
        setErr("");
        setStep(2);
    }
    catch(error)
    {
        setErr(error?.response?.data?.message);
    }
  };  

  const handleVerifyOtp = async () => {
    try
    {
        const result = await axios.post(`${serverUrl}/api/auth/verify-otp`, {email, otp}, {withCredentials : true});
        console.log(result);
        setStep(3);
    }
    catch(error)
    {
        setErr(error?.response?.data?.message);
    }
  };  

  const handleResetPassword = async () => {
    if(newPassword != confirmPassword)
    {
        return null;
    }

    try
    {
        const result = await axios.post(`${serverUrl}/api/auth/reset-password`, {email, newPassword}, {withCredentials : true});
        setErr("");
        console.log(result);
        navigate("/signin");
    }
    catch(error)
    {
        setErr(error?.response?.data?.message);
    }
  };  

  return (
    <div className='flex w-full items-center justify-center min-h-screen p-4 bg-[#fff9f6]'>
        <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8'>
            <div className='flex items-center gap-4 mb-4'>
                <IoIosArrowRoundBack size={30} className='text-[#ff4d2d] cursor-pointer' onClick={() => navigate('/signin')} />
                <h1 className='text-2xl font-bold text-center text-[#ff4d2d]'>Forgot Password</h1>
            </div>

            {
                step == 1 && 
                <div>
                    {/* email input field */}
                    <div className='mb-6'>
                        <label htmlFor="email" className='block text-gray-700 font-medium mb-1'>Email</label>
                        <input type="email" className='w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter Registered Email' onChange={(e) => setEmail(e.target.value)} value={email} required />
                    </div>

                    <button onClick={handleSendOtp} className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`}>
                        Send OTP
                    </button>

                    {err &&
                        <p className='text-red-500 text-center my-[10px]'>*{err}</p>
                    }
                </div>
            }

            {
                step == 2 && 
                <div>
                    {/* otp input field */}
                    <div className='mb-6'>
                        <label htmlFor="otp" className='block text-gray-700 font-medium mb-1'>OTP</label>
                        <input type="number" className='w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter received OTP' onChange={(e) => setOtp(e.target.value)} value={otp} required />
                    </div>

                    <button onClick={handleVerifyOtp} className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`}>
                        Verify
                    </button>

                    {err &&
                        <p className='text-red-500 text-center my-[10px]'>*{err}</p>
                    }
                </div>
            }

            {
                step == 3 && 
                <div>
                    {/* new password input field */}
                    <div className='mb-6'>
                        <label htmlFor="password" className='block text-gray-700 font-medium mb-1'>New Password</label>
                        <div className='relative'>
                            <input type={`${showPassword1 ? "text" : "password"}`} className='w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter New Password' onChange={(e) => setNewPassword(e.target.value)} value={newPassword} required />
                            <button className='absolute right-3 cursor-pointer top-[14px] text-gray-500' onClick={() => setShowPassword1(prev=>!prev)}>
                                {!showPassword1 ? <FaRegEye/> : <FaRegEyeSlash/>}
                            </button>
                        </div>
                    </div>

                    {/* confirm password input field */}
                    <div className='mb-6'>
                        <label htmlFor="confirmPassword" className='block text-gray-700 font-medium mb-1'>Confirm Password</label>
                        <div className='relative'>
                            <input type={`${showPassword2 ? "text" : "password"}`} className='w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none' placeholder='Confirm Password' onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} required />
                            <button className='absolute right-3 cursor-pointer top-[14px] text-gray-500' onClick={() => setShowPassword2(prev=>!prev)}>
                                {!showPassword2 ? <FaRegEye/> : <FaRegEyeSlash/>}
                            </button>
                        </div>
                    </div>

                    <button onClick={handleResetPassword} className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`}>
                        Reset Password
                    </button>

                    {err &&
                        <p className='text-red-500 text-center my-[10px]'>*{err}</p>
                    }
                </div>
            }
        </div>
    </div>
  )
}

export default ForgotPassword