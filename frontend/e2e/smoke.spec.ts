import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readEnvValue(key: string): string | undefined {
  const direct = process.env[key]?.trim();
  if (direct) return direct;

  const envPath = path.resolve(__dirname, "../../backend/.env");
  if (!fs.existsSync(envPath)) return undefined;

  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${key}=`));

  if (!line) return undefined;
  return line.slice(key.length + 1).trim();
}

function getAdminCredentials() {
  const email = readEnvValue("LIBRARY_ADMIN_EMAIL");
  const password = readEnvValue("LIBRARY_ADMIN_PASSWORD");

  test.skip(!email || !password, "Credenciais admin nao configuradas no ambiente.");
  return { email: email!, password: password! };
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function logout(page: Page) {
  await page.locator('button[aria-label="Encerrar sessao"]').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page).toHaveURL(/\/login$/);
}

async function registerAndLogin(page: Page) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `smoke-${stamp}@example.com`;
  const password = "Senha@123";
  const name = `Smoke ${stamp}`;

  await page.goto("/register");
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 15000 });

  await login(page, email, password);
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

  return { email, password, name };
}

test("deve abrir tela de login", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Library")).toBeVisible();
  await expect(page.getByText(/Biblioteca.*Digital/i)).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});

test("deve cadastrar, autenticar e abrir area protegida", async ({ page }) => {
  const { name } = await registerAndLogin(page);

  await expect(page.getByRole("heading", { name: new RegExp(`Bem-vinda, ${name}`) })).toBeVisible();
  await page.getByRole("link", { name: "Livros" }).click();
  await expect(page).toHaveURL(/\/books$/);
  await expect(page.getByRole("heading", { name: "Escolha sua proxima jornada" })).toBeVisible();
});

test("deve abrir detalhes do livro e perfil do usuario", async ({ page }) => {
  await registerAndLogin(page);

  await page.getByRole("link", { name: "Livros" }).click();
  await expect(page.getByRole("heading", { name: "Escolha sua proxima jornada" })).toBeVisible();
  await page.getByRole("link", { name: "Ver detalhes" }).first().click();

  await expect(page).toHaveURL(/\/books\/.+$/);
  await expect(page.getByRole("heading", { name: /1984|Detalhes do livro/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: /Recepcao do catalogo/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: /Continuar explorando/i })).toBeVisible({ timeout: 15000 });

  await page.getByRole("navigation", { name: "Navegacao usuario" }).getByRole("link", { name: "Perfil", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "Perfil e historico de leitura" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Acoes rapidas" })).toBeVisible({ timeout: 15000 });
});

test("deve permitir revisar preferencias e visualizar o ranking", async ({ page }) => {
  await registerAndLogin(page);

  await page.getByRole("navigation", { name: "Navegacao usuario" }).getByRole("link", { name: "Perfil", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByLabel("Participar do ranking semanal").check();
  await page.getByLabel("Receber alertas internos de leitura").check();
  await page.getByRole("button", { name: "Salvar preferencias" }).click();
  await expect(page.getByText("Preferencias atualizadas com sucesso.")).toBeVisible();

  await page.getByRole("navigation", { name: "Navegacao usuario" }).getByRole("link", { name: "Ranking", exact: true }).click();
  await expect(page).toHaveURL(/\/leaderboard/);
  await expect(page.getByRole("heading", { name: "Ranking semanal da comunidade" })).toBeVisible();
  await expect(
    page
      .getByRole("heading", { name: "Podio da semana" })
      .or(page.getByText("Nenhum participante elegivel nesta semana"))
  ).toBeVisible();
});

test("deve criar, editar e remover uma review", async ({ page }) => {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const createdComment = `Review E2E ${stamp}`;
  const updatedComment = `${createdComment} editada`;

  await registerAndLogin(page);

  await page.getByRole("link", { name: "Livros" }).click();
  await expect(page.getByRole("heading", { name: "Escolha sua proxima jornada" })).toBeVisible();

  const readLink = page.getByRole("link", { name: /Ler no app|Ler com progresso/ }).first();
  await expect(readLink).toBeVisible();
  await readLink.click();

  await expect(page).toHaveURL(/\/books\/.+\/read$/);
  await expect(page.getByRole("heading", { name: "Painel de progresso" })).toBeVisible();
  await page.getByRole("spinbutton", { name: "Pagina" }).fill("5");
  await page.getByRole("button", { name: "Salvar progresso" }).click();
  await expect(page.getByText("Progresso de leitura salvo.")).toBeVisible();

  await page.getByRole("navigation", { name: "Navegacao usuario" }).getByRole("link", { name: "Reviews", exact: true }).click();
  await expect(page).toHaveURL(/\/reviews$/);
  await expect(page.getByRole("heading", { name: "Suas percepcoes importam" })).toBeVisible();

  const createCard = page.locator("article.card").filter({
    has: page.getByRole("heading", { name: "Nova review" }),
  }).first();

  await expect(createCard.locator("option")).not.toHaveCount(0);
  await createCard.locator("select").selectOption({ index: 0 });
  await createCard.getByRole("textbox").fill(createdComment);
  await createCard.getByRole("button", { name: "Salvar review" }).click();

  const reviewCard = page.locator("article.card").filter({
    has: page.getByRole("heading", { name: "1984" }),
  }).last();
  await expect(reviewCard).toBeVisible({ timeout: 15000 });
  await expect(reviewCard).toContainText(createdComment);

  await reviewCard.getByRole("button", { name: "Editar" }).click();
  await reviewCard.getByRole("textbox").fill(updatedComment);
  await reviewCard.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Review atualizada com sucesso.")).toBeVisible();
  await expect(page.getByText(updatedComment)).toBeVisible();

  const updatedCard = page.locator("article.card").filter({
    has: page.getByText(updatedComment),
  }).first();
  await updatedCard.getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByText("Review removida com sucesso.")).toBeVisible();
  await expect(page.getByText(updatedComment)).toHaveCount(0);
});

test("deve abrir badges e mostrar progresso de conquistas", async ({ page }) => {
  await registerAndLogin(page);

  await page.getByRole("navigation", { name: "Navegacao usuario" }).getByRole("link", { name: "Badges", exact: true }).click();
  await expect(page).toHaveURL(/\/badges$/);
  await expect(page.getByRole("heading", { name: "Conquistas da sua jornada" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Progresso das proximas conquistas" })).toBeVisible();
  await expect(page.getByText("Primeiro livro concluido")).toBeVisible();
  await expect(page.getByText(/Nenhum badge conquistado ainda|Codigo:/)).toBeVisible();
});

test("deve abrir o fluxo de recuperacao de senha", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: /Recuperar Senha|Definir Nova Senha/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Enviar link por email|Salvar nova senha/ })).toBeVisible();
});

test("deve salvar progresso de leitura e atualizar meta do usuario", async ({ page }) => {
  await registerAndLogin(page);

  await page.getByRole("link", { name: "Livros" }).click();
  await expect(page.getByRole("heading", { name: "Escolha sua proxima jornada" })).toBeVisible();

  const readLink = page.getByRole("link", { name: /Ler no app|Ler com progresso/ }).first();
  await expect(readLink).toBeVisible();
  await readLink.click();

  await expect(page).toHaveURL(/\/books\/.+\/read$/);
  await expect(page.getByRole("heading", { name: "Painel de progresso" })).toBeVisible();

  const pageInput = page.getByRole("spinbutton", { name: "Pagina" });
  await pageInput.fill("5");
  await page.getByRole("button", { name: "Salvar progresso" }).click();
  await expect(page.getByText("Progresso de leitura salvo.")).toBeVisible();
  await expect(
    page.locator(".stat-box").filter({
      has: page.getByText("ultima pagina salva"),
    })
  ).toContainText("5");

  await page.getByRole("link", { name: "Inicio" }).click();
  await expect(page.getByRole("link", { name: "Continuar leitura" })).toBeVisible();

  await page.getByRole("navigation", { name: "Navegacao usuario" }).getByRole("link", { name: "Metas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Transforme leitura em constancia" })).toBeVisible();

  const goalTarget = String(70 + (Date.now() % 20));
  const targetInput = page.getByRole("spinbutton").first();
  await targetInput.fill(goalTarget);
  await page.getByRole("button", { name: "Salvar meta" }).click();
  await expect(page.getByText("Meta atualizada com sucesso.")).toBeVisible();
  await expect(page.getByText(new RegExp(`${goalTarget} planejadas\\.`))).toBeVisible({ timeout: 15000 });
});

test("deve executar CRUD de categoria no painel admin", async ({ page }) => {
  const { email, password } = getAdminCredentials();
  const stamp = Date.now();
  const originalName = `Categoria E2E ${stamp}`;
  const updatedName = `${originalName} Editada`;

  await login(page, email, password);
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("link", { name: "Painel Admin" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Painel admin" })).toBeVisible();

  const categoryCard = page.locator("article.card").filter({
    has: page.getByRole("heading", { name: /Nova categoria|Editar categoria/ }),
  }).first();

  await categoryCard.getByPlaceholder("Nome").fill(originalName);
  await categoryCard.getByPlaceholder("Descricao").fill("Criada pelo fluxo E2E");
  await categoryCard.getByRole("button", { name: "Criar categoria" }).click();
  await expect(page.getByText("Categoria criada com sucesso.")).toBeVisible();
  await page.getByPlaceholder("Filtrar categorias").fill(originalName);

  const categoryItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(originalName),
  }).first();
  await expect(categoryItem).toBeVisible();

  await categoryItem.getByRole("button", { name: "Editar" }).click();
  await expect(categoryCard.getByRole("heading", { name: "Editar categoria" })).toBeVisible();
  await categoryCard.getByPlaceholder("Nome").fill(updatedName);
  await categoryCard.getByPlaceholder("Descricao").fill("Atualizada pelo fluxo E2E");
  await categoryCard.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(page.getByText("Categoria atualizada com sucesso.")).toBeVisible();
  await page.getByPlaceholder("Filtrar categorias").fill(updatedName);

  const updatedItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(updatedName),
  }).first();
  await expect(updatedItem).toBeVisible();

  await updatedItem.getByRole("button", { name: "Excluir" }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByText("Categoria removida com sucesso.")).toBeVisible();
  await expect(page.getByText(updatedName)).toHaveCount(0);
});

test("deve exibir paineis administrativos de usuarios, favoritos e alertas", async ({ page }) => {
  const { email, password } = getAdminCredentials();

  await login(page, email, password);
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("link", { name: "Painel Admin" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Painel admin" })).toBeVisible();

  await expect(page.locator("#admin-users").getByRole("heading", { name: "Gestao de usuarios" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Favoritos registrados" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Auditoria de alertas" })).toBeVisible();
  await expect(page.getByPlaceholder("Filtrar usuarios por nome ou email")).toBeVisible();
  await expect(page.getByPlaceholder("Filtrar favoritos por titulo, ISBN ou origem")).toBeVisible();
  await expect(page.getByPlaceholder("Filtrar alertas por email, tipo ou status")).toBeVisible();
});

test("deve invalidar um usuario pelo painel admin", async ({ page }) => {
  const { email: adminEmail, password: adminPassword } = getAdminCredentials();
  const createdUser = await registerAndLogin(page);

  await logout(page);

  await login(page, adminEmail, adminPassword);
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("link", { name: "Painel Admin" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Painel admin" })).toBeVisible();

  await page.getByPlaceholder("Filtrar usuarios por nome ou email").fill(createdUser.email);

  const userItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(createdUser.email),
  }).first();
  await expect(userItem).toBeVisible({ timeout: 15000 });
  await expect(userItem).toContainText("Acesso ativo");

  const updatedName = `${createdUser.name} Editado`;
  await userItem.getByRole("button", { name: "Editar" }).click();
  await page.getByPlaceholder("Nome do usuario").fill(updatedName);
  await page.getByLabel("Participar do ranking").check();
  await page.getByRole("button", { name: "Salvar usuario" }).click();
  await expect(page.getByText("Usuario atualizado com sucesso.")).toBeVisible();
  await expect(userItem).toContainText(updatedName);
  await expect(userItem).toContainText("Ranking ativo");

  await userItem.getByRole("button", { name: "Invalidar acesso" }).click();
  await expect(page.getByText("Usuario invalidado com sucesso.")).toBeVisible();
  await expect(userItem).toContainText("Acesso invalidado");

  await logout(page);

  await login(page, createdUser.email, createdUser.password);
  await expect(page.getByText("Credenciais inválidas.")).toBeVisible({ timeout: 15000 });

  await login(page, adminEmail, adminPassword);
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: "Painel Admin" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByPlaceholder("Filtrar usuarios por nome ou email").fill(createdUser.email);
  const invalidatedUserItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(createdUser.email),
  }).first();
  await expect(invalidatedUserItem).toBeVisible({ timeout: 15000 });
  await invalidatedUserItem.getByRole("button", { name: "Reativar acesso" }).click();
  await expect(page.getByText("Usuario reativado com sucesso.")).toBeVisible();
  await expect(invalidatedUserItem).toContainText("Acesso ativo");

  await logout(page);
  await login(page, createdUser.email, createdUser.password);
  await expect(page.getByRole("heading", { name: new RegExp(`Bem-vinda, ${updatedName}`) })).toBeVisible({ timeout: 15000 });
});

test("deve executar CRUD de livro no painel admin", async ({ page }) => {
  const { email, password } = getAdminCredentials();
  const stamp = Date.now();
  const originalTitle = `000 Livro E2E ${stamp}`;
  const updatedTitle = `${originalTitle} Editado`;
  const originalAuthor = `Autor E2E ${stamp}`;
  const updatedAuthor = `${originalAuthor} Final`;
  const isbn = `97865${String(stamp).slice(-8)}`;

  await login(page, email, password);
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("link", { name: "Painel Admin" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Painel admin" })).toBeVisible();

  const bookCard = page.locator("article.card").filter({
    has: page.getByRole("heading", { name: /Novo livro|Editar livro/ }),
  }).first();

  await bookCard.getByPlaceholder("Titulo", { exact: true }).fill(originalTitle);
  await bookCard.getByPlaceholder("Autor", { exact: true }).fill(originalAuthor);
  await bookCard.getByPlaceholder("ISBN", { exact: true }).fill(isbn);
  await bookCard.getByRole("spinbutton").first().fill("222");
  await bookCard.getByRole("button", { name: "Criar livro" }).click();
  await expect(page.getByText("Livro criado com sucesso.")).toBeVisible();

  const createdItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(originalTitle),
  }).first();
  await expect(createdItem).toBeVisible();

  await createdItem.getByRole("button", { name: "Editar" }).click();
  await expect(bookCard.getByRole("heading", { name: "Editar livro" })).toBeVisible();
  await bookCard.getByPlaceholder("Titulo", { exact: true }).fill(updatedTitle);
  await bookCard.getByPlaceholder("Autor", { exact: true }).fill(updatedAuthor);
  await bookCard.getByRole("button", { name: "Salvar livro" }).click();
  await expect(page.getByText("Livro atualizado com sucesso.")).toBeVisible();

  const updatedItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(updatedTitle),
  }).first();
  await expect(updatedItem).toBeVisible();
  await expect(updatedItem).toContainText(updatedAuthor);

  await updatedItem.getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByText("Livro removido com sucesso.")).toBeVisible();
  await expect(page.getByText(updatedTitle)).toHaveCount(0);
});
