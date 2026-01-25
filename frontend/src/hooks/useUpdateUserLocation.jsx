import React, { useEffect } from 'react';
import axios from 'axios';
import {serverUrl} from '../App';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentCity, setCurrentState, setUserData, setCurrentAddress } from '../redux/userSlice';
import { setAddress, setLocation } from '../redux/mapSlice';

function useUpdateUserLocation() {
    const dispatch = useDispatch();
    const {userData} = useSelector(state => state.user);
    const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;
    useEffect(() => {
        const updateLocation = async (lat, lon) => {
            const result = await axios.post(`${serverUrl}/api/user/update-location`, {lat, lon}, {withCredentials : true});

            console.log(result.data);
        }

        navigator.geolocation.watchPosition((pos) => {
            updateLocation(pos.coords.latitude, pos.coords.longitude);
        })
    }, [userData]);
}

export default useUpdateUserLocation