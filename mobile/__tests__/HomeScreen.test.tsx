import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import * as api from "../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("../src/api/client");
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import { HomeScreen } from "../src/screens/HomeScreen";

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockAddListener = jest.fn(() => jest.fn());
const navigation = { navigate: mockNavigate, replace: mockReplace, addListener: mockAddListener } as any;
const route = { params: { token: "tok123", email: "test@test.com" } } as any;

const sampleLists: api.TodoList[] = [
  { id: "1", name: "Shopping", todos: [{ id: "t1", listId: "1", name: "Milk", completed: false }] },
  { id: "2", name: "Work", todos: [{ id: "t2", listId: "2", name: "Email", completed: true }] },
];

beforeEach(() => jest.clearAllMocks());

describe("HomeScreen", () => {
  it("shows lists after loading", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce(sampleLists);
    render(<HomeScreen navigation={navigation} route={route} />);

    await waitFor(() => {
      expect(screen.getByText("Shopping")).toBeTruthy();
      expect(screen.getByText("Work")).toBeTruthy();
    });
  });

  it("shows user email in summary", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce(sampleLists);
    render(<HomeScreen navigation={navigation} route={route} />);

    await waitFor(() => {
      expect(screen.getByText("test@test.com")).toBeTruthy();
    });
  });

  it("shows empty state when no lists", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce([]);
    render(<HomeScreen navigation={navigation} route={route} />);

    await waitFor(() => {
      expect(screen.getByText(/No lists yet/)).toBeTruthy();
    });
  });

  it("creates a new list", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce([]);
    const newList: api.TodoList = { id: "3", name: "Groceries", todos: [] };
    mockedApi.apiCreateList.mockResolvedValueOnce(newList);

    render(<HomeScreen navigation={navigation} route={route} />);
    await waitFor(() => screen.getByPlaceholderText("New list name…"));

    fireEvent.changeText(screen.getByPlaceholderText("New list name…"), "Groceries");
    fireEvent.press(screen.getByText("+ Add"));

    await waitFor(() => {
      expect(mockedApi.apiCreateList).toHaveBeenCalledWith("tok123", "Groceries");
      expect(screen.getByText("Groceries")).toBeTruthy();
    });
  });

  it("navigates to list detail on tap", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce(sampleLists);
    render(<HomeScreen navigation={navigation} route={route} />);

    await waitFor(() => screen.getByText("Shopping"));
    fireEvent.press(screen.getByText("Shopping"));

    expect(mockNavigate).toHaveBeenCalledWith("ListDetail", {
      token: "tok123",
      listId: "1",
      listName: "Shopping",
    });
  });

  it("deletes a list", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce(sampleLists);
    mockedApi.apiDeleteList.mockResolvedValueOnce();

    jest.spyOn(Alert, "alert").mockImplementationOnce((_title, _msg, buttons) => {
      const deleteBtn = buttons?.find((b) => b.style === "destructive");
      deleteBtn?.onPress?.();
    });

    render(<HomeScreen navigation={navigation} route={route} />);
    await waitFor(() => screen.getByText("Shopping"));

    fireEvent.press(screen.getAllByText("×")[0]);

    await waitFor(() => {
      expect(mockedApi.apiDeleteList).toHaveBeenCalledWith("tok123", "1");
    });
  });

  it("logs out and navigates to Auth", async () => {
    mockedApi.apiGetLists.mockResolvedValueOnce([]);
    mockedApi.apiLogout.mockResolvedValueOnce();

    jest.spyOn(Alert, "alert").mockImplementationOnce((_title, _msg, buttons) => {
      const confirmBtn = buttons?.find((b) => b.style === "destructive");
      confirmBtn?.onPress?.();
    });

    render(<HomeScreen navigation={navigation} route={route} />);
    await waitFor(() => screen.getByText("Log out"));
    fireEvent.press(screen.getByText("Log out"));

    await waitFor(() => {
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(["accessToken", "userEmail"]);
      expect(mockReplace).toHaveBeenCalledWith("Auth");
    });
  });
});
