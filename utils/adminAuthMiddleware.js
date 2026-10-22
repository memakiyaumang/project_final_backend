    import jwt from "jsonwebtoken";

    import adminSecreteKey from "../adminJwtConfig.js";

    function adminAuthMiddleware(req, res, next) {

        const authHeader = req.header("Authorization");

        if (!authHeader) {
            return res.status(401).json({
                message: "Admin authorization is missing!"
            });
        }

        const [bearer, token] = authHeader.split(" ");

        if (bearer != "Bearer" || !token) {
            return res.status(401).json({
                message: "Invalid admin token format!"
            });
        }

        jwt.verify(token, adminSecreteKey, (error, admin) => {

            if (error) {
                return res.status(403).json({
                    message: "Invalid admin token!"
                });
            }

            req.admin = admin;

            next();
        });
    }

    export default adminAuthMiddleware;