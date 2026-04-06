import path from "node:path";
import { mkdir } from "node:fs/promises";
import crypto from "node:crypto";

import { open, type Database } from "sqlite";
import sqlite3 from "sqlite3";

export interface User {
  id: string;
  email: string;
  password: string;
}

export interface List {
  id: string;
  name: string;
}

export interface Todo {
  id: string;
  listId: string;
  name: string;
  completed: boolean;
}

export interface ListWithTodos extends List {
  todos: Todo[];
}

const defaultDatabasePath = path.join(process.cwd(), "data", "app.sqlite");
const databasePath = process.env.SQLITE_DB_PATH ?? defaultDatabasePath;

let databasePromise: Promise<Database<sqlite3.Database, sqlite3.Statement>> | null =
  null;

const getDb = async (): Promise<Database<sqlite3.Database, sqlite3.Statement>> => {
  if (!databasePromise) {
    databasePromise = initializeDatabase();
  }

  return databasePromise;
};

const initializeDatabase = async (): Promise<
  Database<sqlite3.Database, sqlite3.Statement>
> => {
  await mkdir(path.dirname(databasePath), { recursive: true });

  const db = await open({
    filename: databasePath,
    driver: sqlite3.Database,
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

const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const db = await getDb();

  const user = await db.get<User>(
    "SELECT id, email, password FROM users WHERE email = ?",
    email,
  );

  return user ?? undefined;
};

const insertUser = async (email: string, password: string): Promise<User> => {
  const db = await getDb();
  const user: User = {
    id: crypto.randomUUID(),
    email,
    password,
  };

  await db.run(
    "INSERT INTO users (id, email, password) VALUES (?, ?, ?)",
    user.id,
    user.email,
    user.password,
  );

  return user;
};

const getLists = async (userId: string): Promise<List[]> => {
  const db = await getDb();

  return db.all<List[]>(
    "SELECT id, name FROM lists WHERE user_id = ? ORDER BY rowid ASC",
    userId,
  );
};

const getTodosByListId = async (listId: string): Promise<Todo[]> => {
  const db = await getDb();
  const rows = await db.all<
    Array<{
      id: string;
      list_id: string;
      name: string;
      completed: number;
    }>
  >(
    `SELECT id, list_id, name, completed
     FROM todos
     WHERE list_id = ?
     ORDER BY rowid ASC`,
    listId,
  );

  return rows.map((row) => ({
    id: row.id,
    listId: row.list_id,
    name: row.name,
    completed: row.completed === 1,
  }));
};

const getListsWithTodos = async (userId: string): Promise<ListWithTodos[]> => {
  const lists = await getLists(userId);
  const todosByList = await Promise.all(
    lists.map(async (list) => ({
      ...list,
      todos: await getTodosByListId(list.id),
    })),
  );

  return todosByList;
};

const createListRecord = async (userId: string, name: string): Promise<List> => {
  const db = await getDb();
  const list: List = {
    id: crypto.randomUUID(),
    name,
  };

  await db.run(
    "INSERT INTO lists (id, user_id, name) VALUES (?, ?, ?)",
    list.id,
    userId,
    list.name,
  );

  return list;
};

const findListById = async (id: string): Promise<List | undefined> => {
  const db = await getDb();

  const list = await db.get<List>(
    "SELECT id, name FROM lists WHERE id = ?",
    id,
  );

  return list ?? undefined;
};

const updateListName = async (id: string, name: string): Promise<List | undefined> => {
  const db = await getDb();

  const result = await db.run("UPDATE lists SET name = ? WHERE id = ?", name, id);

  if (result.changes === 0) {
    return undefined;
  }

  return findListById(id);
};

const createTodoRecord = async (listId: string, name: string): Promise<Todo> => {
  const db = await getDb();
  const todo: Todo = {
    id: crypto.randomUUID(),
    listId,
    name,
    completed: false,
  };

  await db.run(
    "INSERT INTO todos (id, list_id, name, completed) VALUES (?, ?, ?, ?)",
    todo.id,
    todo.listId,
    todo.name,
    0,
  );

  return todo;
};

const toggleTodoCompletion = async (
  todoId: string,
): Promise<Todo | undefined> => {
  const db = await getDb();

  const row = await db.get<{
    id: string;
    list_id: string;
    name: string;
    completed: number;
  }>(
    "SELECT id, list_id, name, completed FROM todos WHERE id = ?",
    todoId,
  );

  if (!row) return undefined;

  const newCompleted = row.completed === 1 ? 0 : 1;
  await db.run(
    "UPDATE todos SET completed = ? WHERE id = ?",
    newCompleted,
    todoId,
  );

  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    completed: newCompleted === 1,
  };
};

const deleteTodoRecord = async (todoId: string): Promise<boolean> => {
  const db = await getDb();
  const result = await db.run("DELETE FROM todos WHERE id = ?", todoId);
  return (result.changes ?? 0) > 0;
};

const deleteListRecord = async (listId: string): Promise<boolean> => {
  const db = await getDb();
  const result = await db.run("DELETE FROM lists WHERE id = ?", listId);
  return (result.changes ?? 0) > 0;
};

const findTodoById = async (todoId: string): Promise<Todo | undefined> => {
  const db = await getDb();
  const row = await db.get<{
    id: string;
    list_id: string;
    name: string;
    completed: number;
  }>(
    "SELECT id, list_id, name, completed FROM todos WHERE id = ?",
    todoId,
  );

  if (!row) return undefined;

  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    completed: row.completed === 1,
  };
};

const resetDatabase = async (): Promise<void> => {
  const db = await getDb();

  await db.exec(`
    DELETE FROM todos;
    DELETE FROM lists;
    DELETE FROM users;
  `);
};

export {
  createListRecord,
  createTodoRecord,
  deleteListRecord,
  deleteTodoRecord,
  findListById,
  findTodoById,
  findUserByEmail,
  getDb,
  getLists,
  getListsWithTodos,
  getTodosByListId,
  insertUser,
  resetDatabase,
  toggleTodoCompletion,
  updateListName,
};
