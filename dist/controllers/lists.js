"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteList = exports.deleteTodo = exports.toggleTodo = exports.createTodo = exports.updateList = exports.createList = exports.getLists = void 0;
const listService = __importStar(require("../services/listService"));
const getLists = async (req, res) => {
    const userId = req.user.id;
    const lists = await listService.getLists(userId);
    res.json(lists);
};
exports.getLists = getLists;
const createList = async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;
    if (!name) {
        res.status(400).json({ message: "List name is required" });
        return;
    }
    try {
        const newList = await listService.createList(userId, name);
        res.status(201).json(newList);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create list";
        const status = message === "List name is required" ? 400 : 500;
        res.status(status).json({ message });
    }
};
exports.createList = createList;
const updateList = async (req, res) => {
    const { name } = req.body;
    const listId = String(req.params.id);
    if (!name) {
        res.status(400).json({ message: "List name is required" });
        return;
    }
    try {
        const updatedList = await listService.updateList(listId, name);
        res.json(updatedList);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update list";
        const status = message === "List name is required"
            ? 400
            : message === "List not found"
                ? 404
                : 500;
        res.status(status).json({ message });
    }
};
exports.updateList = updateList;
const createTodo = async (req, res) => {
    const { name } = req.body;
    const listId = String(req.params.id);
    if (!name) {
        res.status(400).json({ message: "Todo name is required" });
        return;
    }
    try {
        const todo = await listService.createTodo(listId, name);
        res.status(201).json(todo);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create todo";
        const status = message === "Todo name is required"
            ? 400
            : message === "List not found"
                ? 404
                : 500;
        res.status(status).json({ message });
    }
};
exports.createTodo = createTodo;
const toggleTodo = async (req, res) => {
    const listId = String(req.params.id);
    const todoId = String(req.params.todoId);
    try {
        const todo = await listService.toggleTodo(listId, todoId);
        res.json(todo);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update todo";
        const status = message === "List not found" || message === "Todo not found" ? 404 : 500;
        res.status(status).json({ message });
    }
};
exports.toggleTodo = toggleTodo;
const deleteTodo = async (req, res) => {
    const listId = String(req.params.id);
    const todoId = String(req.params.todoId);
    try {
        await listService.deleteTodo(listId, todoId);
        res.status(204).send();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to delete todo";
        const status = message === "List not found" || message === "Todo not found" ? 404 : 500;
        res.status(status).json({ message });
    }
};
exports.deleteTodo = deleteTodo;
const deleteList = async (req, res) => {
    const listId = String(req.params.id);
    try {
        await listService.deleteList(listId);
        res.status(204).send();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to delete list";
        const status = message === "List not found" ? 404 : 500;
        res.status(status).json({ message });
    }
};
exports.deleteList = deleteList;
