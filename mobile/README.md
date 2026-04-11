# Todo Manager — Mobile (React Native)

A React Native mobile app for the Todo Manager, built with Expo. Uses the same backend API as the web version.

---

## Features

- Sign up and log in
- Create, view, and delete todo lists
- Add, check off, and delete todos
- Progress bars per list and overall
- Session persisted across app restarts

---

## Requirements

- Node.js 18+
- The backend running on port 3002
- [Expo Go](https://expo.dev/go) installed on your iPhone or Android phone

---

## Setup

```bash
cd mobile
npm install
```

Update `API_BASE_URL` in `src/api/client.ts` to your Mac's local IP address (found in System Settings → Wi-Fi → Details):

```ts
export const API_BASE_URL = "http://YOUR_MAC_IP:3002";
```

---

## Running the app

**Start the backend first** (from the project root):

```bash
npm run dev
```

**Then start the mobile app:**

```bash
npx expo start
```

Scan the QR code in the terminal with your iPhone's Camera app or with the Expo Go app on Android.

---

## Running tests

```bash
npm test
```

Run with individual test names printed:

```bash
npm test -- --verbose
```

Run in watch mode (re-runs on file save):

```bash
npm test -- --watch
```

---

## Project Structure

```
mobile/
├── App.tsx                       ← Root component, navigation setup
├── src/
│   ├── navigation.ts             ← Route param types
│   ├── api/
│   │   └── client.ts            ← All API calls to the backend
│   └── screens/
│       ├── AuthScreen.tsx       ← Sign up / Log in
│       ├── HomeScreen.tsx       ← Todo list overview
│       └── ListDetailScreen.tsx ← Todos inside a list
└── __tests__/
    ├── api.test.ts
    ├── AuthScreen.test.tsx
    ├── HomeScreen.test.tsx
    └── ListDetailScreen.test.tsx
```

---

## Tech Stack

| Package | Purpose |
|---|---|
| `expo` | Toolchain and runtime |
| `react-native` | Mobile UI framework |
| `@react-navigation/native` | Screen navigation |
| `@react-native-async-storage/async-storage` | Persisting login session |
| `react-native-safe-area-context` | Avoid notch / home indicator |
| `jest` + `jest-expo` | Test runner |
| `@testing-library/react-native` | Component testing |

---

## API Endpoints Used

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Log in, returns access token |
| POST | `/auth/logout` | Log out |
| GET | `/lists` | Get all lists |
| POST | `/lists` | Create a list |
| DELETE | `/lists/:id` | Delete a list |
| POST | `/lists/:id/todos` | Add a todo |
| PATCH | `/lists/:id/todos/:todoId` | Toggle todo completion |
| DELETE | `/lists/:id/todos/:todoId` | Delete a todo |

---

## Troubleshooting

**Network request failed**
→ Make sure the backend is running and `API_BASE_URL` matches your Mac's local IP.

**SDK version mismatch in Expo Go**
→ Run `npx expo start --clear` to clear the Metro cache.

**Tests failing with Expo runtime errors**
→ Make sure `jest-expo` version matches your Expo SDK version.

---

For a detailed explanation of how the app works and the React Native concepts used, see [GUIDE.md](./GUIDE.md).
