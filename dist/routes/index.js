"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get("/", (req, res) => {
    void req;
    res.json({
        message: "Express API server is running",
        frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    });
});
exports.default = router;
