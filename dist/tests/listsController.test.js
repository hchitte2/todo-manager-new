"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lists_1 = require("../controllers/lists");
const models_1 = require("../models");
const mockResponse_1 = require("./helpers/mockResponse");
const USER_ID = "test-user-1";
/** Build a mock request with req.user set */
function mockReq(overrides = {}) {
    return {
        body: {},
        params: {},
        user: { id: USER_ID, email: "test@example.com" },
        ...overrides,
    };
}
describe("lists controller", () => {
    beforeEach(async () => {
        await (0, models_1.resetDatabase)();
    });
    it("returns 400 when the list name is missing", async () => {
        const req = mockReq({ body: {} });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.createList)(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ message: "List name is required" });
        await expect((0, models_1.getListsWithTodos)(USER_ID)).resolves.toHaveLength(0);
    });
    it("returns 404 when the target list does not exist", async () => {
        const req = mockReq({ body: { name: "Renamed" }, params: { id: "missing-id" } });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.updateList)(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ message: "List not found" });
    });
    it("changes the list name when the list exists", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Original");
        const req = mockReq({ body: { name: "Updated" }, params: { id: list.id } });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.updateList)(req, res);
        const updatedLists = await (0, models_1.getListsWithTodos)(USER_ID);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ id: list.id, name: "Updated" });
        expect(updatedLists[0]?.name).toBe("Updated");
    });
    it("returns 400 when the todo name is missing", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Groceries");
        const req = mockReq({ body: {}, params: { id: list.id } });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.createTodo)(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ message: "Todo name is required" });
    });
    it("toggles a todo to completed and returns 200", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Work");
        const todo = await (0, models_1.createTodoRecord)(list.id, "Finish report");
        const req = mockReq({ params: { id: list.id, todoId: todo.id } });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.toggleTodo)(req, res);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(expect.objectContaining({ id: todo.id, completed: true }));
    });
    it("returns 404 when toggling a todo for a missing list", async () => {
        const req = mockReq({ params: { id: "no-list", todoId: "no-todo" } });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.toggleTodo)(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ message: "List not found" });
    });
    it("returns 404 when toggling a todo that does not exist", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Work");
        const req = mockReq({ params: { id: list.id, todoId: "no-todo" } });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.toggleTodo)(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ message: "Todo not found" });
    });
    it("deletes a todo and returns 204", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Shopping");
        const todo = await (0, models_1.createTodoRecord)(list.id, "Buy eggs");
        const req = mockReq({ params: { id: list.id, todoId: todo.id } });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.deleteTodo)(req, res);
        expect(res.statusCode).toBe(204);
    });
    it("returns 404 when deleting a todo that does not exist", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Shopping");
        const req = mockReq({ params: { id: list.id, todoId: "no-todo" } });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.deleteTodo)(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ message: "Todo not found" });
    });
    it("deletes a list and returns 204", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Temporary");
        const req = mockReq({ params: { id: list.id } });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.deleteList)(req, res);
        expect(res.statusCode).toBe(204);
        await expect((0, models_1.getListsWithTodos)(USER_ID)).resolves.toHaveLength(0);
    });
    it("returns 404 when deleting a list that does not exist", async () => {
        const req = mockReq({ params: { id: "no-list" } });
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.deleteList)(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ message: "List not found" });
    });
    it("getLists returns only the requesting user's lists", async () => {
        await (0, models_1.createListRecord)(USER_ID, "My list");
        await (0, models_1.createListRecord)("other-user", "Other list");
        const req = mockReq();
        const res = (0, mockResponse_1.createMockResponse)();
        await (0, lists_1.getLists)(req, res);
        expect(res.body.map((l) => l.name)).toEqual(["My list"]);
    });
});
