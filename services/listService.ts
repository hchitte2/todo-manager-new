import {
  createListRecord,
  createTodoRecord,
  deleteListRecord,
  deleteTodoRecord,
  findListById,
  findTodoById,
  getListsWithTodos as getAllListsWithTodos,
  toggleTodoCompletion,
  type List,
  type ListWithTodos,
  type Todo,
  updateListName,
} from "../models";

const getLists = async (userId: string): Promise<ListWithTodos[]> => {
  return getAllListsWithTodos(userId);
};

const createList = async (userId: string, name: string): Promise<ListWithTodos> => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("List name is required");
  }

  const list = await createListRecord(userId, trimmedName);

  return {
    ...list,
    todos: [],
  };
};

const updateList = async (id: string, name: string): Promise<List> => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("List name is required");
  }

  const existingList = await findListById(id);

  if (!existingList) {
    throw new Error("List not found");
  }

  const updatedList = await updateListName(id, trimmedName);

  if (!updatedList) {
    throw new Error("List not found");
  }

  return updatedList;
};

const createTodo = async (listId: string, name: string): Promise<Todo> => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Todo name is required");
  }

  const existingList = await findListById(listId);

  if (!existingList) {
    throw new Error("List not found");
  }

  return createTodoRecord(listId, trimmedName);
};

const toggleTodo = async (listId: string, todoId: string): Promise<Todo> => {
  const list = await findListById(listId);

  if (!list) {
    throw new Error("List not found");
  }

  const todo = await findTodoById(todoId);

  if (!todo) {
    throw new Error("Todo not found");
  }

  if (todo.listId !== listId) {
    throw new Error("Todo not found");
  }

  const updated = await toggleTodoCompletion(todoId);

  if (!updated) {
    throw new Error("Todo not found");
  }

  return updated;
};

const deleteTodo = async (listId: string, todoId: string): Promise<void> => {
  const list = await findListById(listId);

  if (!list) {
    throw new Error("List not found");
  }

  const todo = await findTodoById(todoId);

  if (!todo || todo.listId !== listId) {
    throw new Error("Todo not found");
  }

  await deleteTodoRecord(todoId);
};

const deleteList = async (listId: string): Promise<void> => {
  const list = await findListById(listId);

  if (!list) {
    throw new Error("List not found");
  }

  await deleteListRecord(listId);
};

export { createList, createTodo, deleteList, deleteTodo, getLists, toggleTodo, updateList };
