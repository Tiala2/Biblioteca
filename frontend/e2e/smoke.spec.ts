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
  await page.getByRole("textbox", { name: "Senha", exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function expectSuccessfulLogin(page: Page) {
  await page.waitForFunction(
    () => window.location.pathname !== "/login" || Boolean(document.querySelector(".login-error")),
    undefined,
    { timeout: 15_000 }
  );

  const pathname = new URL(page.url()).pathname;
  if (pathname === "/login") {
    const error = (await page.locator(".login-error").textContent())?.trim();
    throw new Error(`Login nao concluiu com sucesso. Erro exibido: ${error ?? "nenhum detalhe informado"}`);
  }
}

async function expectNoRealLayoutFailures(page: Page, scopeSelector = "main") {
  const audit = await page.evaluate((scope) => {
    const viewportWidth = window.innerWidth;
    const overflowElements = Array.from(document.querySelectorAll<HTMLElement>(`${scope} *`))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: element.className?.toString() ?? "",
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 90) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((entry) => entry.width > 0 && (entry.left < -2 || entry.right > viewportWidth + 2))
      .slice(0, 10);

    const crampedControls = Array.from(
      document.querySelectorAll<HTMLElement>(
        `${scope} button, ${scope} a.btn-link, ${scope} input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), ${scope} select, ${scope} textarea`
      )
    )
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 90) ?? "",
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
        height: element.clientHeight,
        scrollHeight: element.scrollHeight,
      }))
      .filter(
        (entry) =>
          entry.width > 0 &&
          entry.height > 0 &&
          (entry.scrollWidth > entry.width + 2 || entry.scrollHeight > entry.height + 2)
      )
      .slice(0, 10);

    const splitWords = Array.from(
      document.querySelectorAll<HTMLElement>(`${scope} h1, ${scope} h2, ${scope} h3, ${scope} h4, ${scope} .stat-box`)
    )
      .flatMap((element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const failures: Array<{ text: string; word: string; lines: number }> = [];
        let node = walker.nextNode();

        while (node) {
          const text = node.textContent ?? "";
          for (const match of text.matchAll(/[\p{L}][\p{L}\p{N}]{3,}/gu)) {
            const range = document.createRange();
            const start = match.index ?? 0;
            range.setStart(node, start);
            range.setEnd(node, start + match[0].length);
            const lines = new Set(
              Array.from(range.getClientRects())
                .filter((rect) => rect.width > 0 && rect.height > 0)
                .map((rect) => Math.round(rect.top))
            ).size;
            range.detach();
            if (lines > 1) {
              failures.push({
                text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 90) ?? "",
                word: match[0],
                lines,
              });
            }
          }
          node = walker.nextNode();
        }
        return failures;
      })
      .slice(0, 10);

    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth,
      overflowElements,
      crampedControls,
      splitWords,
    };
  }, scopeSelector);

  expect(audit.documentWidth, JSON.stringify(audit.overflowElements, null, 2)).toBeLessThanOrEqual(audit.viewportWidth + 2);
  expect(audit.overflowElements, JSON.stringify(audit.overflowElements, null, 2)).toEqual([]);
  expect(audit.crampedControls, JSON.stringify(audit.crampedControls, null, 2)).toEqual([]);
  expect(audit.splitWords, JSON.stringify(audit.splitWords, null, 2)).toEqual([]);
}

async function waitForRealRouteData(page: Page, route: string) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 45_000 });

  if (route.startsWith("/admin")) {
    await expect(page.getByText("Carregando indicadores...", { exact: true })).toHaveCount(0, { timeout: 45_000 });
  }
  if (route === "/admin/users" || route === "/admin") {
    await expect(page.getByText("Carregando usuários...", { exact: true })).toHaveCount(0, { timeout: 45_000 });
  }
  if (route === "/books") {
    await expect(page.getByText("Livros em carregamento", { exact: true })).toHaveCount(0, { timeout: 45_000 });
  }
}

async function getCurrentReadingRoutes(page: Page) {
  await page.goto("/");
  await waitForRealRouteData(page, "/");

  const token = await page.evaluate(() => {
    const auth = JSON.parse(localStorage.getItem("library.auth") ?? "{}") as { token?: string };
    return auth.token ?? "";
  });
  if (!token) return { detailsRoute: "", readingRoute: "" };

  const response = await page.request.get("http://localhost:8080/api/v1/home/resume", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) return { detailsRoute: "", readingRoute: "" };
  const home = (await response.json()) as { readings?: Array<{ book?: { id?: string } }> };
  const bookId = home.readings?.[0]?.book?.id ?? "";

  if (!bookId) {
    return { detailsRoute: "", readingRoute: "" };
  }

  return {
    detailsRoute: `/books/${bookId}`,
    readingRoute: `/books/${bookId}/read`,
  };
}

async function logout(page: Page) {
  await page.locator('button[aria-label="Encerrar sessão"]').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page).toHaveURL(/\/login$/);
}

async function openAdmin(page: Page) {
  await page.getByRole("link", { name: "Administração", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Painel administrativo" })).toBeVisible();
}

async function registerAndLogin(page: Page) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `smoke-${stamp}@example.com`;
  const password = "Senha@123";
  const name = `Smoke ${stamp}`;

  await page.goto("/register");
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Senha", exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(/\/login$/, { timeout: 15000 });

  await login(page, email, password);
  await expectSuccessfulLogin(page);
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

  return { email, password, name };
}

test("deve abrir tela de login", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Library")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cada livro pode mudar uma parte da sua história." })).toBeVisible();
  await expect(page.getByText("Vamos começar?")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});

test("deve cadastrar, autenticar e abrir area protegida", async ({ page }) => {
  await registerAndLogin(page);

  await expect(page.getByRole("heading", { name: "Continue sua jornada de leitura" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("link", { name: "Explorar Livros", exact: true }).click();
  await expect(page).toHaveURL(/\/books$/);
  await expect(page.getByRole("heading", { name: "Escolha sua próxima jornada" })).toBeVisible();
});

test("deve abrir detalhes do livro e perfil do usuario", async ({ page }) => {
  await registerAndLogin(page);

  await page.getByRole("link", { name: "Explorar Livros", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Escolha sua próxima jornada" })).toBeVisible();
  await page.getByRole("link", { name: /Detalhes|Abrir detalhes/i }).first().click();

  await expect(page).toHaveURL(/\/books\/.+$/);
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Avaliação dos leitores" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Sugestões de leitura" })).toBeVisible({ timeout: 15000 });

  await page.getByRole("navigation", { name: "Navegação do usuário" }).getByRole("link", { name: "Meu Perfil", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "Minha jornada de leitura" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Atalhos rápidos" })).toBeVisible({ timeout: 15000 });
});

test("deve permitir revisar preferências e visualizar o ranking", async ({ page }) => {
  await registerAndLogin(page);

  await page.getByRole("navigation", { name: "Navegação do usuário" }).getByRole("link", { name: "Meu Perfil", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "Minha jornada de leitura" })).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Participar da classificação semanal").check();
  await page.getByLabel("Receber alertas internos de leitura").check();
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(page.getByText("Preferências atualizadas com sucesso.")).toBeVisible({ timeout: 15000 });

  await page.getByRole("navigation", { name: "Navegação do usuário" }).getByRole("link", { name: "Classificação", exact: true }).click();
  await expect(page).toHaveURL(/\/leaderboard/);
  await expect(page.getByRole("heading", { name: "Classificação dos leitores" })).toBeVisible({ timeout: 15000 });
  await expect(
    page
      .getByRole("heading", { name: "Pódio da semana" })
      .or(page.getByText("Ainda não há leitores classificados nesta semana."))
  ).toBeVisible();
});

test("deve criar, editar e remover uma avaliação", async ({ page }) => {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const createdComment = `Review E2E ${stamp}`;
  const updatedComment = `${createdComment} editada`;

  await registerAndLogin(page);

  await page.getByRole("link", { name: "Explorar Livros", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Escolha sua próxima jornada" })).toBeVisible();

  const readLink = page.locator('main a[href^="/books/"][href$="/read"]').first();
  await expect(readLink).toBeVisible({ timeout: 15000 });
  await readLink.click();

  await expect(page).toHaveURL(/\/books\/.+\/read$/);
  await expect(page.getByRole("heading", { name: "Seu progresso" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("spinbutton", { name: /Página atual/i }).fill("5");
  await page.getByRole("button", { name: "Salvar progresso", exact: true }).first().click();
  await expect(page.getByText("Progresso de leitura salvo.")).toBeVisible({ timeout: 15000 });

  await page.getByRole("navigation", { name: "Navegação do usuário" }).getByRole("link", { name: "Minhas Avaliações", exact: true }).click();
  await expect(page).toHaveURL(/\/reviews$/);
  await expect(page.getByRole("heading", { name: "Suas percepções importam" })).toBeVisible();

  const createCard = page.locator("article.card").filter({
    has: page.getByRole("heading", { name: "Avaliar leitura" }),
  }).first();

  const firstEligibleBook = createCard.locator(".admin-book-picker__item").first();
  await expect(firstEligibleBook).toBeVisible();
  await firstEligibleBook.click();
  await createCard.getByRole("textbox", { name: "Comentário da nova avaliação" }).fill(createdComment);
  await createCard.getByRole("button", { name: "Salvar avaliação" }).click();

  const reviewCard = page.locator("article.card").filter({
    has: page.getByText(createdComment),
  }).last();
  await expect(reviewCard).toBeVisible({ timeout: 15000 });
  await expect(reviewCard).toContainText(createdComment);

  await reviewCard.getByRole("button", { name: "Editar" }).click();
  await reviewCard.getByRole("textbox").fill(updatedComment);
  await reviewCard.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Avaliação atualizada com sucesso.")).toBeVisible();
  await expect(page.getByText(updatedComment)).toBeVisible();

  const updatedCard = page.locator("article.card").filter({
    has: page.getByText(updatedComment),
  }).first();
  await updatedCard.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText("Avaliação removida com sucesso.")).toBeVisible();
  await expect(page.getByText(updatedComment)).toHaveCount(0);
});

test("deve abrir conquistas e mostrar progresso", async ({ page }) => {
  await registerAndLogin(page);

  await page.getByRole("navigation", { name: "Navegação do usuário" }).getByRole("link", { name: "Conquistas e Medalhas", exact: true }).click();
  await expect(page).toHaveURL(/\/badges$/);
  await expect(page.getByRole("heading", { name: "Conquistas da sua jornada" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Progresso das próximas conquistas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Primeiro livro concluído" }).first()).toBeVisible();
  await expect(page.getByText(/Nenhuma conquista desbloqueada ainda|Trilha:/).first()).toBeVisible();
});

test("deve abrir o fluxo de recuperação de senha", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: /Recuperar acesso|Criar nova senha/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Enviar link por email|Salvar nova senha/ })).toBeVisible();
});

test("deve salvar progresso de leitura e atualizar meta do usuario", async ({ page }) => {
  await registerAndLogin(page);

  await page.getByRole("link", { name: "Explorar Livros", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Escolha sua próxima jornada" })).toBeVisible();

  const readLink = page.locator('main a[href^="/books/"][href$="/read"]').first();
  await expect(readLink).toBeVisible({ timeout: 15000 });
  await readLink.click();

  await expect(page).toHaveURL(/\/books\/.+\/read$/);
  await expect(page.getByRole("heading", { name: "Seu progresso" })).toBeVisible({ timeout: 15000 });

  const pageInput = page.getByRole("spinbutton", { name: /Página atual/i });
  await pageInput.fill("5");
  await page.getByRole("button", { name: "Salvar progresso", exact: true }).first().click();
  await expect(page.getByText("Progresso de leitura salvo.")).toBeVisible({ timeout: 15000 });
  await expect(
    page.locator(".stat-box").filter({
      has: page.getByText(/Última página salva/i),
    })
  ).toContainText("5");

  await page.getByRole("link", { name: "Página Inicial", exact: true }).click();
  await expect(page.getByRole("link", { name: "Continuar leitura" }).first()).toBeVisible();

  await page.getByRole("navigation", { name: "Navegação do usuário" }).getByRole("link", { name: "Metas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Transforme leitura em constância" })).toBeVisible();

  const goalTarget = String(70 + (Date.now() % 20));
  const targetInput = page.getByRole("spinbutton").first();
  await targetInput.fill(goalTarget);
  await page.getByRole("button", { name: "Salvar meta" }).click();
  await expect(page.getByText("Meta atualizada com sucesso.")).toBeVisible();
  await expect(page.getByText(new RegExp(`${goalTarget} planejadas\\.`))).toBeVisible({ timeout: 15000 });
});

test("deve validar leitura interna, externa e progresso manual com dados reais", async ({ page }) => {
  test.setTimeout(120_000);
  const { email, password } = getAdminCredentials();

  await login(page, email, password);
  await expectSuccessfulLogin(page);

  const storedAuth = await page.evaluate(() => JSON.parse(localStorage.getItem("library.auth") ?? "null"));
  const response = await page.request.get(
    "http://localhost:8080/api/v1/books?includeWithoutPdf=true&page=0&size=100",
    { headers: { Authorization: `Bearer ${storedAuth.token}` } }
  );
  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as {
    content: Array<{ id: string; source?: string; hasPdf?: boolean; numberOfPages?: number }>;
  };
  const internalBook = payload.content.find((book) => book.hasPdf);
  const externalBook = payload.content.find((book) => book.source === "OPEN" && !book.hasPdf);
  const manualBook = payload.content.find((book) => book.source === "LOCAL" && !book.hasPdf);

  expect(internalBook).toBeTruthy();
  expect(externalBook).toBeTruthy();
  expect(manualBook).toBeTruthy();

  await page.goto(`/books/${internalBook!.id}/read`);
  await expect(page.getByRole("heading", { name: "Leitura integrada" })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('iframe[title^="Leitor PDF -"]')).toBeVisible();

  await page.goto(`/books/${externalBook!.id}/read`);
  await expect(
    page
      .getByRole("heading", { name: "Leitura online integrada" })
      .or(page.getByRole("heading", { name: "Leitura na fonte oficial" }))
  ).toBeVisible({ timeout: 20000 });

  await page.goto(`/books/${manualBook!.id}/read`);
  await expect(page.getByRole("heading", { name: "Leitura manual do acervo" })).toBeVisible({ timeout: 15000 });
  const targetPage = Math.min(3, Math.max(1, manualBook!.numberOfPages ?? 1));
  await page.getByRole("spinbutton", { name: "Página" }).fill(String(targetPage));
  await page.getByRole("button", { name: "Salvar progresso", exact: true }).first().click();
  await expect(page.getByText("Progresso de leitura salvo.")).toBeVisible({ timeout: 15000 });
});

test("deve executar CRUD de categoria no painel admin", async ({ page }) => {
  const { email, password } = getAdminCredentials();
  const stamp = Date.now();
  const originalName = `Categoria E2E ${stamp}`;
  const updatedName = `${originalName} Editada`;

  await login(page, email, password);
  await expectSuccessfulLogin(page);
  await expect(page).toHaveURL(/\/$/);

  await openAdmin(page);

  const categoryCard = page.locator("article.card").filter({
    has: page.getByRole("heading", { name: /Organizar categoria|Editar categoria/ }),
  }).first();

  await categoryCard.getByPlaceholder("Nome").fill(originalName);
  await categoryCard.getByPlaceholder("Descrição").fill("Criada pelo fluxo E2E");
  await categoryCard.getByRole("button", { name: "Criar categoria" }).click();
  await expect(page.getByText("Categoria criada com sucesso.")).toBeVisible();
  await page.getByPlaceholder("Buscar categoria").fill(originalName);

  const categoryItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(originalName),
  }).first();
  await expect(categoryItem).toBeVisible();

  await categoryItem.getByRole("button", { name: "Editar" }).click();
  await expect(categoryCard.getByRole("heading", { name: "Editar categoria" })).toBeVisible();
  await categoryCard.getByPlaceholder("Nome").fill(updatedName);
  await categoryCard.getByPlaceholder("Descrição").fill("Atualizada pelo fluxo E2E");
  await categoryCard.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(page.getByText("Categoria atualizada com sucesso.")).toBeVisible();
  await page.getByPlaceholder("Buscar categoria").fill(updatedName);

  const updatedItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(updatedName),
  }).first();
  await expect(updatedItem).toBeVisible();

  await updatedItem.getByRole("button", { name: "Remover" }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByText("Categoria removida com sucesso.")).toBeVisible();
  await expect(page.getByText(updatedName)).toHaveCount(0);
});

test("deve executar CRUD de tag e coleção no painel admin", async ({ page }) => {
  test.setTimeout(120_000);
  const { email, password } = getAdminCredentials();
  const stamp = Date.now();
  const tagName = `Tag E2E ${stamp}`;
  const updatedTagName = `${tagName} Editada`;
  const collectionName = `Coleção E2E ${stamp}`;
  const updatedCollectionName = `${collectionName} Editada`;

  await login(page, email, password);
  await expectSuccessfulLogin(page);
  await openAdmin(page);

  const tagCard = page.locator("#admin-tags");
  await tagCard.getByLabel("Nome da tag").fill(tagName);
  await tagCard.getByRole("button", { name: "Criar tag" }).click();
  await expect(page.getByText("Tag criada com sucesso.")).toBeVisible();
  await tagCard.getByLabel("Filtrar tags").fill(tagName);

  let tagItem = tagCard.locator(".stacked-list-item").filter({ has: page.getByText(tagName) }).first();
  await expect(tagItem).toBeVisible();
  await tagItem.getByRole("button", { name: "Editar" }).click();
  await tagCard.getByLabel("Nome da tag").fill(updatedTagName);
  await tagCard.getByRole("button", { name: "Salvar tag" }).click();
  await expect(page.getByText("Tag atualizada com sucesso.")).toBeVisible();
  await tagCard.getByLabel("Filtrar tags").fill(updatedTagName);

  tagItem = tagCard.locator(".stacked-list-item").filter({ has: page.getByText(updatedTagName) }).first();
  await expect(tagItem).toBeVisible();
  await tagItem.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText("Tag removida com sucesso.")).toBeVisible();

  const collectionCard = page.locator("#admin-collections");
  await collectionCard.getByLabel("Título da coleção").fill(collectionName);
  await collectionCard.getByLabel("Descrição da coleção").fill("Coleção temporária para validação E2E");
  const firstBook = collectionCard.getByRole("checkbox").first();
  await expect(firstBook).toBeVisible();
  await firstBook.check();
  await collectionCard.getByRole("button", { name: "Criar coleção" }).click();
  await expect(page.getByText("Coleção criada com sucesso.")).toBeVisible();
  await collectionCard.getByLabel("Filtrar coleções").fill(collectionName);

  let collectionItem = collectionCard.locator(".stacked-list-item").filter({ has: page.getByText(collectionName) }).first();
  await expect(collectionItem).toBeVisible();
  await collectionItem.getByRole("button", { name: "Editar" }).click();
  await collectionCard.getByLabel("Título da coleção").fill(updatedCollectionName);
  await collectionCard.getByRole("button", { name: "Salvar coleção" }).click();
  await expect(page.getByText("Coleção atualizada com sucesso.")).toBeVisible();
  await collectionCard.getByLabel("Filtrar coleções").fill(updatedCollectionName);

  collectionItem = collectionCard.locator(".stacked-list-item").filter({ has: page.getByText(updatedCollectionName) }).first();
  await expect(collectionItem).toBeVisible();
  await collectionItem.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText("Coleção removida com sucesso.")).toBeVisible();
});

test("deve validar CRUD de conquista e restaurar a definição usada", async ({ page }) => {
  test.setTimeout(90_000);
  const { email, password } = getAdminCredentials();
  const originalName = "Route Badge Recreated 1780685120";
  const temporaryName = `Conquista E2E ${Date.now()}`;

  await login(page, email, password);
  await expectSuccessfulLogin(page);
  await page.goto("/admin/engagement");
  await expect(page.getByRole("heading", { name: /Gamificação e comunidade/i })).toBeVisible();

  const badgeCard = page.locator("#admin-badges");
  await badgeCard.getByLabel("Filtrar conquistas").fill(originalName);
  const originalItem = badgeCard.locator(".stacked-list-item").filter({ has: page.getByText(originalName) }).first();
  await expect(originalItem).toBeVisible();
  await originalItem.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText("Conquista removida com sucesso.")).toBeVisible();

  await badgeCard.getByLabel("Filtrar conquistas").fill("");
  await badgeCard.getByLabel("Código da conquista").selectOption("TOTAL_PAGES_1000");
  await badgeCard.getByLabel("Nome da conquista").fill(temporaryName);
  await badgeCard.getByLabel("Descrição da conquista").fill("recreated");
  await badgeCard.getByLabel("Critério da conquista").selectOption("TOTAL_PAGES");
  await badgeCard.getByLabel("Valor do critério").fill("1000");
  await badgeCard.getByRole("button", { name: "Criar conquista" }).click();
  await expect(page.getByText("Conquista criada com sucesso.")).toBeVisible();

  await badgeCard.getByLabel("Filtrar conquistas").fill(temporaryName);
  const createdItem = badgeCard.locator(".stacked-list-item").filter({ has: page.getByText(temporaryName) }).first();
  await expect(createdItem).toBeVisible();
  await createdItem.getByRole("button", { name: "Editar" }).click();
  await badgeCard.getByLabel("Nome da conquista").fill(originalName);
  await badgeCard.getByRole("button", { name: "Salvar conquista" }).click();
  await expect(page.getByText("Conquista atualizada com sucesso.")).toBeVisible();

  await badgeCard.getByLabel("Filtrar conquistas").fill(originalName);
  await expect(badgeCard.locator(".stacked-list-item").filter({ has: page.getByText(originalName) }).first()).toBeVisible();
});

test("deve exibir paineis administrativos de usuarios, favoritos e alertas", async ({ page }) => {
  const { email, password } = getAdminCredentials();

  await login(page, email, password);
  await expectSuccessfulLogin(page);
  await expect(page).toHaveURL(/\/$/);

  await openAdmin(page);

  await expect(page.locator("#admin-users").getByRole("heading", { name: "Usuários e permissões" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Favoritos registrados" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Auditoria de alertas" })).toBeVisible();
  await expect(page.getByPlaceholder("Buscar usuários por nome ou email")).toBeVisible();
  await expect(page.getByLabel("Filtrar favoritos administrativos")).toBeVisible();
  await expect(page.getByPlaceholder("Buscar por email, tipo, canal ou mensagem")).toBeVisible();
});

test("deve invalidar um usuario pelo painel admin", async ({ page }) => {
  test.setTimeout(120_000);
  const { email: adminEmail, password: adminPassword } = getAdminCredentials();
  const createdUser = await registerAndLogin(page);

  await logout(page);

  await login(page, adminEmail, adminPassword);
  await expectSuccessfulLogin(page);
  await expect(page).toHaveURL(/\/$/);

  await openAdmin(page);

  await page.getByPlaceholder("Buscar usuários por nome ou email").fill(createdUser.email);

  const userItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(createdUser.email),
  }).first();
  await expect(userItem).toBeVisible({ timeout: 15000 });
  await expect(userItem).toContainText("Ativo");

  const updatedName = `${createdUser.name} Editado`;
  await userItem.getByRole("button", { name: "Editar" }).click();
  await page.getByPlaceholder("Nome do usuário").fill(updatedName);
  await page.getByLabel("Papel do usuário").selectOption("ADMIN");
  await page.getByLabel("Participar do ranking").check();
  await page.getByRole("button", { name: "Salvar usuário" }).click();
  await expect(page.getByText("Usuário atualizado com sucesso.")).toBeVisible({ timeout: 15000 });
  await expect(userItem).toContainText(updatedName);
  await expect(userItem).toContainText("Administrador");
  await expect(userItem).toContainText("Ranking ativo");

  await userItem.getByRole("button", { name: "Invalidar acesso" }).click();
  await expect(page.getByText("Usuário invalidado com sucesso.")).toBeVisible();
  await expect(userItem).toContainText("Invalidado");

  await logout(page);

  await login(page, createdUser.email, createdUser.password);
  await expect(page.getByText("Credenciais inválidas.")).toBeVisible({ timeout: 15000 });

  await login(page, adminEmail, adminPassword);
  await expectSuccessfulLogin(page);
  await expect(page).toHaveURL(/\/$/);
  await openAdmin(page);
  await page.getByPlaceholder("Buscar usuários por nome ou email").fill(createdUser.email);
  const invalidatedUserItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(createdUser.email),
  }).first();
  await expect(invalidatedUserItem).toBeVisible({ timeout: 15000 });
  await invalidatedUserItem.getByRole("button", { name: "Reativar acesso" }).click();
  await expect(page.getByText("Usuário reativado com sucesso.")).toBeVisible();
  await expect(invalidatedUserItem).toContainText("Ativo");

  await logout(page);
  await login(page, createdUser.email, createdUser.password);
  await expectSuccessfulLogin(page);
  await expect(page.getByRole("heading", { name: "Continue sua jornada de leitura" })).toBeVisible({ timeout: 15000 });

  await logout(page);
  await login(page, adminEmail, adminPassword);
  await expectSuccessfulLogin(page);
  await page.goto("/admin/users");
  await page.getByPlaceholder("Buscar usuários por nome ou email").fill(createdUser.email);
  const cleanupUserItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(createdUser.email),
  }).first();
  await expect(cleanupUserItem).toBeVisible({ timeout: 15000 });
  await cleanupUserItem.getByRole("button", { name: "Invalidar acesso" }).click();
  await expect(page.getByText("Usuário invalidado com sucesso.")).toBeVisible();
});

test("deve abrir subrotas especificas do painel admin", async ({ page }) => {
  const { email, password } = getAdminCredentials();

  await login(page, email, password);
  await expectSuccessfulLogin(page);
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/admin/catalog");
  await expect(page).toHaveURL(/\/admin\/catalog$/);
  await expect(page.getByRole("heading", { name: "Acervo e descoberta" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Gamifica..o e comunidade/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Central de Alertas" })).toHaveCount(0);

  await page.goto("/admin/engagement");
  await expect(page).toHaveURL(/\/admin\/engagement$/);
  await expect(page.getByRole("heading", { name: /Gamifica..o e comunidade/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acervo e descoberta" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Central de Alertas" })).toHaveCount(0);

  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/admin\/users$/);
  await expect(page.getByRole("heading", { name: /Gest.*usu.*rios/i }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acervo e descoberta" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Central de Alertas" })).toHaveCount(0);

  await page.goto("/admin/alerts");
  await expect(page).toHaveURL(/\/admin\/alerts$/);
  await expect(page.getByRole("heading", { name: "Central de Alertas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acervo e descoberta" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Gamifica..o e comunidade/ })).toHaveCount(0);
});

test("deve auditar visual real das telas administrativas e do catálogo", async ({ page }) => {
  test.setTimeout(180_000);
  const { email, password } = getAdminCredentials();
  const desktopRoutes = ["/admin", "/admin/catalog", "/admin/engagement", "/admin/users", "/admin/alerts", "/books"];
  const mobileRoutes = ["/admin/catalog", "/admin/engagement", "/admin/users", "/admin/alerts", "/books"];

  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page, email, password);
  await expectSuccessfulLogin(page);

  for (const route of desktopRoutes) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    await waitForRealRouteData(page, route);
    await expectNoRealLayoutFailures(page);
    const name = route.slice(1).replace(/\//g, "-") || "home";
    await page.screenshot({ path: `test-results/priority-real-desktop-${name}.png`, fullPage: true });
  }

  await page.evaluate(() => localStorage.setItem("library.theme.mode", "night"));
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of mobileRoutes) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    await waitForRealRouteData(page, route);
    await expectNoRealLayoutFailures(page);
    const name = route.slice(1).replace(/\//g, "-") || "home";
    await page.screenshot({ path: `test-results/priority-real-mobile-night-${name}.png`, fullPage: true });
  }
});

test("deve auditar visual real de todas as telas do leitor", async ({ page }) => {
  test.setTimeout(240_000);
  const { email, password } = getAdminCredentials();
  const userRoutes = ["/", "/favorites", "/reviews", "/goals", "/badges", "/leaderboard", "/profile"];

  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page, email, password);
  await expectSuccessfulLogin(page);

  const currentReadingRoutes = await getCurrentReadingRoutes(page);
  const desktopRoutes = [
    ...userRoutes,
    currentReadingRoutes.detailsRoute,
    currentReadingRoutes.readingRoute,
  ].filter(Boolean);

  for (const route of desktopRoutes) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    await waitForRealRouteData(page, route);
    await expectNoRealLayoutFailures(page);
    const name = route === "/" ? "home" : route.slice(1).replace(/\//g, "-");
    await page.screenshot({ path: `test-results/user-real-desktop-${name}.png`, fullPage: true });
  }

  await page.evaluate(() => localStorage.setItem("library.theme.mode", "night"));
  await page.setViewportSize({ width: 390, height: 844 });

  const mobileRoutes = [...userRoutes, currentReadingRoutes.readingRoute].filter(Boolean);
  for (const route of mobileRoutes) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    await waitForRealRouteData(page, route);
    await expectNoRealLayoutFailures(page);
    const name = route === "/" ? "home" : route.slice(1).replace(/\//g, "-");
    await page.screenshot({ path: `test-results/user-real-mobile-night-${name}.png`, fullPage: true });
  }
});

test("deve auditar estados vazios reais com uma conta nova", async ({ page }) => {
  test.setTimeout(180_000);
  const { email } = await registerAndLogin(page);
  const { email: adminEmail, password: adminPassword } = getAdminCredentials();
  const emptyRoutes = ["/", "/favorites", "/reviews", "/goals", "/badges", "/profile"];

  try {
    await page.setViewportSize({ width: 1366, height: 768 });
    for (const route of emptyRoutes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
      await waitForRealRouteData(page, route);
      await expectNoRealLayoutFailures(page);
      const name = route === "/" ? "home" : route.slice(1);
      await page.screenshot({ path: `test-results/empty-real-desktop-${name}.png`, fullPage: true });
    }

    await page.evaluate(() => localStorage.setItem("library.theme.mode", "night"));
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of emptyRoutes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
      await waitForRealRouteData(page, route);
      await expectNoRealLayoutFailures(page);
      const name = route === "/" ? "home" : route.slice(1);
      await page.screenshot({ path: `test-results/empty-real-mobile-night-${name}.png`, fullPage: true });
    }

    await page.goto(`/books?q=${encodeURIComponent(`sem-resultado-${Date.now()}`)}`);
    await expect(page.getByRole("heading", { name: "Nenhum livro encontrado" })).toBeVisible({ timeout: 45_000 });
    await expectNoRealLayoutFailures(page);
    await page.screenshot({ path: "test-results/empty-real-mobile-night-books.png", fullPage: true });
  } finally {
    await page.goto("/login");
    await login(page, adminEmail, adminPassword);
    await expectSuccessfulLogin(page);
    await page.goto("/admin/users");
    await page.getByPlaceholder("Buscar usuários por nome ou email").fill(email);
    const userItem = page.locator(".stacked-list-item").filter({ has: page.getByText(email) }).first();
    if (await userItem.isVisible({ timeout: 15_000 }).catch(() => false)) {
      const invalidateButton = userItem.getByRole("button", { name: "Invalidar acesso" });
      if (await invalidateButton.isVisible().catch(() => false)) {
        await invalidateButton.click();
        await expect(page.getByText("Usuário invalidado com sucesso.")).toBeVisible({ timeout: 15_000 });
      }
    }
  }
});

test("deve auditar autenticação nos temas claro e escuro", async ({ page }) => {
  const routes = ["/login", "/register", "/forgot-password"];
  const modes = [
    { name: "desktop-day", theme: "day", width: 1366, height: 768 },
    { name: "mobile-night", theme: "night", width: 390, height: 844 },
  ];

  for (const mode of modes) {
    await page.setViewportSize({ width: mode.width, height: mode.height });
    await page.goto("/login");
    await page.evaluate((theme) => localStorage.setItem("library.theme.mode", theme), mode.theme);

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator(".login-page")).toBeVisible({ timeout: 15_000 });
      await expectNoRealLayoutFailures(page, ".login-page");
      const name = route.slice(1);
      await page.screenshot({ path: `test-results/auth-real-${mode.name}-${name}.png`, fullPage: true });
    }
  }
});

test("deve executar CRUD de livro no painel admin", async ({ page }) => {
  test.setTimeout(120_000);
  const { email, password } = getAdminCredentials();
  const stamp = Date.now();
  const originalTitle = `000 Livro E2E ${stamp}`;
  const updatedTitle = `${originalTitle} Editado`;
  const originalAuthor = `Autor E2E ${stamp}`;
  const updatedAuthor = `${originalAuthor} Final`;
  const isbn = `97865${String(stamp).slice(-8)}`;

  await login(page, email, password);
  await expectSuccessfulLogin(page);
  await expect(page).toHaveURL(/\/$/);

  await openAdmin(page);

  const bookCard = page.locator("article.card").filter({
    has: page.getByRole("heading", { name: /Cadastrar livro|Editar livro/ }),
  }).first();

  await bookCard.getByPlaceholder("Título", { exact: true }).fill(originalTitle);
  await bookCard.getByPlaceholder("Autor", { exact: true }).fill(originalAuthor);
  await bookCard.getByPlaceholder("ISBN", { exact: true }).fill(isbn);
  await bookCard.getByRole("spinbutton").first().fill("222");
  await bookCard.getByLabel("Arquivo de leitura do novo livro").setInputFiles("e2e/fixtures/minimal-book.pdf");
  await expect(bookCard.getByText("minimal-book.pdf")).toBeVisible();
  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/admin/books") &&
      response.status() === 201
  );
  await bookCard.getByRole("button", { name: "Publicar livro" }).click();
  const createdBook = (await createResponsePromise).json() as Promise<{ id: string }>;
  const createdBookId = (await createdBook).id;
  await expect(page.getByText("Livro criado com PDF de leitura interna.")).toBeVisible({ timeout: 20000 });
  await page.getByLabel("Filtrar livros administrativos").fill(originalTitle);

  const createdItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(originalTitle),
  }).first();
  await expect(createdItem).toBeVisible();

  await createdItem.getByRole("button", { name: "Editar" }).click();
  await expect(bookCard.getByRole("heading", { name: "Editar livro" })).toBeVisible();
  await bookCard.getByPlaceholder("Título", { exact: true }).fill(updatedTitle);
  await bookCard.getByPlaceholder("Autor", { exact: true }).fill(updatedAuthor);
  await bookCard.getByRole("button", { name: "Salvar livro" }).click();
  await expect(page.getByText("Livro atualizado com sucesso.")).toBeVisible();

  const updatedItem = page.locator(".stacked-list-item").filter({
    has: page.getByText(updatedTitle),
  }).first();
  await expect(updatedItem).toBeVisible();
  await expect(updatedItem).toContainText(updatedAuthor);

  const coverUrl = "https://example.com/library-e2e-cover.jpg";
  await page.getByLabel("Nova URL da capa").fill(coverUrl);
  await page.getByRole("button", { name: "Atualizar imagem" }).click();
  await expect(page.getByText("Capa do livro atualizada com sucesso.")).toBeVisible();

  await page.getByLabel("Arquivo de leitura do livro").setInputFiles("e2e/fixtures/minimal-book.pdf");
  await page.getByRole("button", { name: "Enviar arquivo" }).click();
  await expect(page.getByText("PDF enviado com sucesso.")).toBeVisible();

  await page.goto(`/books/${createdBookId}/read`);
  await expect(page.getByRole("heading", { name: "Leitura integrada" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByTitle(new RegExp(`Leitor PDF - ${updatedTitle}`))).toBeVisible({ timeout: 15000 });

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Painel administrativo" })).toBeVisible();
  await page.getByLabel("Filtrar livros administrativos").fill(updatedTitle);
  const itemToRemove = page.locator(".stacked-list-item").filter({
    has: page.getByText(updatedTitle),
  }).first();
  await expect(itemToRemove).toBeVisible();

  await itemToRemove.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText("Livro removido com sucesso.")).toBeVisible();
  await expect(page.getByText(updatedTitle)).toHaveCount(0);
});
