import jwt from "jsonwebtoken";
import type { NextFunction } from "express";

import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth";
import { JWT_SECRET } from "../services/userService";
import { createMockResponse } from "./helpers/mockResponse";

describe("authMiddleware", () => {
  it("attaches the user and calls next for a valid bearer token", () => {
    const token = jwt.sign(
      { id: "user-1", email: "valid@example.com" },
      JWT_SECRET,
      { expiresIn: "30s" },
    );
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as AuthenticatedRequest;
    const res = createMockResponse();
    const next: NextFunction = jest.fn();

    authMiddleware(req, res as never, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: "user-1", email: "valid@example.com" });
  });

  it("returns 401 when the authorization header is missing", () => {
    const req = {
      headers: {},
    } as AuthenticatedRequest;
    const res = createMockResponse();
    const next: NextFunction = jest.fn();

    authMiddleware(req, res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Missing authorization header" });
  });
});
