"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const userService_1 = require("../services/userService");
describe("userService", () => {
    beforeEach(async () => {
        await (0, models_1.resetDatabase)();
    });
    it("stores a hashed password instead of the raw password", async () => {
        const user = await (0, userService_1.createUser)("alice@example.com", "secret123");
        const savedUser = await (0, models_1.findUserByEmail)("alice@example.com");
        expect(savedUser).toBeDefined();
        expect(user.email).toBe("alice@example.com");
        expect(user.password).not.toBe("secret123");
    });
    it("returns signed access and refresh tokens for a valid user", async () => {
        await (0, userService_1.createUser)("bob@example.com", "hunter2");
        const tokens = await (0, userService_1.verifyUser)("bob@example.com", "hunter2");
        const accessPayload = jsonwebtoken_1.default.verify(tokens.accessToken, userService_1.JWT_SECRET);
        const refreshPayload = jsonwebtoken_1.default.verify(tokens.refreshToken, userService_1.REFRESH_TOKEN_SECRET);
        expect(accessPayload.email).toBe("bob@example.com");
        expect(refreshPayload.email).toBe("bob@example.com");
        expect(tokens.accessToken).toBeTruthy();
        expect(tokens.refreshToken).toBeTruthy();
    });
    it("issues a fresh access token from a refresh token", async () => {
        const user = await (0, userService_1.createUser)("carol@example.com", "pass1234");
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, userService_1.REFRESH_TOKEN_SECRET, {
            expiresIn: "7d",
        });
        const newAccessToken = (0, userService_1.refreshAccessToken)(refreshToken);
        const payload = jsonwebtoken_1.default.verify(newAccessToken, userService_1.JWT_SECRET);
        expect(payload.id).toBe(user.id);
        expect(payload.email).toBe(user.email);
    });
    it("rejects invalid credentials", async () => {
        await (0, userService_1.createUser)("dave@example.com", "right-password");
        await expect((0, userService_1.verifyUser)("dave@example.com", "wrong-password")).rejects.toThrow("Invalid credential");
    });
});
