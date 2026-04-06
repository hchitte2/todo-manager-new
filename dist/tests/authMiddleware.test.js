"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middlewares/auth");
const userService_1 = require("../services/userService");
const mockResponse_1 = require("./helpers/mockResponse");
describe("authMiddleware", () => {
    it("attaches the user and calls next for a valid bearer token", () => {
        const token = jsonwebtoken_1.default.sign({ id: "user-1", email: "valid@example.com" }, userService_1.JWT_SECRET, { expiresIn: "30s" });
        const req = {
            headers: {
                authorization: `Bearer ${token}`,
            },
        };
        const res = (0, mockResponse_1.createMockResponse)();
        const next = jest.fn();
        (0, auth_1.authMiddleware)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toEqual({ id: "user-1", email: "valid@example.com" });
    });
    it("returns 401 when the authorization header is missing", () => {
        const req = {
            headers: {},
        };
        const res = (0, mockResponse_1.createMockResponse)();
        const next = jest.fn();
        (0, auth_1.authMiddleware)(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ message: "Missing authorization header" });
    });
});
