import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
    {
        /*
        =============================================
        ADMIN REFERENCE
        =============================================
        */
        adminId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        /*
        =============================================
        PROFILE SETTINGS
        =============================================
        */
        profile: {
            name: {
                type: String,
                default: "Admin",
                trim: true,
            },

            email: {
                type: String,
                default: "",
                trim: true,
                lowercase: true,
            },
        },

        /*
        =============================================
        PLATFORM SETTINGS
        =============================================
        */
        platform: {
            platformName: {
                type: String,
                default: "Online Learning Platform",
                trim: true,
            },

            supportEmail: {
                type: String,
                default: "support@example.com",
                trim: true,
                lowercase: true,
            },

            supportPhone: {
                type: String,
                default: "",
                trim: true,
            },
        },

        /*
        =============================================
        NOTIFICATION SETTINGS
        =============================================
        */
        notifications: {
            newStudent: {
                type: Boolean,
                default: true,
            },

            newFaculty: {
                type: Boolean,
                default: true,
            },

            payment: {
                type: Boolean,
                default: true,
            },

            courseApproval: {
                type: Boolean,
                default: true,
            },
        },
    },
    {
        timestamps: true,
    }
);


/*
=====================================================
ADMIN SETTINGS MODEL
=====================================================
*/

const AdminSettings =
    mongoose.models.AdminSettings ||
    mongoose.model(
        "AdminSettings",
        adminSettingsSchema
    );


export default AdminSettings;