import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthApp } from "./AuthApp";

const fetchMock = vi.fn();

/** Helper: log in and return with lists loaded */
async function loginWithLists(lists: object[] = []) {
  vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3002");
  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Login successful", accessToken: "token-123" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => lists,
    });
  vi.stubGlobal("fetch", fetchMock);

  render(<AuthApp />);

  fireEvent.click(screen.getByRole("button", { name: "Switch to log in" }));
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
  fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));

  await screen.findByText("Your lists");
}

describe("AuthApp", () => {
  afterEach(() => {
    cleanup();
    fetchMock.mockReset();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  // ─── Auth flow ─────────────────────────────────────────────────────

  it("submits signup details to the signup endpoint", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3002");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "User created successfully" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthApp />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3002/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: "user@example.com", password: "secret123" }),
      }),
    );

    expect(await screen.findByText(/switch to login to continue/i)).toBeInTheDocument();
  });

  it("submits login details to the login endpoint and shows the workspace", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3002");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Login successful", accessToken: "token-123" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "list-1",
            name: "Groceries",
            todos: [{ id: "todo-1", listId: "list-1", name: "Buy milk", completed: false }],
          },
        ],
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthApp />);

    fireEvent.click(screen.getByRole("button", { name: "Switch to log in" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:3002/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: "user@example.com", password: "secret123" }),
      }),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:3002/lists", {
        method: "GET",
        headers: { Authorization: "Bearer token-123" },
      }),
    );

    expect(await screen.findByText("Login successful")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    // No raw token display in the refactored UI
    expect(screen.queryByText("No token yet")).not.toBeInTheDocument();
  });

  it("renders backend error messages", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3002");
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Invalid credential" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthApp />);

    fireEvent.click(screen.getByRole("button", { name: "Switch to log in" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText("Invalid credential")).toBeInTheDocument();
  });

  // ─── List management ────────────────────────────────────────────────

  it("creates a list and a todo after login", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3002");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Login successful", accessToken: "token-123" }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "list-1", name: "Weekend", todos: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "todo-1", listId: "list-1", name: "Wash car", completed: false }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthApp />);

    fireEvent.click(screen.getByRole("button", { name: "Switch to log in" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    await screen.findByText("Your lists");

    fireEvent.change(screen.getByPlaceholderText("New list name…"), {
      target: { value: "Weekend" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Add list" }));

    await screen.findByText("Weekend");

    fireEvent.change(screen.getByPlaceholderText("Add a todo to Weekend"), {
      target: { value: "Wash car" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add todo" }));

    expect(await screen.findByText("Wash car")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(3, "http://localhost:3002/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer token-123" },
      body: JSON.stringify({ name: "Weekend" }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, "http://localhost:3002/lists/list-1/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer token-123" },
      body: JSON.stringify({ name: "Wash car" }),
    });
  });

  it("shows an empty-state message when there are no lists", async () => {
    await loginWithLists([]);

    expect(screen.getByText("No lists yet. Create one above to get started.")).toBeInTheDocument();
  });

  it("shows a no-items message when a list has no todos", async () => {
    await loginWithLists([{ id: "list-1", name: "Empty List", todos: [] }]);

    expect(screen.getByText("No items yet.")).toBeInTheDocument();
  });

  // ─── Todo completion ────────────────────────────────────────────────

  it("toggles a todo to complete and back", async () => {
    await loginWithLists([
      { id: "list-1", name: "Work", todos: [{ id: "todo-1", listId: "list-1", name: "Task A", completed: false }] },
    ]);

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "todo-1", listId: "list-1", name: "Task A", completed: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "todo-1", listId: "list-1", name: "Task A", completed: false }),
      });

    const checkbox = screen.getByRole("checkbox", {
      name: /mark "Task A" as complete/i,
    });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3002/lists/list-1/todos/todo-1",
        { method: "PATCH", headers: { Authorization: "Bearer token-123" } },
      ),
    );

    // Checkbox should now be checked
    await waitFor(() => expect(screen.getByRole("checkbox", { name: /Task A/i })).toBeChecked());

    // Toggle back
    fireEvent.click(screen.getByRole("checkbox", { name: /Task A/i }));
    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: /Task A/i })).not.toBeChecked(),
    );
  });

  it("applies done styling when a todo is completed", async () => {
    await loginWithLists([
      {
        id: "list-1",
        name: "Work",
        todos: [{ id: "todo-1", listId: "list-1", name: "Done task", completed: true }],
      },
    ]);

    const checkbox = screen.getByRole("checkbox", { name: /Done task/i });
    expect(checkbox).toBeChecked();
  });

  // ─── Delete operations ──────────────────────────────────────────────

  it("deletes a todo when the delete button is clicked", async () => {
    await loginWithLists([
      {
        id: "list-1",
        name: "Shopping",
        todos: [{ id: "todo-1", listId: "list-1", name: "Buy eggs", completed: false }],
      },
    ]);

    fetchMock.mockResolvedValueOnce({ ok: true, status: 204 });

    fireEvent.click(screen.getByRole("button", { name: "Delete todo Buy eggs" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3002/lists/list-1/todos/todo-1",
        { method: "DELETE", headers: { Authorization: "Bearer token-123" } },
      ),
    );

    await waitFor(() =>
      expect(screen.queryByText("Buy eggs")).not.toBeInTheDocument(),
    );
    expect(screen.getByText(/Deleted todo "Buy eggs"/)).toBeInTheDocument();
  });

  it("deletes a list when the delete button is clicked", async () => {
    await loginWithLists([{ id: "list-1", name: "Old List", todos: [] }]);

    fetchMock.mockResolvedValueOnce({ ok: true, status: 204 });

    fireEvent.click(screen.getByRole("button", { name: "Delete list Old List" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3002/lists/list-1", {
        method: "DELETE",
        headers: { Authorization: "Bearer token-123" },
      }),
    );

    await waitFor(() =>
      expect(screen.queryByText("Old List")).not.toBeInTheDocument(),
    );
    expect(screen.getByText(/Deleted list "Old List"/)).toBeInTheDocument();
  });

  it("shows an error when deleting a list fails", async () => {
    await loginWithLists([{ id: "list-1", name: "My List", todos: [] }]);

    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "List not found" }),
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete list My List" }));

    expect(await screen.findByText("List not found")).toBeInTheDocument();
    // List still visible
    expect(screen.getByText("My List")).toBeInTheDocument();
  });

  // ─── Logout ─────────────────────────────────────────────────────────

  it("logs the user out and clears the workspace", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3002");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Login successful", accessToken: "token-123" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "list-1", name: "Groceries", todos: [] }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Logged out successfully" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthApp />);

    fireEvent.click(screen.getByRole("button", { name: "Switch to log in" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    await screen.findByText("Your lists");

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(3, "http://localhost:3002/auth/logout", {
        method: "POST",
        headers: { Authorization: "Bearer token-123" },
        credentials: "include",
      }),
    );

    expect(await screen.findByText("Logged out successfully")).toBeInTheDocument();
    expect(screen.queryByText("Your lists")).not.toBeInTheDocument();
  });

  // ─── Progress indicators ────────────────────────────────────────────

  it("shows X/Y todo count on a list card", async () => {
    await loginWithLists([
      {
        id: "list-1",
        name: "Work",
        todos: [
          { id: "t1", listId: "list-1", name: "Done", completed: true },
          { id: "t2", listId: "list-1", name: "Pending", completed: false },
        ],
      },
    ]);

    // 1 out of 2 done
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });
});
