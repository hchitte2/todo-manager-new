import type { Request } from "express";

import {
  createList,
  createTodo,
  deleteList,
  deleteTodo,
  getLists,
  toggleTodo,
  updateList,
} from "../controllers/lists";
import { createListRecord, createTodoRecord, getListsWithTodos, resetDatabase } from "../models";
import { createMockResponse } from "./helpers/mockResponse";

const USER_ID = "test-user-1";

/** Build a mock request with req.user set */
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    user: { id: USER_ID, email: "test@example.com" },
    ...overrides,
  } as unknown as Request;
}

describe("lists controller", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("returns 400 when the list name is missing", async () => {
    const req = mockReq({ body: {} });
    const res = createMockResponse();

    await createList(req, res as never);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "List name is required" });
    await expect(getListsWithTodos(USER_ID)).resolves.toHaveLength(0);
  });

  it("returns 404 when the target list does not exist", async () => {
    const req = mockReq({ body: { name: "Renamed" }, params: { id: "missing-id" } });
    const res = createMockResponse();

    await updateList(req, res as never);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "List not found" });
  });

  it("changes the list name when the list exists", async () => {
    const list = await createListRecord(USER_ID, "Original");
    const req = mockReq({ body: { name: "Updated" }, params: { id: list.id } });
    const res = createMockResponse();

    await updateList(req, res as never);
    const updatedLists = await getListsWithTodos(USER_ID);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: list.id, name: "Updated" });
    expect(updatedLists[0]?.name).toBe("Updated");
  });

  it("returns 400 when the todo name is missing", async () => {
    const list = await createListRecord(USER_ID, "Groceries");
    const req = mockReq({ body: {}, params: { id: list.id } });
    const res = createMockResponse();

    await createTodo(req, res as never);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "Todo name is required" });
  });

  it("toggles a todo to completed and returns 200", async () => {
    const list = await createListRecord(USER_ID, "Work");
    const todo = await createTodoRecord(list.id, "Finish report");
    const req = mockReq({ params: { id: list.id, todoId: todo.id } });
    const res = createMockResponse();

    await toggleTodo(req, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ id: todo.id, completed: true }),
    );
  });

  it("returns 404 when toggling a todo for a missing list", async () => {
    const req = mockReq({ params: { id: "no-list", todoId: "no-todo" } });
    const res = createMockResponse();

    await toggleTodo(req, res as never);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "List not found" });
  });

  it("returns 404 when toggling a todo that does not exist", async () => {
    const list = await createListRecord(USER_ID, "Work");
    const req = mockReq({ params: { id: list.id, todoId: "no-todo" } });
    const res = createMockResponse();

    await toggleTodo(req, res as never);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "Todo not found" });
  });

  it("deletes a todo and returns 204", async () => {
    const list = await createListRecord(USER_ID, "Shopping");
    const todo = await createTodoRecord(list.id, "Buy eggs");
    const req = mockReq({ params: { id: list.id, todoId: todo.id } });
    const res = createMockResponse();

    await deleteTodo(req, res as never);

    expect(res.statusCode).toBe(204);
  });

  it("returns 404 when deleting a todo that does not exist", async () => {
    const list = await createListRecord(USER_ID, "Shopping");
    const req = mockReq({ params: { id: list.id, todoId: "no-todo" } });
    const res = createMockResponse();

    await deleteTodo(req, res as never);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "Todo not found" });
  });

  it("deletes a list and returns 204", async () => {
    const list = await createListRecord(USER_ID, "Temporary");
    const req = mockReq({ params: { id: list.id } });
    const res = createMockResponse();

    await deleteList(req, res as never);

    expect(res.statusCode).toBe(204);
    await expect(getListsWithTodos(USER_ID)).resolves.toHaveLength(0);
  });

  it("returns 404 when deleting a list that does not exist", async () => {
    const req = mockReq({ params: { id: "no-list" } });
    const res = createMockResponse();

    await deleteList(req, res as never);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "List not found" });
  });

  it("getLists returns only the requesting user's lists", async () => {
    await createListRecord(USER_ID, "My list");
    await createListRecord("other-user", "Other list");

    const req = mockReq();
    const res = createMockResponse();

    await getLists(req, res as never);

    expect((res.body as { name: string }[]).map((l) => l.name)).toEqual(["My list"]);
  });
});
