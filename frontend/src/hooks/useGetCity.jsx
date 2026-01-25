import React, { useEffect } from 'react';
import axios from 'axios';
import {serverUrl} from '../App';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentCity, setCurrentState, setUserData, setCurrentAddress } from '../redux/userSlice';
import { setAddress, setLocation } from '../redux/mapSlice';

function useGetCity() {
    const dispatch = useDispatch();
    const {userData} = useSelector(state => state.user);
    const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(async(position) => {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            dispatch(setLocation({lat : latitude, lon : longitude}));

            const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${GEOAPIFY_KEY}`);

            dispatch(setCurrentCity(result?.data?.results[0].city));
            console.log("cito : ", result?.data?.results[0].city);
            dispatch(setCurrentState(result?.data?.results[0].state));
            dispatch(setCurrentAddress(result?.data?.results[0].address_line2 || result?.data?.results[0].address_line1));
            dispatch(setAddress(result?.data?.results[0].address_line2))
        });
    }, [userData]);
}

export default useGetCity