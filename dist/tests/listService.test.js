"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const listService_1 = require("../services/listService");
const USER_ID = "test-user-1";
describe("listService", () => {
    beforeEach(async () => {
        await (0, models_1.resetDatabase)();
    });
    it("creates a list with trimmed whitespace", async () => {
        const list = await (0, listService_1.createList)(USER_ID, "  Groceries  ");
        expect(list.name).toBe("Groceries");
        await expect((0, listService_1.getLists)(USER_ID)).resolves.toEqual([
            expect.objectContaining({ id: list.id, name: "Groceries" }),
        ]);
    });
    it("rejects an empty list name", async () => {
        await expect((0, listService_1.createList)(USER_ID, "   ")).rejects.toThrow("List name is required");
    });
    it("updates an existing list with trimmed whitespace", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Original");
        const updatedList = await (0, listService_1.updateList)(list.id, "  Updated  ");
        expect(updatedList).toEqual({ id: list.id, name: "Updated" });
    });
    it("rejects updates for missing lists", async () => {
        await expect((0, listService_1.updateList)("missing-id", "Updated")).rejects.toThrow("List not found");
    });
    it("creates a todo under an existing list", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Groceries");
        const todo = await (0, listService_1.createTodo)(list.id, "  Buy milk  ");
        const lists = await (0, listService_1.getLists)(USER_ID);
        expect(todo).toEqual(expect.objectContaining({
            listId: list.id,
            name: "Buy milk",
            completed: false,
        }));
        expect(lists).toEqual([
            expect.objectContaining({
                id: list.id,
                name: "Groceries",
                todos: [expect.objectContaining({ name: "Buy milk" })],
            }),
        ]);
    });
    it("rejects todos for a missing list", async () => {
        await expect((0, listService_1.createTodo)("missing-id", "Buy milk")).rejects.toThrow("List not found");
    });
    it("toggles a todo from incomplete to complete", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Work");
        const todo = await (0, models_1.createTodoRecord)(list.id, "Write tests");
        expect(todo.completed).toBe(false);
        const toggled = await (0, listService_1.toggleTodo)(list.id, todo.id);
        expect(toggled.completed).toBe(true);
        expect(toggled.id).toBe(todo.id);
        expect(toggled.name).toBe("Write tests");
    });
    it("toggles a todo from complete back to incomplete", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Work");
        const todo = await (0, models_1.createTodoRecord)(list.id, "Write tests");
        await (0, listService_1.toggleTodo)(list.id, todo.id);
        const toggled = await (0, listService_1.toggleTodo)(list.id, todo.id);
        expect(toggled.completed).toBe(false);
    });
    it("rejects toggling a todo for a missing list", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Work");
        const todo = await (0, models_1.createTodoRecord)(list.id, "Task");
        await expect((0, listService_1.toggleTodo)("missing-list", todo.id)).rejects.toThrow("List not found");
    });
    it("rejects toggling a todo that does not exist", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Work");
        await expect((0, listService_1.toggleTodo)(list.id, "missing-todo")).rejects.toThrow("Todo not found");
    });
    it("rejects toggling a todo that belongs to a different list", async () => {
        const listA = await (0, models_1.createListRecord)(USER_ID, "List A");
        const listB = await (0, models_1.createListRecord)(USER_ID, "List B");
        const todo = await (0, models_1.createTodoRecord)(listA.id, "Task");
        await expect((0, listService_1.toggleTodo)(listB.id, todo.id)).rejects.toThrow("Todo not found");
    });
    it("deletes a todo from a list", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Shopping");
        const todo = await (0, models_1.createTodoRecord)(list.id, "Buy eggs");
        await (0, listService_1.deleteTodo)(list.id, todo.id);
        const lists = await (0, listService_1.getLists)(USER_ID);
        expect(lists[0]?.todos).toHaveLength(0);
    });
    it("rejects deleting a todo for a missing list", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Shopping");
        const todo = await (0, models_1.createTodoRecord)(list.id, "Buy eggs");
        await expect((0, listService_1.deleteTodo)("missing-list", todo.id)).rejects.toThrow("List not found");
    });
    it("rejects deleting a todo that does not exist", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Shopping");
        await expect((0, listService_1.deleteTodo)(list.id, "missing-todo")).rejects.toThrow("Todo not found");
    });
    it("deletes a list and removes it from the lists array", async () => {
        const list = await (0, models_1.createListRecord)(USER_ID, "Temporary");
        await (0, models_1.createTodoRecord)(list.id, "Some task");
        await (0, listService_1.deleteList)(list.id);
        const lists = await (0, listService_1.getLists)(USER_ID);
        expect(lists).toHaveLength(0);
    });
    it("rejects deleting a list that does not exist", async () => {
        await expect((0, listService_1.deleteList)("missing-id")).rejects.toThrow("List not found");
    });
});
