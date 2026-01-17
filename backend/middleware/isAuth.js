
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const isAuth = async (req, res, next) => {
    try
    {
        const token = req.cookies.token;

        if(!token)
        {
            return res.status(400).json({message : "Token not found !"});
        }

        const decodeToken = jwt.verify(token, process.env.JWT_SECRET);

        if(!decodeToken)
        {
            return res.status(400).json({message : "Token not verified !"});
        }

        req.userId = decodeToken.userId;    // setting userId property in req object..
        next();
    }
    catch(error)
    {
        return res.status(500).json({message : "Authentication error !"});
    }
};

export default isAuth;