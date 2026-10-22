import AdminSettings from "../model/AdminSettings.js";
import Admin from "../model/Admin.js";
import bcrypt from "bcrypt";


/*
=====================================================
HELPER
=====================================================
CHECK WHETHER PASSWORD IS ALREADY BCRYPT HASHED
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


/*
=====================================================
GET ADMIN SETTINGS
=====================================================
*/
export const getAdminSettings = async (
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

        /*
        ---------------------------------------------
        GET ADMIN
        ---------------------------------------------
        */
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

        /*
        ---------------------------------------------
        GET SETTINGS
        ---------------------------------------------
        */
        let settings =
            await AdminSettings.findOne({
                adminId: adminId,
            });

        /*
        ---------------------------------------------
        CREATE DEFAULT SETTINGS
        ---------------------------------------------
        */
        if (!settings) {
            settings =
                await AdminSettings.create({
                    adminId: adminId,

                    profile: {
                        name: admin.name,
                        email: admin.email,
                    },

                    platform: {
                        platformName:
                            "Online Learning Platform",

                        supportEmail:
                            "support@example.com",

                        supportPhone: "",
                    },

                    notifications: {
                        newStudent: true,
                        newFaculty: true,
                        payment: true,
                        courseApproval: true,
                    },
                });
        }

        /*
        ---------------------------------------------
        RETURN SETTINGS
        ---------------------------------------------
        */
        return res.status(200).json({
            success: true,

            data: {
                profile: {
                    name: admin.name,
                    email: admin.email,
                },

                platform:
                    settings.platform,

                notifications:
                    settings.notifications,
            },
        });

    } catch (error) {
        console.error(
            "Get Admin Settings Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while loading admin settings.",
        });
    }
};


/*
=====================================================
UPDATE ADMIN PROFILE
=====================================================
*/
export const updateAdminProfile = async (
    req,
    res
) => {
    try {
        const adminId = req.admin.id;

        const {
            name,
            email,
        } = req.body;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message:
                    "Admin authentication is invalid.",
            });
        }

        /*
        ---------------------------------------------
        VALIDATE NAME
        ---------------------------------------------
        */
        const trimmedName =
            name?.trim();

        if (!trimmedName) {
            return res.status(400).json({
                success: false,
                field: "name",
                message:
                    "Admin name is required.",
            });
        }

        if (trimmedName.length < 2) {
            return res.status(400).json({
                success: false,
                field: "name",
                message:
                    "Admin name must be at least 2 characters.",
            });
        }

        /*
        ---------------------------------------------
        VALIDATE EMAIL
        ---------------------------------------------
        */
        const trimmedEmail =
            email?.trim().toLowerCase();

        if (!trimmedEmail) {
            return res.status(400).json({
                success: false,
                field: "email",
                message:
                    "Email address is required.",
            });
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                field: "email",
                message:
                    "Please enter a valid email address.",
            });
        }

        /*
        ---------------------------------------------
        FIND ADMIN
        ---------------------------------------------
        */
        const admin =
            await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message:
                    "Admin not found.",
            });
        }

        /*
        ---------------------------------------------
        CHECK EMAIL DUPLICATE
        ---------------------------------------------
        */
        const existingAdmin =
            await Admin.findOne({
                email: trimmedEmail,
                _id: {
                    $ne: adminId,
                },
            });

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                field: "email",
                message:
                    "This email address is already in use.",
            });
        }

        /*
        ---------------------------------------------
        UPDATE ADMIN COLLECTION
        ---------------------------------------------
        */
        admin.name =
            trimmedName;

        admin.email =
            trimmedEmail;

        await admin.save();

        /*
        ---------------------------------------------
        UPDATE ADMIN SETTINGS PROFILE
        ---------------------------------------------
        */
        await AdminSettings.findOneAndUpdate(
            {
                adminId: adminId,
            },
            {
                $set: {
                    "profile.name":
                        trimmedName,

                    "profile.email":
                        trimmedEmail,
                },
            },
            {
                upsert: true,
                returnDocument: "after",
                setDefaultsOnInsert: true,
            }
        );

        /*
        ---------------------------------------------
        RETURN UPDATED DATA
        ---------------------------------------------
        */
        return res.status(200).json({
            success: true,
            message:
                "Profile updated successfully.",

            data: {
                name: admin.name,
                email: admin.email,
            },
        });

    } catch (error) {
        console.error(
            "Update Admin Profile Error:",
            error
        );

        /*
        ---------------------------------------------
        MONGOOSE DUPLICATE EMAIL
        ---------------------------------------------
        */
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                field: "email",
                message:
                    "This email address is already in use.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Server error while updating profile.",
        });
    }
};


/*
=====================================================
UPDATE ADMIN PASSWORD
=====================================================
*/
export const updateAdminPassword = async (
    req,
    res
) => {
    try {
        const adminId = req.admin.id;

        const {
            currentPassword,
            newPassword,
            confirmPassword,
        } = req.body;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message:
                    "Admin authentication is invalid.",
            });
        }

        /*
        ---------------------------------------------
        VALIDATE CURRENT PASSWORD
        ---------------------------------------------
        */
        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                field: "currentPassword",
                message:
                    "Current password is required.",
            });
        }

        /*
        ---------------------------------------------
        VALIDATE NEW PASSWORD
        ---------------------------------------------
        */
        if (!newPassword) {
            return res.status(400).json({
                success: false,
                field: "newPassword",
                message:
                    "New password is required.",
            });
        }

        /*
        ---------------------------------------------
        VALIDATE CONFIRM PASSWORD
        ---------------------------------------------
        */
        if (!confirmPassword) {
            return res.status(400).json({
                success: false,
                field: "confirmPassword",
                message:
                    "Please confirm your new password.",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                field: "newPassword",
                message:
                    "New password must be at least 6 characters.",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                field: "confirmPassword",
                message:
                    "New password and confirm password do not match.",
            });
        }

        /*
        ---------------------------------------------
        FIND ADMIN
        ---------------------------------------------
        */
        const admin =
            await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message:
                    "Admin not found.",
            });
        }

        /*
        ---------------------------------------------
        VERIFY CURRENT PASSWORD
        ---------------------------------------------
        Supports old plain-text passwords and
        new bcrypt passwords.
        ---------------------------------------------
        */
        let currentPasswordMatch = false;

        if (
            isBcryptHash(admin.password)
        ) {
            currentPasswordMatch =
                await bcrypt.compare(
                    currentPassword,
                    admin.password
                );
        } else {
            currentPasswordMatch =
                currentPassword ===
                admin.password;
        }

        if (!currentPasswordMatch) {
            return res.status(401).json({
                success: false,
                field: "currentPassword",
                message:
                    "Current password is incorrect.",
            });
        }

        /*
        ---------------------------------------------
        PREVENT SAME PASSWORD
        ---------------------------------------------
        */
        if (
            isBcryptHash(admin.password)
        ) {
            const samePassword =
                await bcrypt.compare(
                    newPassword,
                    admin.password
                );

            if (samePassword) {
                return res.status(400).json({
                    success: false,
                    field: "newPassword",
                    message:
                        "New password must be different from current password.",
                });
            }
        } else if (
            currentPassword === newPassword
        ) {
            return res.status(400).json({
                success: false,
                field: "newPassword",
                message:
                    "New password must be different from current password.",
            });
        }

        /*
        ---------------------------------------------
        HASH NEW PASSWORD
        ---------------------------------------------
        */
        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        /*
        ---------------------------------------------
        SAVE PASSWORD
        ---------------------------------------------
        */
        admin.password =
            hashedPassword;

        await admin.save();

        return res.status(200).json({
            success: true,
            message:
                "Password updated successfully.",
        });

    } catch (error) {
        console.error(
            "Update Admin Password Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while updating password.",
        });
    }
};


/*
=====================================================
UPDATE PLATFORM SETTINGS
=====================================================
*/
export const updateAdminPlatform = async (
    req,
    res
) => {
    try {
        const adminId = req.admin.id;

        const {
            platformName,
            supportEmail,
            supportPhone,
        } = req.body;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message:
                    "Admin authentication is invalid.",
            });
        }

        /*
        ---------------------------------------------
        VALIDATE PLATFORM NAME
        ---------------------------------------------
        */
        const trimmedPlatformName =
            platformName?.trim();

        if (!trimmedPlatformName) {
            return res.status(400).json({
                success: false,
                field: "platformName",
                message:
                    "Platform name is required.",
            });
        }

        /*
        ---------------------------------------------
        VALIDATE SUPPORT EMAIL
        ---------------------------------------------
        */
        const trimmedSupportEmail =
            supportEmail?.trim().toLowerCase();

        if (!trimmedSupportEmail) {
            return res.status(400).json({
                success: false,
                field: "supportEmail",
                message:
                    "Support email is required.",
            });
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailRegex.test(
                trimmedSupportEmail
            )
        ) {
            return res.status(400).json({
                success: false,
                field: "supportEmail",
                message:
                    "Please enter a valid support email.",
            });
        }

        /*
        ---------------------------------------------
        CHECK ADMIN
        ---------------------------------------------
        */
        const admin =
            await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message:
                    "Admin not found.",
            });
        }

        /*
        ---------------------------------------------
        UPDATE PLATFORM
        ---------------------------------------------
        */
        const settings =
            await AdminSettings.findOneAndUpdate(
                {
                    adminId: adminId,
                },
                {
                    $set: {
                        "platform.platformName":
                            trimmedPlatformName,

                        "platform.supportEmail":
                            trimmedSupportEmail,

                        "platform.supportPhone":
                            supportPhone?.trim() || "",
                    },
                },
                {
                    returnDocument: "after",
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            );

        return res.status(200).json({
            success: true,
            message:
                "Platform settings updated successfully.",

            data:
                settings.platform,
        });

    } catch (error) {
        console.error(
            "Update Admin Platform Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while updating platform settings.",
        });
    }
};


/*
=====================================================
UPDATE ADMIN NOTIFICATIONS
=====================================================
*/
export const updateAdminNotifications = async (
    req,
    res
) => {
    try {
        const adminId = req.admin.id;

        const {
            newStudent,
            newFaculty,
            payment,
            courseApproval,
        } = req.body;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message:
                    "Admin authentication is invalid.",
            });
        }

        /*
        ---------------------------------------------
        CHECK ADMIN
        ---------------------------------------------
        */
        const admin =
            await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message:
                    "Admin not found.",
            });
        }

        /*
        ---------------------------------------------
        UPDATE NOTIFICATIONS
        ---------------------------------------------
        */
        const settings =
            await AdminSettings.findOneAndUpdate(
                {
                    adminId: adminId,
                },
                {
                    $set: {
                        "notifications.newStudent":
                            Boolean(newStudent),

                        "notifications.newFaculty":
                            Boolean(newFaculty),

                        "notifications.payment":
                            Boolean(payment),

                        "notifications.courseApproval":
                            Boolean(courseApproval),
                    },
                },
                {
                    returnDocument: "after",
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            );

        return res.status(200).json({
            success: true,
            message:
                "Notification settings updated successfully.",

            data:
                settings.notifications,
        });

    } catch (error) {
        console.error(
            "Update Admin Notifications Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while updating notification settings.",
        });
    }
};


/*
=====================================================
UPDATE ALL ADMIN SETTINGS
=====================================================
*/
export const updateAdminSettings = async (
    req,
    res
) => {
    try {
        const adminId = req.admin.id;

        const {
            profile,
            platform,
            notifications,
        } = req.body;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message:
                    "Admin authentication is invalid.",
            });
        }

        /*
        ---------------------------------------------
        CHECK ADMIN
        ---------------------------------------------
        */
        const admin =
            await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message:
                    "Admin not found.",
            });
        }

        const updateData = {};

        /*
        ---------------------------------------------
        PROFILE
        ---------------------------------------------
        */
        if (profile) {
            if (profile.name?.trim()) {
                updateData["profile.name"] =
                    profile.name.trim();
            }

            if (profile.email?.trim()) {
                updateData["profile.email"] =
                    profile.email
                        .trim()
                        .toLowerCase();
            }
        }

        /*
        ---------------------------------------------
        PLATFORM
        ---------------------------------------------
        */
        if (platform) {
            if (
                platform.platformName !==
                undefined
            ) {
                updateData[
                    "platform.platformName"
                ] =
                    platform.platformName
                        .trim();
            }

            if (
                platform.supportEmail !==
                undefined
            ) {
                updateData[
                    "platform.supportEmail"
                ] =
                    platform.supportEmail
                        .trim()
                        .toLowerCase();
            }

            if (
                platform.supportPhone !==
                undefined
            ) {
                updateData[
                    "platform.supportPhone"
                ] =
                    platform.supportPhone
                        .trim();
            }
        }

        /*
        ---------------------------------------------
        NOTIFICATIONS
        ---------------------------------------------
        */
        if (notifications) {
            if (
                notifications.newStudent !==
                undefined
            ) {
                updateData[
                    "notifications.newStudent"
                ] =
                    Boolean(
                        notifications.newStudent
                    );
            }

            if (
                notifications.newFaculty !==
                undefined
            ) {
                updateData[
                    "notifications.newFaculty"
                ] =
                    Boolean(
                        notifications.newFaculty
                    );
            }

            if (
                notifications.payment !==
                undefined
            ) {
                updateData[
                    "notifications.payment"
                ] =
                    Boolean(
                        notifications.payment
                    );
            }

            if (
                notifications.courseApproval !==
                undefined
            ) {
                updateData[
                    "notifications.courseApproval"
                ] =
                    Boolean(
                        notifications.courseApproval
                    );
            }
        }

        /*
        ---------------------------------------------
        UPDATE SETTINGS
        ---------------------------------------------
        */
        const settings =
            await AdminSettings.findOneAndUpdate(
                {
                    adminId: adminId,
                },
                {
                    $set: updateData,
                },
                {
                    returnDocument: "after",
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            );

        return res.status(200).json({
            success: true,
            message:
                "Settings saved successfully.",

            data: settings,
        });

    } catch (error) {
        console.error(
            "Update Admin Settings Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while saving settings.",
        });
    }
};