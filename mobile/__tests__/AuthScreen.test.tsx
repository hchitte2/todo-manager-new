import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as api from "../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock the navigation
const mockReplace = jest.fn();
jest.mock("@react-navigation/native-stack", () => ({
  ...jest.requireActual("@react-navigation/native-stack"),
}));

// Mock API
jest.mock("../src/api/client");
const mockedApi = api as jest.Mocked<typeof api>;

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  multiGet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock safe area
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import { AuthScreen } from "../src/screens/AuthScreen";

const navigation = { replace: mockReplace } as any;
const route = {} as any;

beforeEach(() => jest.clearAllMocks());

describe("AuthScreen", () => {
  it("renders login form by default", () => {
    render(<AuthScreen navigation={navigation} route={route} />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter a password")).toBeTruthy();
    // "Log in" appears in both the toggle and submit button
    expect(screen.getAllByText("Log in").length).toBeGreaterThanOrEqual(1);
  });

  it("switches to sign up mode", () => {
    render(<AuthScreen navigation={navigation} route={route} />);
    // Press the Sign up toggle button (first occurrence)
    fireEvent.press(screen.getAllByText("Sign up")[0]);
    expect(screen.getByText("Create account")).toBeTruthy();
  });

  it("shows alert when fields are empty", async () => {
    render(<AuthScreen navigation={navigation} route={route} />);
    // Press the submit button (last "Log in")
    const logInButtons = screen.getAllByText("Log in");
    fireEvent.press(logInButtons[logInButtons.length - 1]);
    await waitFor(() => {
      expect(screen.getAllByText("Log in").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("calls apiLogin and navigates on success", async () => {
    mockedApi.apiLogin.mockResolvedValueOnce({ accessToken: "tok123" });
    render(<AuthScreen navigation={navigation} route={route} />);

    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    fireEvent.changeText(screen.getByPlaceholderText("Enter a password"), "password123");
    // Press the submit button (last "Log in")
    const logInButtons = screen.getAllByText("Log in");
    fireEvent.press(logInButtons[logInButtons.length - 1]);

    await waitFor(() => {
      expect(mockedApi.apiLogin).toHaveBeenCalledWith("test@test.com", "password123");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("accessToken", "tok123");
      expect(mockReplace).toHaveBeenCalledWith("Home", { token: "tok123", email: "test@test.com" });
    });
  });

  it("calls apiSignup and switches to login on success", async () => {
    mockedApi.apiSignup.mockResolvedValueOnce("User created successfully");
    render(<AuthScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByText("Sign up"));
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "new@test.com");
    fireEvent.changeText(screen.getByPlaceholderText("Enter a password"), "password123");
    fireEvent.press(screen.getByText("Create account"));

    await waitFor(() => {
      expect(mockedApi.apiSignup).toHaveBeenCalledWith("new@test.com", "password123");
    });
  });

  it("shows error alert on login failure", async () => {
    mockedApi.apiLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
    render(<AuthScreen navigation={navigation} route={route} />);

    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    fireEvent.changeText(screen.getByPlaceholderText("Enter a password"), "wrongpass");
    const logInButtons = screen.getAllByText("Log in");
    fireEvent.press(logInButtons[logInButtons.length - 1]);

    await waitFor(() => {
      expect(mockedApi.apiLogin).toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
