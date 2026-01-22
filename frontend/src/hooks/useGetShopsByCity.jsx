import React, { useEffect } from 'react';
import axios from 'axios';
import {serverUrl} from '../App';
import { useDispatch, useSelector } from 'react-redux';
import { setShopsInMyCity, setUserData } from '../redux/userSlice';

function useGetShopsByCity() {
    const dispatch = useDispatch();
    const {currentCity} = useSelector(state => state.user);
    useEffect(() => {
        const fetchShops = async () => {

            try
            {
                const result = await axios.get(`${serverUrl}/api/shop/get-shop-by-city/${currentCity}`, {withCredentials : true});

                dispatch(setShopsInMyCity(result.data));
                console.log(result.data);
            }
            catch(error)
            {
                console.log(error);
            }

        };

        fetchShops();
    }, [currentCity]);
}

export default useGetShopsByCity