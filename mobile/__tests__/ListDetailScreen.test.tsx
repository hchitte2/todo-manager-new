import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import * as api from "../src/api/client";

jest.mock("../src/api/client");
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import { ListDetailScreen } from "../src/screens/ListDetailScreen";

const mockSetOptions = jest.fn();
const navigation = { setOptions: mockSetOptions } as any;
const route = {
  params: { token: "tok123", listId: "1", listName: "Shopping" },
} as any;

const sampleTodos: api.Todo[] = [
  { id: "t1", listId: "1", name: "Milk", completed: false },
  { id: "t2", listId: "1", name: "Bread", completed: true },
];

const sampleLists: api.TodoList[] = [
  { id: "1", name: "Shopping", todos: sampleTodos },
];

beforeEach(() => jest.clearAllMocks());

describe("ListDetailScreen", () => {
  it("shows todos after loading", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce(sampleLists);
    render(<ListDetailScreen navigation={navigation} route={route} />);

    await waitFor(() => {
      expect(screen.getByText("Milk")).toBeTruthy();
      expect(screen.getByText("Bread")).toBeTruthy();
    });
  });

  it("shows progress count", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce(sampleLists);
    render(<ListDetailScreen navigation={navigation} route={route} />);

    await waitFor(() => {
      expect(screen.getByText("1/2 completed")).toBeTruthy();
    });
  });

  it("shows empty state when no todos", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce([
      { id: "1", name: "Shopping", todos: [] },
    ]);
    render(<ListDetailScreen navigation={navigation} route={route} />);

    await waitFor(() => {
      expect(screen.getByText(/No todos yet/)).toBeTruthy();
    });
  });

  it("adds a new todo", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce(sampleLists);
    const newTodo: api.Todo = { id: "t3", listId: "1", name: "Eggs", completed: false };
    mockedApi.apiCreateTodo.mockResolvedValueOnce(newTodo);

    render(<ListDetailScreen navigation={navigation} route={route} />);
    await waitFor(() => screen.getByPlaceholderText("Add a todo…"));

    fireEvent.changeText(screen.getByPlaceholderText("Add a todo…"), "Eggs");
    fireEvent.press(screen.getByText("Add"));

    await waitFor(() => {
      expect(mockedApi.apiCreateTodo).toHaveBeenCalledWith("tok123", "1", "Eggs");
      expect(screen.getByText("Eggs")).toBeTruthy();
    });
  });

  it("toggles a todo", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce(sampleLists);
    const toggled: api.Todo = { id: "t1", listId: "1", name: "Milk", completed: true };
    mockedApi.apiToggleTodo.mockResolvedValueOnce(toggled);

    render(<ListDetailScreen navigation={navigation} route={route} />);
    await waitFor(() => screen.getByText("Milk"));

    // Find the checkbox for "Milk" (first unchecked one)
    const checkboxes = screen.getAllByRole("checkbox" as any);
    fireEvent.press(checkboxes[0]);

    await waitFor(() => {
      expect(mockedApi.apiToggleTodo).toHaveBeenCalledWith("tok123", "1", "t1");
    });
  });

  it("deletes a todo", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce(sampleLists);
    mockedApi.apiDeleteTodo.mockResolvedValueOnce();

    jest.spyOn(Alert, "alert").mockImplementationOnce((_title, _msg, buttons) => {
      const deleteBtn = buttons?.find((b) => b.style === "destructive");
      deleteBtn?.onPress?.();
    });

    render(<ListDetailScreen navigation={navigation} route={route} />);
    await waitFor(() => screen.getByText("Milk"));

    fireEvent.press(screen.getAllByText("×")[0]);

    await waitFor(() => {
      expect(mockedApi.apiDeleteTodo).toHaveBeenCalledWith("tok123", "1", "t1");
    });
  });

  it("sets navigation title to list name", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce(sampleLists);
    render(<ListDetailScreen navigation={navigation} route={route} />);

    await waitFor(() => {
      expect(mockSetOptions).toHaveBeenCalledWith({ title: "Shopping" });
    });
  });
});
