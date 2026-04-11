// For iOS simulator / device on same WiFi, use your Mac's LAN IP
// e.g. http://192.168.1.x:3002
export const API_BASE_URL = "http://192.168.1.225:3002";

export interface Todo {
  id: string;
  listId: string;
  name: string;
  completed: boolean;
}

export interface TodoList {
  id: string;
  name: string;
  todos: Todo[];
}

interface ApiError {
  message?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = data as ApiError;
    throw new Error(err.message ?? "Request failed");
  }
  return data as T;
}

export async function apiSignup(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResponse<{ message: string }>(response);
  return data.message;
}

export async function apiLogin(email: string, password: string): Promise<{ accessToken: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse<{ accessToken: string }>(response);
}

export async function apiLogout(token: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiGetLists(token: string): Promise<TodoList[]> {
  const response = await fetch(`${API_BASE_URL}/lists`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<TodoList[]>(response);
}

export async function apiCreateList(token: string, name: string): Promise<TodoList> {
  const response = await fetch(`${API_BASE_URL}/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
  return parseResponse<TodoList>(response);
}

export async function apiDeleteList(token: string, listId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/lists/${listId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(data.message ?? "Unable to delete list");
  }
}

export async function apiCreateTodo(token: string, listId: string, name: string): Promise<Todo> {
  const response = await fetch(`${API_BASE_URL}/lists/${listId}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
  return parseResponse<Todo>(response);
}

export async function apiToggleTodo(token: string, listId: string, todoId: string): Promise<Todo> {
  const response = await fetch(`${API_BASE_URL}/lists/${listId}/todos/${todoId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<Todo>(response);
}

export async function apiDeleteTodo(token: string, listId: string, todoId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/lists/${listId}/todos/${todoId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(data.message ?? "Unable to delete todo");
  }
}
