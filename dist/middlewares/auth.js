"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userService_1 = require("../services/userService");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: "Missing authorization header" });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Missing bearer token" });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, userService_1.JWT_SECRET);
        req.user = { id: payload.id, email: payload.email };
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid token" });
    }
}
