import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config()
const SECRET = process.env.CLIENT_SECRET;

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const isCustomAuth = token.length < 500 

        let decodeData;

        //If token is custom token do this
        if(token && isCustomAuth) {
            decodeData = jwt.verify(token, SECRET)

            req.userId = decodeData?.id

        } else {
            //Else of token is google token then do this
            decodeData = jwt.decode(token)

            req.userId = decodeData?.sub
        }

        next()

    } catch (error) {
        console.log(error)
    }
}

export default auth