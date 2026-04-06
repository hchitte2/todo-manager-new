import type { Request, Response } from "express";

import * as userService from "../services/userService";

const signup = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    await userService.createUser(email, password);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create user";
    const status = message === "User already exists" ? 400 : 500;
    res.status(status).json({ message });
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    const { accessToken, refreshToken } = await userService.verifyUser(
      email,
      password,
    );

    res.cookie("refreshToken", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
    });

    res.status(200).json({ message: "Login successful", accessToken });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to log in";
    const status = message === "Invalid credential" ? 401 : 500;
    res.status(status).json({ message });
  }
};

const refresh = (req: Request, res: Response): void => {
  const refreshToken = req.cookies.refreshToken as string | undefined;

  if (!refreshToken) {
    res.status(401).json({ message: "No refresh token" });
    return;
  }

  try {
    const accessToken = userService.refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid refresh token";
    res.status(401).json({ message });
  }
};

export { signup, login, refresh };
