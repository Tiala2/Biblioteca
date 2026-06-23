import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Category, CategoryForm } from "../types";
import { focusAdminPanelForm } from "../lib/focus";
import { AdminEmptyState } from "./AdminEmptyState";

type CategoryPanelProps = {
  form: CategoryForm;
  categories: Category[];
  busyKey: string | null;
  onSubmit: (event: FormEvent) => Promise<void>;
  onFormChange: (updater: (previous: CategoryForm) => CategoryForm) => void;
  onEdit: (category: Category) => void;
  onReset: () => void;
  onDelete: (categoryId: string) => void;
};

export function CategoryPanel({
  form,
  categories,
  busyKey,
  onSubmit,
  onFormChange,
  onEdit,
  onReset,
  onDelete,
}: CategoryPanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 4;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    if (!normalizedSearch) return categories;
    return categories.filter((category) =>
      `${category.name} ${category.description ?? ""}`.toLowerCase().includes(normalizedSearch)
    );
  }, [categories, normalizedSearch]);
  const categoryInsights = useMemo(() => {
    const withDescription = categories.filter((category) => Boolean(category.description?.trim())).length;
    const withoutDescription = categories.length - withDescription;
    const longestName = categories.reduce<Category | null>((current, category) => {
      if (!current) return category;
      return category.name.length > current.name.length ? category : current;
    }, null);

    return { longestName, withDescription, withoutDescription };
  }, [categories]);
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const visibleCategories = filteredCategories.slice(page * pageSize, page * pageSize + pageSize);
  const saving = busyKey === "category-create" || busyKey === `category-save-${form.id}`;
  const editCategory = (category: Category) => {
    onEdit(category);
    focusAdminPanelForm("admin-categories");
  };

  return (
    <article id="admin-categories" className="card admin-panel">
      <h3>{form.id ? "Editar categoria" : "Organizar categoria"}</h3>
      <form className="admin-form" onSubmit={onSubmit}>
        <input
          aria-label="Nome da categoria"
          value={form.name}
          onChange={(event) => onFormChange((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Nome"
          required
        />
        <input
          aria-label="Descrição da categoria"
          value={form.description}
          onChange={(event) => onFormChange((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Descrição"
        />
        <button type="submit" disabled={saving}>
          {saving ? "Salvando..." : form.id ? "Salvar categoria" : "Criar categoria"}
        </button>
        {form.id && (
          <button type="button" className="btn-muted" onClick={onReset}>
            Cancelar
          </button>
        )}
      </form>
      <div className="section-head">
        <h4>Categorias do acervo</h4>
        <span className="kpi">{filteredCategories.length}</span>
      </div>
      <div className="admin-taxonomy-summary">
        <div className="stat-box admin-list-stat">
          <strong>{categoryInsights.withDescription}</strong>
          <span>com descrição</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{categoryInsights.withoutDescription}</strong>
          <span>a descrever</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{categoryInsights.longestName?.name ?? "Ainda sem categorias"}</strong>
          <span>nome mais longo</span>
        </div>
      </div>
      <input
        aria-label="Filtrar categorias"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        placeholder="Buscar categoria"
      />
      <ul className="stacked-list">
        {visibleCategories.map((category) => (
          <li key={category.id} className="stacked-list-item">
            <button type="button" className="admin-row-action" onClick={() => editCategory(category)}>
              <div className="admin-taxonomy-title-row">
                <strong>{category.name}</strong>
                <span className={category.description ? "import-badge" : "status-pill status-pill--muted"}>
                  {category.description ? "Descrita" : "A descrever"}
                </span>
              </div>
              <p className="section-sub">{category.description || "Adicione uma descrição para orientar melhor a descoberta."}</p>
            </button>
            <div className="card-actions admin-list-actions">
              <button type="button" className="btn-muted" onClick={() => editCategory(category)}>
                Editar
              </button>
              <button type="button" className="btn-muted btn-danger" disabled={busyKey === `category-delete-${category.id}`} onClick={() => onDelete(category.id)}>
                {busyKey === `category-delete-${category.id}` ? "Removendo..." : "Remover"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {filteredCategories.length === 0 && <AdminEmptyState title="Nenhuma categoria encontrada" message="Revise o filtro ou crie uma categoria para organizar melhor o catálogo." />}
      {filteredCategories.length > pageSize && (
        <div className="pagination-row">
          <button type="button" className="btn-muted" disabled={page <= 0} onClick={() => setPage((previous) => Math.max(0, previous - 1))}>
            Anterior
          </button>
          <span className="section-sub">Página {page + 1} de {totalPages}</span>
          <button type="button" className="btn-muted" disabled={page + 1 >= totalPages} onClick={() => setPage((previous) => Math.min(totalPages - 1, previous + 1))}>
            Próxima
          </button>
        </div>
      )}
    </article>
  );
}
