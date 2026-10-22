import Admin from "../model/Admin.js";
import generateAdminToken from "../utils/adminGenerateToken.js";
import bcrypt from "bcrypt";


/*
=====================================================
CHECK PASSWORD
=====================================================
Supports both:

1. Existing plain-text passwords
2. New bcrypt hashed passwords

This allows old admin accounts to continue working
while gradually migrating passwords to bcrypt.
=====================================================
*/
const isBcryptHash = (password) => {
    return (
        typeof password === "string" &&
        (
            password.startsWith("$2a$") ||
            password.startsWith("$2b$") ||
            password.startsWith("$2y$")
        )
    );
};


const verifyAdminPassword = async (
    enteredPassword,
    storedPassword
) => {
    /*
    ---------------------------------------------
    Existing bcrypt password
    ---------------------------------------------
    */
    if (isBcryptHash(storedPassword)) {
        return await bcrypt.compare(
            enteredPassword,
            storedPassword
        );
    }

    /*
    ---------------------------------------------
    Existing plain-text password
    ---------------------------------------------
    Temporary backward compatibility
    ---------------------------------------------
    */
    return enteredPassword === storedPassword;
};


/*
=====================================================
ADMIN LOGIN
=====================================================
*/
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const trimmedEmail = email
            .trim()
            .toLowerCase();

        const admin = await Admin.findOne({
            email: trimmedEmail,
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid admin email or password.",
            });
        }

        /*
        ---------------------------------------------
        CHECK ADMIN STATUS
        ---------------------------------------------
        */
        if (admin.status !== "active") {
            return res.status(403).json({
                success: false,
                message:
                    "This admin account is inactive.",
            });
        }

        /*
        ---------------------------------------------
        VERIFY PASSWORD
        ---------------------------------------------
        */
        const passwordMatch =
            await verifyAdminPassword(
                password,
                admin.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid admin email or password.",
            });
        }

        /*
        ---------------------------------------------
        MIGRATE OLD PLAIN-TEXT PASSWORD
        ---------------------------------------------
        If the password was stored as plain text,
        convert it to bcrypt after successful login.
        ---------------------------------------------
        */
        if (!isBcryptHash(admin.password)) {
            admin.password =
                await bcrypt.hash(password, 10);

            await admin.save();

            console.log(
                "Admin password migrated to bcrypt."
            );
        }

        /*
        ---------------------------------------------
        GENERATE ADMIN JWT
        ---------------------------------------------
        */
        const adminToken =
            generateAdminToken(admin);

        return res.status(200).json({
            success: true,
            message:
                "Admin login successful.",

            token: adminToken,

            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                status: admin.status,
            },
        });

    } catch (error) {
        console.error(
            "Admin Login Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error during admin login.",
        });
    }
};


/*
=====================================================
CREATE ADMIN
=====================================================
*/
export const createAdmin = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required.",
            });
        }

        const trimmedName =
            name.trim();

        const trimmedEmail =
            email.trim().toLowerCase();

        /*
        ---------------------------------------------
        VALIDATE PASSWORD
        ---------------------------------------------
        */
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters.",
            });
        }

        /*
        ---------------------------------------------
        CHECK EXISTING ADMIN
        ---------------------------------------------
        */
        const existingAdmin =
            await Admin.findOne({
                email: trimmedEmail,
            });

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message:
                    "Admin with this email already exists.",
            });
        }

        /*
        ---------------------------------------------
        HASH PASSWORD
        ---------------------------------------------
        */
        const hashedPassword =
            await bcrypt.hash(password, 10);

        /*
        ---------------------------------------------
        CREATE ADMIN
        ---------------------------------------------
        */
        const admin =
            await Admin.create({
                name: trimmedName,
                email: trimmedEmail,
                password: hashedPassword,
                role: "admin",
                status: "active",
            });

        return res.status(201).json({
            success: true,
            message:
                "Admin created successfully.",

            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                status: admin.status,
            },
        });

    } catch (error) {
        console.error(
            "Create Admin Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while creating admin.",
        });
    }
};


/*
=====================================================
GET ADMIN PROFILE
=====================================================
*/
export const getAdminProfile = async (
    req,
    res
) => {
    try {
        const adminId = req.admin.id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message:
                    "Admin authentication is invalid.",
            });
        }

        const admin =
            await Admin.findById(adminId)
                .select("-password");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message:
                    "Admin not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Admin profile fetched successfully.",

            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                status: admin.status,
            },
        });

    } catch (error) {
        console.error(
            "Get Admin Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching admin profile.",
        });
    }
};