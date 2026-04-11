/** @jest-environment node */
import {
  apiSignup,
  apiLogin,
  apiLogout,
  apiGetLists,
  apiCreateList,
  apiDeleteList,
  apiCreateTodo,
  apiToggleTodo,
  apiDeleteTodo,
  API_BASE_URL,
} from "../src/api/client";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => mockFetch.mockReset());

describe("apiSignup", () => {
  it("returns message on success", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ message: "User created" }, 201));
    const msg = await apiSignup("a@b.com", "pass");
    expect(msg).toBe("User created");
    expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/signup`, expect.objectContaining({ method: "POST" }));
  });

  it("throws on failure", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ message: "Email taken" }, 400));
    await expect(apiSignup("a@b.com", "pass")).rejects.toThrow("Email taken");
  });
});

describe("apiLogin", () => {
  it("returns accessToken on success", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ accessToken: "tok123", message: "OK" }));
    const result = await apiLogin("a@b.com", "pass");
    expect(result.accessToken).toBe("tok123");
  });

  it("throws on invalid credentials", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ message: "Invalid credentials" }, 401));
    await expect(apiLogin("a@b.com", "wrong")).rejects.toThrow("Invalid credentials");
  });
});

describe("apiLogout", () => {
  it("calls logout endpoint with token", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ message: "Logged out" }));
    await apiLogout("tok123");
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/logout`,
      expect.objectContaining({ headers: { Authorization: "Bearer tok123" } }),
    );
  });
});

describe("apiGetLists", () => {
  it("returns list array", async () => {
    const lists = [{ id: "1", name: "Shopping", todos: [] }];
    mockFetch.mockReturnValueOnce(mockResponse(lists));
    const result = await apiGetLists("tok");
    expect(result).toEqual(lists);
  });

  it("throws on auth failure", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ message: "Unauthorized" }, 401));
    await expect(apiGetLists("bad")).rejects.toThrow("Unauthorized");
  });
});

describe("apiCreateList", () => {
  it("returns created list", async () => {
    const list = { id: "2", name: "Work", todos: [] };
    mockFetch.mockReturnValueOnce(mockResponse(list, 201));
    const result = await apiCreateList("tok", "Work");
    expect(result.name).toBe("Work");
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/lists`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Work" }) }),
    );
  });
});

describe("apiDeleteList", () => {
  it("resolves on success", async () => {
    mockFetch.mockReturnValueOnce(Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) } as Response));
    await expect(apiDeleteList("tok", "1")).resolves.toBeUndefined();
  });

  it("throws on not found", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ message: "List not found" }, 404));
    await expect(apiDeleteList("tok", "999")).rejects.toThrow("List not found");
  });
});

describe("apiCreateTodo", () => {
  it("returns created todo", async () => {
    const todo = { id: "t1", listId: "1", name: "Buy milk", completed: false };
    mockFetch.mockReturnValueOnce(mockResponse(todo, 201));
    const result = await apiCreateTodo("tok", "1", "Buy milk");
    expect(result.name).toBe("Buy milk");
    expect(result.completed).toBe(false);
  });
});

describe("apiToggleTodo", () => {
  it("returns updated todo", async () => {
    const todo = { id: "t1", listId: "1", name: "Buy milk", completed: true };
    mockFetch.mockReturnValueOnce(mockResponse(todo));
    const result = await apiToggleTodo("tok", "1", "t1");
    expect(result.completed).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/lists/1/todos/t1`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});

describe("apiDeleteTodo", () => {
  it("resolves on success", async () => {
    mockFetch.mockReturnValueOnce(Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) } as Response));
    await expect(apiDeleteTodo("tok", "1", "t1")).resolves.toBeUndefined();
  });

  it("throws on not found", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ message: "Todo not found" }, 404));
    await expect(apiDeleteTodo("tok", "1", "999")).rejects.toThrow("Todo not found");
  });
});
