import User from '../models/User.js'

export const getCurrentUser = async (req, res) => {
    try
    {
        const userId = req.userId;  // this funcation will be called afetr isAuth middleware.. so req object will has the userId property..
        
        if(!userId)
        {
            return res.status(400).json({message : "user id is not found !"});
        }

        const user = await User.findById(userId);

        if(!user)
        {
            return res.status(400).json({message : "user not found !"});
        }

        return res.status(200).json(user);
    }
    catch(error)
    {
        return res.status(500).json({message : `get current user error : ${error}`});
    }
};