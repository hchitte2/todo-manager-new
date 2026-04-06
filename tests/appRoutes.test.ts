import request from "supertest";

import app from "../app";
import { resetDatabase } from "../models";

describe("app routes", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("signs up and logs in a user", async () => {
    const signupResponse = await request(app)
      .post("/auth/signup")
      .send({ email: "route@example.com", password: "secret123" });

    expect(signupResponse.status).toBe(201);
    expect(signupResponse.body).toEqual({
      message: "User created successfully",
    });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: "route@example.com", password: "secret123" });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.message).toBe("Login successful");
    expect(loginResponse.body.accessToken).toBeTruthy();
    expect(loginResponse.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );
  });

  it("rejects protected list access without a bearer token", async () => {
    const response = await request(app).get("/lists");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Missing authorization header",
    });
  });

  it("creates a list with a valid access token", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "lists@example.com", password: "secret123" });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: "lists@example.com", password: "secret123" });
    const token = loginResponse.body.accessToken as string;

    const createResponse = await request(app)
      .post("/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Groceries" });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe("Groceries");
  });

  it("creates a todo under a list with a valid access token", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "todos@example.com", password: "secret123" });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: "todos@example.com", password: "secret123" });
    const token = loginResponse.body.accessToken as string;

    const listResponse = await request(app)
      .post("/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Weekend" });

    const todoResponse = await request(app)
      .post(`/lists/${listResponse.body.id as string}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Wash car" });

    const listsResponse = await request(app)
      .get("/lists")
      .set("Authorization", `Bearer ${token}`);

    expect(todoResponse.status).toBe(201);
    expect(todoResponse.body).toEqual(
      expect.objectContaining({
        listId: listResponse.body.id,
        name: "Wash car",
        completed: false,
      }),
    );
    expect(listsResponse.status).toBe(200);
    expect(listsResponse.body).toEqual([
      expect.objectContaining({
        id: listResponse.body.id,
        todos: [expect.objectContaining({ name: "Wash car" })],
      }),
    ]);
  });

  it("toggles a todo's completion via PATCH", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "toggle@example.com", password: "secret123" });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: "toggle@example.com", password: "secret123" });
    const token = loginResponse.body.accessToken as string;

    const listResponse = await request(app)
      .post("/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Work" });
    const listId = listResponse.body.id as string;

    const todoResponse = await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Write tests" });
    const todoId = todoResponse.body.id as string;

    const toggleResponse = await request(app)
      .patch(`/lists/${listId}/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body).toEqual(
      expect.objectContaining({ id: todoId, completed: true }),
    );

    const toggleBackResponse = await request(app)
      .patch(`/lists/${listId}/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(toggleBackResponse.status).toBe(200);
    expect(toggleBackResponse.body).toEqual(
      expect.objectContaining({ id: todoId, completed: false }),
    );
  });

  it("returns 404 when toggling a non-existent todo", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "toggle404@example.com", password: "secret123" });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: "toggle404@example.com", password: "secret123" });
    const token = loginResponse.body.accessToken as string;

    const listResponse = await request(app)
      .post("/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Empty" });

    const response = await request(app)
      .patch(`/lists/${listResponse.body.id as string}/todos/no-such-todo`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("deletes a todo via DELETE and it no longer appears in GET /lists", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "deletetodo@example.com", password: "secret123" });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: "deletetodo@example.com", password: "secret123" });
    const token = loginResponse.body.accessToken as string;

    const listResponse = await request(app)
      .post("/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Shopping" });
    const listId = listResponse.body.id as string;

    const todoResponse = await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Buy milk" });
    const todoId = todoResponse.body.id as string;

    const deleteResponse = await request(app)
      .delete(`/lists/${listId}/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);

    const listsResponse = await request(app)
      .get("/lists")
      .set("Authorization", `Bearer ${token}`);

    expect(listsResponse.body[0].todos).toHaveLength(0);
  });

  it("deletes a list via DELETE and it no longer appears in GET /lists", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "deletelist@example.com", password: "secret123" });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: "deletelist@example.com", password: "secret123" });
    const token = loginResponse.body.accessToken as string;

    const listResponse = await request(app)
      .post("/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Temporary" });
    const listId = listResponse.body.id as string;

    const deleteResponse = await request(app)
      .delete(`/lists/${listId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);

    const listsResponse = await request(app)
      .get("/lists")
      .set("Authorization", `Bearer ${token}`);

    expect(listsResponse.body).toHaveLength(0);
  });

  it("returns 404 when deleting a list that does not exist", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "delmissing@example.com", password: "secret123" });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: "delmissing@example.com", password: "secret123" });
    const token = loginResponse.body.accessToken as string;

    const response = await request(app)
      .delete("/lists/no-such-list")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "List not found" });
  });
});
