"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateList = exports.toggleTodo = exports.getLists = exports.deleteTodo = exports.deleteList = exports.createTodo = exports.createList = void 0;
const models_1 = require("../models");
const getLists = async (userId) => {
    return (0, models_1.getListsWithTodos)(userId);
};
exports.getLists = getLists;
const createList = async (userId, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error("List name is required");
    }
    const list = await (0, models_1.createListRecord)(userId, trimmedName);
    return {
        ...list,
        todos: [],
    };
};
exports.createList = createList;
const updateList = async (id, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error("List name is required");
    }
    const existingList = await (0, models_1.findListById)(id);
    if (!existingList) {
        throw new Error("List not found");
    }
    const updatedList = await (0, models_1.updateListName)(id, trimmedName);
    if (!updatedList) {
        throw new Error("List not found");
    }
    return updatedList;
};
exports.updateList = updateList;
const createTodo = async (listId, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error("Todo name is required");
    }
    const existingList = await (0, models_1.findListById)(listId);
    if (!existingList) {
        throw new Error("List not found");
    }
    return (0, models_1.createTodoRecord)(listId, trimmedName);
};
exports.createTodo = createTodo;
const toggleTodo = async (listId, todoId) => {
    const list = await (0, models_1.findListById)(listId);
    if (!list) {
        throw new Error("List not found");
    }
    const todo = await (0, models_1.findTodoById)(todoId);
    if (!todo) {
        throw new Error("Todo not found");
    }
    if (todo.listId !== listId) {
        throw new Error("Todo not found");
    }
    const updated = await (0, models_1.toggleTodoCompletion)(todoId);
    if (!updated) {
        throw new Error("Todo not found");
    }
    return updated;
};
exports.toggleTodo = toggleTodo;
const deleteTodo = async (listId, todoId) => {
    const list = await (0, models_1.findListById)(listId);
    if (!list) {
        throw new Error("List not found");
    }
    const todo = await (0, models_1.findTodoById)(todoId);
    if (!todo || todo.listId !== listId) {
        throw new Error("Todo not found");
    }
    await (0, models_1.deleteTodoRecord)(todoId);
};
exports.deleteTodo = deleteTodo;
const deleteList = async (listId) => {
    const list = await (0, models_1.findListById)(listId);
    if (!list) {
        throw new Error("List not found");
    }
    await (0, models_1.deleteListRecord)(listId);
};
exports.deleteList = deleteList;
