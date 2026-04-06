"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_SECRET = exports.JWT_SECRET = exports.refreshAccessToken = exports.verifyUser = exports.createUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const JWT_SECRET = "JWT_SECRET";
exports.JWT_SECRET = JWT_SECRET;
const REFRESH_TOKEN_SECRET = "REFRESH_TOKEN_SECRET";
exports.REFRESH_TOKEN_SECRET = REFRESH_TOKEN_SECRET;
const createUser = async (email, password) => {
    const hashedPassword = bcrypt_1.default.hashSync(password, 10);
    const existingUser = await (0, models_1.findUserByEmail)(email);
    if (existingUser) {
        throw new Error("User already exists");
    }
    return (0, models_1.insertUser)(email, hashedPassword);
};
exports.createUser = createUser;
const verifyUser = async (email, password) => {
    const user = await (0, models_1.findUserByEmail)(email);
    if (!user || !bcrypt_1.default.compareSync(password, user.password)) {
        throw new Error("Invalid credential");
    }
    const payload = { id: user.id, email: user.email };
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jsonwebtoken_1.default.sign(payload, REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
    return { accessToken, refreshToken };
};
exports.verifyUser = verifyUser;
const refreshAccessToken = (refreshToken) => {
    const payload = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
    return jsonwebtoken_1.default.sign({ id: payload.id, email: payload.email }, JWT_SECRET, {
        expiresIn: "1h",
    });
};
exports.refreshAccessToken = refreshAccessToken;
