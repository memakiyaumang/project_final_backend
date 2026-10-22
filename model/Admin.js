import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            default: "Admin",
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            default: "admin",
            enum: ["admin"],
        },

        status: {
            type: String,
            default: "active",
            enum: ["active", "inactive"],
        },
    },
    {
        timestamps: true,
    }
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
