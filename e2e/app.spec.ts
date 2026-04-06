import { expect, test } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Signs up and immediately logs in.
 * After signup the UI auto-switches to login mode with credentials still
 * in the form, so a single "Log in" click completes authentication.
 */
async function signupAndLogin(
  page: import("@playwright/test").Page,
  email: string,
  password = "secret123",
) {
  await page.goto("/");

  // Sign up
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  // UI auto-switches to login mode — credentials are still filled
  await expect(page.getByText(/switch to login to continue/i)).toBeVisible();

  // Submit the login form (credentials already present)
  await page.getByRole("button", { name: /^log in$/i }).click();

  await expect(page.getByText("Your lists")).toBeVisible();
}

test.describe("todo manager e2e", () => {
  // ─── Auth ──────────────────────────────────────────────────────────

  test("user can sign up and then log in", async ({ page }) => {
    const email = uniqueEmail("signup-login");

    await page.goto("/");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("secret123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("User created successfully")).toBeVisible();

    // Mode auto-switched to login, credentials still in form — just submit
    await page.getByRole("button", { name: /^log in$/i }).click();

    await expect(page.getByText("Login successful")).toBeVisible();
    await expect(page.getByText("Your lists")).toBeVisible();
  });

  // ─── List + todo creation + logout ─────────────────────────────────

  test("logged-in user can create a list, add a todo, and log out", async ({ page }) => {
    const email = uniqueEmail("todo-flow");
    const listName = `Weekend ${Date.now()}`;
    const todoName = `Buy snacks ${Date.now()}`;

    await signupAndLogin(page, email);

    await page.getByPlaceholder("New list name…").fill(listName);
    await page.getByRole("button", { name: "+ Add list" }).click();

    await expect(page.getByRole("heading", { name: listName })).toBeVisible();

    const listCard = page.locator("article", { hasText: listName });
    await listCard.getByPlaceholder(`Add a todo to ${listName}`).fill(todoName);
    await listCard.getByRole("button", { name: "Add todo" }).click();

    await expect(listCard.locator("li", { hasText: todoName })).toBeVisible();
    await expect(page.getByText(`Added todo "${todoName}".`)).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page.getByText("Logged out successfully")).toBeVisible();
    await expect(page.getByText("Your lists")).not.toBeVisible();
  });

  // ─── Todo completion toggle ─────────────────────────────────────────

  test("user can mark a todo as complete and back to incomplete", async ({ page }) => {
    const email = uniqueEmail("toggle-flow");
    const listName = `Toggle List ${Date.now()}`;
    const todoName = `Toggle me ${Date.now()}`;

    await signupAndLogin(page, email);

    await page.getByPlaceholder("New list name…").fill(listName);
    await page.getByRole("button", { name: "+ Add list" }).click();
    await expect(page.getByRole("heading", { name: listName })).toBeVisible();

    const listCard = page.locator("article", { hasText: listName });
    await listCard.getByPlaceholder(`Add a todo to ${listName}`).fill(todoName);
    await listCard.getByRole("button", { name: "Add todo" }).click();
    await expect(listCard.locator("li", { hasText: todoName })).toBeVisible();

    await expect(listCard.getByText("0/1")).toBeVisible();

    const checkbox = listCard.getByRole("checkbox", { name: new RegExp(todoName, "i") });

    // Use click() for React-controlled checkboxes and wait for async API update
    await checkbox.click();
    await expect(checkbox).toBeChecked({ timeout: 10000 });
    await expect(listCard.getByText("1/1")).toBeVisible();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked({ timeout: 10000 });
    await expect(listCard.getByText("0/1")).toBeVisible();
  });

  // ─── Delete todo ────────────────────────────────────────────────────

  test("user can delete a todo from a list", async ({ page }) => {
    const email = uniqueEmail("delete-todo");
    const listName = `Delete Todo List ${Date.now()}`;
    const todoName = `Delete me ${Date.now()}`;

    await signupAndLogin(page, email);

    await page.getByPlaceholder("New list name…").fill(listName);
    await page.getByRole("button", { name: "+ Add list" }).click();
    await expect(page.getByRole("heading", { name: listName })).toBeVisible();

    const listCard = page.locator("article", { hasText: listName });
    await listCard.getByPlaceholder(`Add a todo to ${listName}`).fill(todoName);
    await listCard.getByRole("button", { name: "Add todo" }).click();
    await expect(listCard.locator("li", { hasText: todoName })).toBeVisible();

    await listCard.getByRole("button", { name: `Delete todo ${todoName}` }).click();

    await expect(listCard.locator("li", { hasText: todoName })).not.toBeVisible();
    await expect(page.getByText(`Deleted todo "${todoName}".`)).toBeVisible();
    await expect(listCard.getByText("No items yet.")).toBeVisible();
  });

  // ─── Delete list ────────────────────────────────────────────────────

  test("user can delete a list", async ({ page }) => {
    const email = uniqueEmail("delete-list");
    const listName = `Delete me list ${Date.now()}`;

    await signupAndLogin(page, email);

    await page.getByPlaceholder("New list name…").fill(listName);
    await page.getByRole("button", { name: "+ Add list" }).click();
    await expect(page.getByRole("heading", { name: listName })).toBeVisible();

    await page.getByRole("button", { name: `Delete list ${listName}` }).click();

    await expect(page.getByRole("heading", { name: listName })).not.toBeVisible();
    await expect(page.getByText(`Deleted list "${listName}".`)).toBeVisible();
  });

  // ─── Empty state ────────────────────────────────────────────────────

  test("shows empty state after all lists are deleted", async ({ page }) => {
    const email = uniqueEmail("empty-state");
    const listName = `Temp list ${Date.now()}`;

    await signupAndLogin(page, email);

    // Create one list then immediately delete it so we control the state
    await page.getByPlaceholder("New list name…").fill(listName);
    await page.getByRole("button", { name: "+ Add list" }).click();
    await expect(page.getByRole("heading", { name: listName })).toBeVisible();

    await page.getByRole("button", { name: `Delete list ${listName}` }).click();
    await expect(page.getByRole("heading", { name: listName })).not.toBeVisible();

    await expect(
      page.getByText("No lists yet. Create one above to get started."),
    ).toBeVisible();
  });

  // ─── User info display ──────────────────────────────────────────────

  test("shows user avatar initial after login", async ({ page }) => {
    const email = uniqueEmail("avatar");
    const firstLetter = email.charAt(0).toUpperCase();

    await signupAndLogin(page, email);

    await expect(page.locator(".user-avatar")).toContainText(firstLetter);
  });
});
