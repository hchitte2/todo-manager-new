import { useState, type ChangeEvent, type FormEvent } from "react";

type AuthMode = "signup" | "login";
type StatusKind = "idle" | "success" | "error";

interface AuthResponse {
  message: string;
  accessToken?: string;
}

interface Todo {
  id: string;
  listId: string;
  name: string;
  completed: boolean;
}

interface TodoList {
  id: string;
  name: string;
  todos: Todo[];
}

const initialForm = {
  email: "",
  password: "",
};

async function parseJson(response: Response): Promise<AuthResponse> {
  const data = (await response.json().catch(() => ({}))) as AuthResponse;

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data;
}

function getApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3002";

  return configuredBaseUrl.endsWith("/")
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl;
}

export function AuthApp() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [form, setForm] = useState(initialForm);
  const [statusText, setStatusText] = useState("Create an account or log in.");
  const [statusKind, setStatusKind] = useState<StatusKind>("idle");
  const [token, setToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [lists, setLists] = useState<TodoList[]>([]);
  const [listName, setListName] = useState("");
  const [todoDrafts, setTodoDrafts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoggedIn = token.length > 0;

  function setStatus(text: string, kind: StatusKind = "idle") {
    setStatusText(text);
    setStatusKind(kind);
  }

  async function loadLists(accessToken: string) {
    const response = await fetch(`${getApiBaseUrl()}/lists`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = (await response.json().catch(() => [])) as TodoList[] | AuthResponse;

    if (!response.ok || !Array.isArray(data)) {
      const message = Array.isArray(data) ? "Unable to load lists" : data.message;
      throw new Error(message ?? "Unable to load lists");
    }

    setLists(data);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}${mode === "signup" ? "/auth/signup" : "/auth/login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: mode === "login" ? "include" : "same-origin",
          body: JSON.stringify(form),
        },
      );
      const data = await parseJson(response);

      if (mode === "signup") {
        setStatus(`${data.message} Switch to login to continue.`, "success");
        setMode("login");
      } else {
        const accessToken = data.accessToken ?? "";
        setToken(accessToken);
        setUserEmail(form.email);
        await loadLists(accessToken);
        setStatus(data.message, "success");
      }
    } catch (error) {
      setToken("");
      setLists([]);
      setStatus(error instanceof Error ? error.message : "Something went wrong", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: listName }),
      });
      const data = await parseJson(response);
      const createdList = data as unknown as TodoList;

      setLists((current) => [...current, createdList]);
      setListName("");
      setStatus(`Created list "${createdList.name}".`, "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create list", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateTodo(listId: string) {
    const todoName = todoDrafts[listId] ?? "";
    setIsSubmitting(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/lists/${listId}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: todoName }),
      });
      const todo = (await parseJson(response)) as unknown as Todo;

      setLists((current) =>
        current.map((list) =>
          list.id === listId
            ? { ...list, todos: [...list.todos, todo] }
            : list,
        ),
      );
      setTodoDrafts((current) => ({ ...current, [listId]: "" }));
      setStatus(`Added todo "${todo.name}".`, "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create todo", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleTodo(listId: string, todoId: string) {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/lists/${listId}/todos/${todoId}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const updated = (await parseJson(response)) as unknown as Todo;

      setLists((current) =>
        current.map((list) =>
          list.id === listId
            ? {
                ...list,
                todos: list.todos.map((t) => (t.id === todoId ? updated : t)),
              }
            : list,
        ),
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update todo", "error");
    }
  }

  async function handleDeleteTodo(listId: string, todoId: string, todoName: string) {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/lists/${listId}/todos/${todoId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as AuthResponse;
        throw new Error(data.message ?? "Unable to delete todo");
      }

      setLists((current) =>
        current.map((list) =>
          list.id === listId
            ? { ...list, todos: list.todos.filter((t) => t.id !== todoId) }
            : list,
        ),
      );
      setStatus(`Deleted todo "${todoName}".`, "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete todo", "error");
    }
  }

  async function handleDeleteList(listId: string, listName: string) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/lists/${listId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as AuthResponse;
        throw new Error(data.message ?? "Unable to delete list");
      }

      setLists((current) => current.filter((l) => l.id !== listId));
      setStatus(`Deleted list "${listName}".`, "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete list", "error");
    }
  }

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      const data = await parseJson(response);

      setToken("");
      setUserEmail("");
      setLists([]);
      setListName("");
      setTodoDrafts({});
      setForm(initialForm);
      setMode("login");
      setStatus(data.message, "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to log out", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const completedCount = lists.reduce(
    (sum, l) => sum + l.todos.filter((t) => t.completed).length,
    0,
  );
  const totalCount = lists.reduce((sum, l) => sum + l.todos.length, 0);

  return (
    <div className={`app-root ${isLoggedIn ? "app-root--workspace" : ""}`}>
      <aside className="auth-panel">
        <p className="eyebrow">Todo Manager</p>
        <h1>Your tasks,<br />organised.</h1>

        {!isLoggedIn && (
          <>
            <p className="lede">
              Sign up or log in to start managing your todo lists.
            </p>

            <div className="mode-switch" role="tablist" aria-label="Authentication mode">
              <button
                aria-pressed={mode === "signup"}
                aria-label="Switch to sign up"
                className={mode === "signup" ? "switch-button active" : "switch-button"}
                onClick={() => setMode("signup")}
                type="button"
              >
                Sign up
              </button>
              <button
                aria-pressed={mode === "login"}
                aria-label="Switch to log in"
                className={mode === "login" ? "switch-button active" : "switch-button"}
                onClick={() => setMode("login")}
                type="button"
              >
                Log in
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>Email</span>
                <input
                  autoComplete="email"
                  name="email"
                  onChange={handleChange}
                  placeholder="you@example.com"
                  type="email"
                  value={form.email}
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  name="password"
                  onChange={handleChange}
                  placeholder="Enter a password"
                  type="password"
                  value={form.password}
                />
              </label>

              <button className="submit-button" disabled={isSubmitting} type="submit">
                {isSubmitting
                  ? "Submitting..."
                  : mode === "signup"
                    ? "Create account"
                    : "Log in"}
              </button>
            </form>
          </>
        )}

        {isLoggedIn && (
          <div className="user-info">
            <div className="user-avatar" aria-hidden="true">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <p className="user-email">{userEmail}</p>
            <div className="progress-summary">
              <span>{completedCount}/{totalCount} todos done</span>
              {totalCount > 0 && (
                <div className="progress-bar" role="progressbar"
                  aria-valuenow={completedCount}
                  aria-valuemin={0}
                  aria-valuemax={totalCount}>
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
                  />
                </div>
              )}
            </div>
            <button
              className="logout-button"
              disabled={isSubmitting}
              onClick={() => void handleLogout()}
              type="button"
            >
              Log out
            </button>
          </div>
        )}

        <div
          className={`status-box status-box--${statusKind}`}
          aria-live="polite"
          role="status"
        >
          <strong>Status</strong>
          <p>{statusText}</p>
        </div>
      </aside>

      {isLoggedIn && (
        <main className="workspace">
          <header className="workspace-topbar">
            <h2>Your lists</h2>
            <form className="create-list-form" onSubmit={handleCreateList}>
              <input
                aria-label="New list name"
                onChange={(e) => setListName(e.target.value)}
                placeholder="New list name…"
                type="text"
                value={listName}
              />
              <button className="submit-button" disabled={isSubmitting} type="submit">
                + Add list
              </button>
            </form>
          </header>

          {lists.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__icon" aria-hidden="true">📋</p>
              <p className="empty-state__text">No lists yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="list-grid">
              {lists.map((list) => {
                const done = list.todos.filter((t) => t.completed).length;
                const total = list.todos.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <article className="list-card" key={list.id}>
                    <div className="list-card__header">
                      <h3>{list.name}</h3>
                      <div className="list-card__meta">
                        <span className="list-card__count">{done}/{total}</span>
                        <button
                          aria-label={`Delete list ${list.name}`}
                          className="icon-button icon-button--danger"
                          onClick={() => void handleDeleteList(list.id, list.name)}
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {total > 0 && (
                      <div className="list-progress" role="progressbar"
                        aria-valuenow={done}
                        aria-valuemin={0}
                        aria-valuemax={total}>
                        <div className="list-progress__fill" style={{ width: `${pct}%` }} />
                      </div>
                    )}

                    <ul className="todo-list">
                      {list.todos.length > 0 ? (
                        list.todos.map((todo) => (
                          <li
                            key={todo.id}
                            className={`todo-item ${todo.completed ? "todo-item--done" : ""}`}
                          >
                            <label className="todo-item__label">
                              <input
                                type="checkbox"
                                className="todo-item__checkbox"
                                checked={todo.completed}
                                aria-label={`Mark "${todo.name}" as ${todo.completed ? "incomplete" : "complete"}`}
                                onChange={() => void handleToggleTodo(list.id, todo.id)}
                              />
                              <span className="todo-item__name">{todo.name}</span>
                            </label>
                            <button
                              aria-label={`Delete todo ${todo.name}`}
                              className="icon-button icon-button--danger"
                              onClick={() => void handleDeleteTodo(list.id, todo.id, todo.name)}
                              type="button"
                            >
                              ×
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="todo-empty">No items yet.</li>
                      )}
                    </ul>

                    <div className="add-todo-form">
                      <input
                        aria-label={`Add a todo to ${list.name}`}
                        onChange={(e) =>
                          setTodoDrafts((cur) => ({ ...cur, [list.id]: e.target.value }))
                        }
                        placeholder={`Add a todo to ${list.name}`}
                        type="text"
                        value={todoDrafts[list.id] ?? ""}
                      />
                      <button
                        className="submit-button"
                        disabled={isSubmitting}
                        onClick={() => void handleCreateTodo(list.id)}
                        type="button"
                      >
                        Add todo
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
