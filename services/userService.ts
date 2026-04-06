import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { findUserByEmail, insertUser, type User } from "../models";

const JWT_SECRET = "JWT_SECRET";
const REFRESH_TOKEN_SECRET = "REFRESH_TOKEN_SECRET";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface TokenPayload {
  id: string;
  email: string;
}

const createUser = async (email: string, password: string): Promise<User> => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("User already exists");
  }

  return insertUser(email, hashedPassword);
};

const verifyUser = async (email: string, password: string): Promise<AuthTokens> => {
  const user = await findUserByEmail(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new Error("Invalid credential");
  }

  const payload: TokenPayload = { id: user.id, email: user.email };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const refreshAccessToken = (refreshToken: string): string => {
  const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as TokenPayload;

  return jwt.sign({ id: payload.id, email: payload.email }, JWT_SECRET, {
    expiresIn: "1h",
  });
};

export {
  createUser,
  verifyUser,
  refreshAccessToken,
  JWT_SECRET,
  REFRESH_TOKEN_SECRET,
};
