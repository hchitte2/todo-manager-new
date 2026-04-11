# React Native App — Learning Guide

This guide explains every concept used in this app, written for someone coming from a web background.

---

## What is React Native?

React Native lets you build **real mobile apps** (iOS and Android) using React and JavaScript. Instead of rendering HTML elements like `<div>` and `<p>`, it renders **native mobile components** — the actual buttons and text fields that iOS and Android use.

| Web (React) | React Native | What it becomes |
|---|---|---|
| `<div>` | `<View>` | A container box |
| `<p>`, `<span>` | `<Text>` | A text element |
| `<input>` | `<TextInput>` | A text field |
| `<button>` | `<Pressable>` | A tappable element |
| `<img>` | `<Image>` | An image |
| `<ul>` | `<FlatList>` | A scrollable list |

---

## What is Expo?

Expo is a toolchain built on top of React Native that makes development much easier. It handles:
- Starting a development server (`npx expo start`)
- Building the app for iOS/Android
- Providing pre-built native modules (camera, storage, etc.)

**Expo Go** is the phone app that lets you run your code on a real device during development — no Xcode or Android Studio needed.

---

## Project Structure

```
mobile/
├── App.tsx                      ← App entry point, sets up navigation
├── index.ts                     ← Expo entry point (just re-exports App)
├── src/
│   ├── navigation.ts            ← TypeScript types for screen routes
│   ├── api/
│   │   └── client.ts           ← All fetch calls to the backend
│   └── screens/
│       ├── AuthScreen.tsx      ← Sign up / Log in screen
│       ├── HomeScreen.tsx      ← List of todo lists
│       └── ListDetailScreen.tsx ← Todos inside a single list
└── __tests__/
    ├── api.test.ts
    ├── AuthScreen.test.tsx
    ├── HomeScreen.test.tsx
    └── ListDetailScreen.test.tsx
```

---

## Styling in React Native

React Native does **not** use CSS files. Instead, styles are written in JavaScript using `StyleSheet.create()`.

```tsx
import { StyleSheet, View, Text } from "react-native";

export function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
});
```

Key differences from CSS:
- Property names are camelCase (`backgroundColor` not `background-color`)
- No units — numbers are density-independent pixels (dp)
- No inheritance — every component needs its own styles
- Layout uses **Flexbox** by default (direction is column, not row)

---

## Navigation

This app uses **React Navigation** — the most popular navigation library for React Native.

### Stack Navigation

A "stack" works like a browser history. You push screens on top of each other and go back by popping them off.

```tsx
// App.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>        {/* required wrapper */}
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ListDetail" component={ListDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Navigating between screens

Each screen receives a `navigation` prop automatically:

```tsx
// Go to a screen and pass data to it
navigation.navigate("ListDetail", { listId: "123", listName: "Shopping" });

// Replace current screen (used after login — removes auth screen from history)
navigation.replace("Home", { token: "abc", email: "user@example.com" });

// Go back to the previous screen
navigation.goBack();
```

### Typed routes

We define the param types for each route in `src/navigation.ts`:

```ts
export type RootStackParamList = {
  Auth: undefined;                                          // no params
  Home: { token: string; email: string };                  // requires token + email
  ListDetail: { token: string; listId: string; listName: string };
};
```

This gives you autocompletion and catches mistakes at compile time.

---

## Screens

### AuthScreen

Handles both Sign up and Log in in a single screen, toggled by two buttons.

Key concepts used:
- `useState` — tracks the current mode (`"login"` or `"signup"`), email, password, and loading state
- `TextInput` — for email and password fields
- `secureTextEntry` prop — hides password characters
- `KeyboardAvoidingView` — moves the form up when the keyboard appears so it isn't hidden
- `Alert.alert()` — shows a native popup dialog (replaces `window.alert()`)
- `AsyncStorage.setItem()` — saves the access token to the phone's local storage after login

```tsx
// Saving token after login
await AsyncStorage.setItem("accessToken", accessToken);
await AsyncStorage.setItem("userEmail", email);

// Then navigate to Home
navigation.replace("Home", { token: accessToken, email });
```

### HomeScreen

Shows all todo lists belonging to the logged-in user.

Key concepts used:
- `FlatList` — efficiently renders a scrollable list. Better than mapping over an array because it only renders items currently visible on screen
- `useCallback` — memoizes the `loadLists` function so it doesn't get recreated on every render
- `navigation.addListener("focus", ...)` — re-fetches lists every time the user navigates back to this screen (so changes made in ListDetail are reflected)
- Progress bar — calculated as `(completedTodos / totalTodos) * 100`

```tsx
// FlatList example
<FlatList
  data={lists}
  keyExtractor={(item) => item.id}   // unique key for each item
  renderItem={({ item }) => (        // renders each item
    <Text>{item.name}</Text>
  )}
/>
```

### ListDetailScreen

Shows todos inside a single list.

Key concepts used:
- `navigation.setOptions({ title: listName })` — dynamically sets the header title to the list name
- Checkbox implemented as a `Pressable` with `accessibilityRole="checkbox"` — there's no built-in checkbox in React Native
- `textDecorationLine: "line-through"` — strikes through completed todo text

---

## Safe Areas

Mobile phones have notches, home indicators, and rounded corners that can overlap your content. `SafeAreaView` automatically adds padding to avoid these.

```tsx
import { SafeAreaView } from "react-native-safe-area-context";

// edges controls which sides get padding
<SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
  {/* content is safe from notch/home indicator */}
</SafeAreaView>
```

You also need to wrap the entire app in `<SafeAreaProvider>` (done in `App.tsx`).

---

## AsyncStorage

`AsyncStorage` is React Native's equivalent of `localStorage` in the browser. It's key-value storage that persists between app restarts.

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

// Save
await AsyncStorage.setItem("accessToken", "abc123");

// Read
const token = await AsyncStorage.getItem("accessToken");

// Read multiple at once
const [[, token], [, email]] = await AsyncStorage.multiGet(["accessToken", "userEmail"]);

// Delete multiple
await AsyncStorage.multiRemove(["accessToken", "userEmail"]);
```

---

## API Client (`src/api/client.ts`)

All network calls live in one file, keeping screens clean. Each function:
1. Calls `fetch()` with the right method, headers, and body
2. Passes the response through `parseResponse<T>()` which checks `response.ok` and throws if the request failed
3. Returns typed data

```ts
async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }
  return data as T;
}
```

The `API_BASE_URL` is set to your Mac's LAN IP so the phone can reach the backend over Wi-Fi:
```ts
export const API_BASE_URL = "http://192.168.1.225:3002";
```

---

## Testing

Tests use **Jest** + **React Native Testing Library** (RNTL).

RNTL works just like Testing Library for the web — it renders components and lets you find elements and fire events.

### Mocking

Since tests run in Node (not on a real phone), we mock:
- `fetch` — replace with `jest.fn()` that returns fake responses
- `@react-native-async-storage/async-storage` — mock storage functions
- `react-native-safe-area-context` — mock SafeAreaView to just render its children
- The API client module — mock all functions to return controlled data

```ts
// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ accessToken: "tok123" }),
});

// Mock the entire API module
jest.mock("../src/api/client");
const mockedApi = api as jest.Mocked<typeof api>;
mockedApi.apiGetLists.mockResolvedValueOnce([...]);
```

### Testing Alert dialogs

`Alert.alert()` doesn't render visible UI in tests. Instead, spy on it and manually call the button callback:

```ts
jest.spyOn(Alert, "alert").mockImplementationOnce((_title, _msg, buttons) => {
  // simulate pressing the "Delete" button
  const deleteBtn = buttons?.find((b) => b.style === "destructive");
  deleteBtn?.onPress?.();
});
```

### Common RNTL queries

```ts
screen.getByText("Hello")            // find by visible text
screen.getByPlaceholderText("Email") // find an input by placeholder
screen.getAllByText("×")             // find multiple elements
screen.getByRole("checkbox")         // find by accessibility role
fireEvent.press(element)             // simulate a tap
fireEvent.changeText(input, "value") // simulate typing
await waitFor(() => expect(...))     // wait for async state updates
```

---

## Key React Native Gotchas

1. **All text must be inside `<Text>`** — you can't render a string directly inside a `<View>` like you can in HTML
2. **Flexbox column by default** — unlike CSS where flexbox defaults to row
3. **No CSS units** — use plain numbers (they're density-independent pixels)
4. **`StyleSheet.create()` is optional but recommended** — it validates styles at runtime in development
5. **`onPress` not `onClick`** — all touch events use `onPress`
6. **`fetch` works the same as in the browser** — no special setup needed
