import jwt from "jsonwebtoken";

import adminSecreteKey from "../adminJwtConfig.js";

const generateAdminToken = (admin) => {

    const payload = {

        id: admin._id,

        email: admin.email

    };

    return jwt.sign(
        payload,
        adminSecreteKey,
        {
            expiresIn: "24h"
        }
    );
};

export default generateAdminToken;