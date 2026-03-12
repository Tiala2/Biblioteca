import { expect, test } from "@playwright/test";

test("deve abrir tela de login", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Library")).toBeVisible();
  await expect(page.getByText("Biblioteca Pública Digital")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});
