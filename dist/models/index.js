"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateListName = exports.toggleTodoCompletion = exports.resetDatabase = exports.insertUser = exports.getTodosByListId = exports.getListsWithTodos = exports.getLists = exports.getDb = exports.findUserByEmail = exports.findTodoById = exports.findListById = exports.deleteTodoRecord = exports.deleteListRecord = exports.createTodoRecord = exports.createListRecord = void 0;
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = require("node:fs/promises");
const node_crypto_1 = __importDefault(require("node:crypto"));
const sqlite_1 = require("sqlite");
const sqlite3_1 = __importDefault(require("sqlite3"));
const defaultDatabasePath = node_path_1.default.join(process.cwd(), "data", "app.sqlite");
const databasePath = process.env.SQLITE_DB_PATH ?? defaultDatabasePath;
let databasePromise = null;
const getDb = async () => {
    if (!databasePromise) {
        databasePromise = initializeDatabase();
    }
    return databasePromise;
};
exports.getDb = getDb;
const initializeDatabase = async () => {
    await (0, promises_1.mkdir)(node_path_1.default.dirname(databasePath), { recursive: true });
    const db = await (0, sqlite_1.open)({
        filename: databasePath,
        driver: sqlite3_1.default.Database,
    });
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      name TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );
  `);
    return db;
};
const findUserByEmail = async (email) => {
    const db = await getDb();
    const user = await db.get("SELECT id, email, password FROM users WHERE email = ?", email);
    return user ?? undefined;
};
exports.findUserByEmail = findUserByEmail;
const insertUser = async (email, password) => {
    const db = await getDb();
    const user = {
        id: node_crypto_1.default.randomUUID(),
        email,
        password,
    };
    await db.run("INSERT INTO users (id, email, password) VALUES (?, ?, ?)", user.id, user.email, user.password);
    return user;
};
exports.insertUser = insertUser;
const getLists = async (userId) => {
    const db = await getDb();
    return db.all("SELECT id, name FROM lists WHERE user_id = ? ORDER BY rowid ASC", userId);
};
exports.getLists = getLists;
const getTodosByListId = async (listId) => {
    const db = await getDb();
    const rows = await db.all(`SELECT id, list_id, name, completed
     FROM todos
     WHERE list_id = ?
     ORDER BY rowid ASC`, listId);
    return rows.map((row) => ({
        id: row.id,
        listId: row.list_id,
        name: row.name,
        completed: row.completed === 1,
    }));
};
exports.getTodosByListId = getTodosByListId;
const getListsWithTodos = async (userId) => {
    const lists = await getLists(userId);
    const todosByList = await Promise.all(lists.map(async (list) => ({
        ...list,
        todos: await getTodosByListId(list.id),
    })));
    return todosByList;
};
exports.getListsWithTodos = getListsWithTodos;
const createListRecord = async (userId, name) => {
    const db = await getDb();
    const list = {
        id: node_crypto_1.default.randomUUID(),
        name,
    };
    await db.run("INSERT INTO lists (id, user_id, name) VALUES (?, ?, ?)", list.id, userId, list.name);
    return list;
};
exports.createListRecord = createListRecord;
const findListById = async (id) => {
    const db = await getDb();
    const list = await db.get("SELECT id, name FROM lists WHERE id = ?", id);
    return list ?? undefined;
};
exports.findListById = findListById;
const updateListName = async (id, name) => {
    const db = await getDb();
    const result = await db.run("UPDATE lists SET name = ? WHERE id = ?", name, id);
    if (result.changes === 0) {
        return undefined;
    }
    return findListById(id);
};
exports.updateListName = updateListName;
const createTodoRecord = async (listId, name) => {
    const db = await getDb();
    const todo = {
        id: node_crypto_1.default.randomUUID(),
        listId,
        name,
        completed: false,
    };
    await db.run("INSERT INTO todos (id, list_id, name, completed) VALUES (?, ?, ?, ?)", todo.id, todo.listId, todo.name, 0);
    return todo;
};
exports.createTodoRecord = createTodoRecord;
const toggleTodoCompletion = async (todoId) => {
    const db = await getDb();
    const row = await db.get("SELECT id, list_id, name, completed FROM todos WHERE id = ?", todoId);
    if (!row)
        return undefined;
    const newCompleted = row.completed === 1 ? 0 : 1;
    await db.run("UPDATE todos SET completed = ? WHERE id = ?", newCompleted, todoId);
    return {
        id: row.id,
        listId: row.list_id,
        name: row.name,
        completed: newCompleted === 1,
    };
};
exports.toggleTodoCompletion = toggleTodoCompletion;
const deleteTodoRecord = async (todoId) => {
    const db = await getDb();
    const result = await db.run("DELETE FROM todos WHERE id = ?", todoId);
    return (result.changes ?? 0) > 0;
};
exports.deleteTodoRecord = deleteTodoRecord;
const deleteListRecord = async (listId) => {
    const db = await getDb();
    const result = await db.run("DELETE FROM lists WHERE id = ?", listId);
    return (result.changes ?? 0) > 0;
};
exports.deleteListRecord = deleteListRecord;
const findTodoById = async (todoId) => {
    const db = await getDb();
    const row = await db.get("SELECT id, list_id, name, completed FROM todos WHERE id = ?", todoId);
    if (!row)
        return undefined;
    return {
        id: row.id,
        listId: row.list_id,
        name: row.name,
        completed: row.completed === 1,
    };
};
exports.findTodoById = findTodoById;
const resetDatabase = async () => {
    const db = await getDb();
    await db.exec(`
    DELETE FROM todos;
    DELETE FROM lists;
    DELETE FROM users;
  `);
};
exports.resetDatabase = resetDatabase;
