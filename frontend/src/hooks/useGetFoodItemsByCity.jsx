import React, { useEffect } from 'react';
import axios from 'axios';
import {serverUrl} from '../App';
import { useDispatch, useSelector } from 'react-redux';
import { setFoodItemsInMyCity } from '../redux/userSlice';

function useGetFoodItemsByCity() {
    const dispatch = useDispatch();
    const {currentCity} = useSelector(state => state.user);
    useEffect(() => {
        const fetchFoodItems = async () => {

            try
            {
                const result = await axios.get(`${serverUrl}/api/item/get-food-items-by-city/${currentCity}`, {withCredentials : true});

                dispatch(setFoodItemsInMyCity(result.data));
            }
            catch(error)
            {
                console.log(error);
            }

        };

        fetchFoodItems();
    }, [currentCity]);
}

export default useGetFoodItemsByCity