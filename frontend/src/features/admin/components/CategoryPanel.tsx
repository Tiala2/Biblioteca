import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Category, CategoryForm } from "../types";

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
  const pageSize = 6;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    if (!normalizedSearch) return categories;
    return categories.filter((category) =>
      `${category.name} ${category.description ?? ""}`.toLowerCase().includes(normalizedSearch)
    );
  }, [categories, normalizedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const visibleCategories = filteredCategories.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <article id="admin-categories" className="card admin-panel">
      <h3>{form.id ? "Editar categoria" : "Nova categoria"}</h3>
      <form className="admin-form" onSubmit={onSubmit}>
        <input value={form.name} onChange={(event) => onFormChange((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nome" required />
        <input
          value={form.description}
          onChange={(event) => onFormChange((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Descricao"
        />
        <button type="submit" disabled={busyKey === "category-create" || busyKey === `category-save-${form.id}`}>
          {form.id ? "Salvar categoria" : "Criar categoria"}
        </button>
        {form.id && (
          <button type="button" className="btn-muted" onClick={onReset}>
            Cancelar
          </button>
        )}
      </form>
      <div className="section-head">
        <h4>Lista de categorias</h4>
        <span className="kpi">{filteredCategories.length}</span>
      </div>
      <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Filtrar categorias" />
      <ul className="stacked-list">
        {visibleCategories.map((category) => (
          <li key={category.id} className="stacked-list-item">
            <div>
              <strong>{category.name}</strong>
              <p className="section-sub">{category.description || "Sem descricao"}</p>
            </div>
            <div className="card-actions">
              <button type="button" className="btn-muted" onClick={() => onEdit(category)}>
                Editar
              </button>
              <button type="button" className="btn-muted" disabled={busyKey === `category-delete-${category.id}`} onClick={() => onDelete(category.id)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
      {filteredCategories.length === 0 && <p className="section-sub">Nenhuma categoria encontrada para esse filtro.</p>}
      {filteredCategories.length > pageSize && (
        <div className="pagination-row">
          <button type="button" className="btn-muted" disabled={page <= 0} onClick={() => setPage((previous) => Math.max(0, previous - 1))}>
            Anterior
          </button>
          <span className="section-sub">Pagina {page + 1} de {totalPages}</span>
          <button type="button" className="btn-muted" disabled={page + 1 >= totalPages} onClick={() => setPage((previous) => Math.min(totalPages - 1, previous + 1))}>
            Proxima
          </button>
        </div>
      )}
    </article>
  );
}
