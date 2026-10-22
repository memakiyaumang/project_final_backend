const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required.",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource.",
            });
        }

        next();
    };
};

export default authorizeRoles;


// const authorizeRoles = (...allowedRoles) => {
//     return (req, res, next) => {

//         console.log("========== ROLE CHECK ==========");
//         console.log("REQUEST METHOD:", req.method);
//         console.log("REQUEST URL:", req.originalUrl);
//         console.log("USER ROLE:", req.user?.role);
//         console.log("ALLOWED ROLES:", allowedRoles);
//         console.log("================================");

//         if (!req.user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Authentication is required.",
//             });
//         }

//         if (!allowedRoles.includes(req.user.role)) {
//             return res.status(403).json({
//                 success: false,
//                 message: "You are not authorized to access this resource.",
//             });
//         }

//         next();
//     };
// };

// export default authorizeRoles;