import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../middlewares/auth";
import * as listService from "../services/listService";

const getLists = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user!.id;
  const lists = await listService.getLists(userId);
  res.json(lists);
};

const createList = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name?: string };
  const userId = (req as AuthenticatedRequest).user!.id;

  if (!name) {
    res.status(400).json({ message: "List name is required" });
    return;
  }

  try {
    const newList = await listService.createList(userId, name);
    res.status(201).json(newList);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create list";
    const status = message === "List name is required" ? 400 : 500;
    res.status(status).json({ message });
  }
};

const updateList = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name?: string };
  const listId = String(req.params.id);

  if (!name) {
    res.status(400).json({ message: "List name is required" });
    return;
  }

  try {
    const updatedList = await listService.updateList(listId, name);
    res.json(updatedList);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update list";
    const status =
      message === "List name is required"
        ? 400
        : message === "List not found"
          ? 404
          : 500;
    res.status(status).json({ message });
  }
};

const createTodo = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name?: string };
  const listId = String(req.params.id);

  if (!name) {
    res.status(400).json({ message: "Todo name is required" });
    return;
  }

  try {
    const todo = await listService.createTodo(listId, name);
    res.status(201).json(todo);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create todo";
    const status =
      message === "Todo name is required"
        ? 400
        : message === "List not found"
          ? 404
          : 500;
    res.status(status).json({ message });
  }
};

const toggleTodo = async (req: Request, res: Response): Promise<void> => {
  const listId = String(req.params.id);
  const todoId = String(req.params.todoId);

  try {
    const todo = await listService.toggleTodo(listId, todoId);
    res.json(todo);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update todo";
    const status =
      message === "List not found" || message === "Todo not found" ? 404 : 500;
    res.status(status).json({ message });
  }
};

const deleteTodo = async (req: Request, res: Response): Promise<void> => {
  const listId = String(req.params.id);
  const todoId = String(req.params.todoId);

  try {
    await listService.deleteTodo(listId, todoId);
    res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete todo";
    const status =
      message === "List not found" || message === "Todo not found" ? 404 : 500;
    res.status(status).json({ message });
  }
};

const deleteList = async (req: Request, res: Response): Promise<void> => {
  const listId = String(req.params.id);

  try {
    await listService.deleteList(listId);
    res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete list";
    const status = message === "List not found" ? 404 : 500;
    res.status(status).json({ message });
  }
};

export { getLists, createList, updateList, createTodo, toggleTodo, deleteTodo, deleteList };
