import jwt from "jsonwebtoken";

import { findUserByEmail, resetDatabase } from "../models";
import {
  createUser,
  JWT_SECRET,
  refreshAccessToken,
  REFRESH_TOKEN_SECRET,
  verifyUser,
} from "../services/userService";

describe("userService", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("stores a hashed password instead of the raw password", async () => {
    const user = await createUser("alice@example.com", "secret123");
    const savedUser = await findUserByEmail("alice@example.com");

    expect(savedUser).toBeDefined();
    expect(user.email).toBe("alice@example.com");
    expect(user.password).not.toBe("secret123");
  });

  it("returns signed access and refresh tokens for a valid user", async () => {
    await createUser("bob@example.com", "hunter2");

    const tokens = await verifyUser("bob@example.com", "hunter2");
    const accessPayload = jwt.verify(tokens.accessToken, JWT_SECRET) as {
      id: string;
      email: string;
    };
    const refreshPayload = jwt.verify(
      tokens.refreshToken,
      REFRESH_TOKEN_SECRET,
    ) as {
      id: string;
      email: string;
    };

    expect(accessPayload.email).toBe("bob@example.com");
    expect(refreshPayload.email).toBe("bob@example.com");
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
  });

  it("issues a fresh access token from a refresh token", async () => {
    const user = await createUser("carol@example.com", "pass1234");
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const newAccessToken = refreshAccessToken(refreshToken);
    const payload = jwt.verify(newAccessToken, JWT_SECRET) as {
      id: string;
      email: string;
    };

    expect(payload.id).toBe(user.id);
    expect(payload.email).toBe(user.email);
  });

  it("rejects invalid credentials", async () => {
    await createUser("dave@example.com", "right-password");

    await expect(
      verifyUser("dave@example.com", "wrong-password"),
    ).rejects.toThrow("Invalid credential");
  });
});
