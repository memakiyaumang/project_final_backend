import crypto from "crypto";

const adminSecretKey = crypto.randomBytes(32).toString("hex");

export default adminSecretKey;