import jwt from 'jsonwebtoken'
import secreteKey from '../jwtConfig.js'

const genrateToken = (user) => {
    const payload = {
        id:user._id,
        role:user.role,
        email:user.email
    }
    return jwt.sign(payload,secreteKey,{expiresIn:'24h'})
}

export default genrateToken