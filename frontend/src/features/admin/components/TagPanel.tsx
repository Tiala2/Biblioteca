import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Tag, TagForm } from "../types";

type TagPanelProps = {
  form: TagForm;
  tags: Tag[];
  busyKey: string | null;
  onSubmit: (event: FormEvent) => Promise<void>;
  onFormChange: (updater: (previous: TagForm) => TagForm) => void;
  onEdit: (tag: Tag) => void;
  onReset: () => void;
  onDelete: (tagId: string) => void;
};

export function TagPanel({ form, tags, busyKey, onSubmit, onFormChange, onEdit, onReset, onDelete }: TagPanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredTags = useMemo(() => {
    if (!normalizedSearch) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(normalizedSearch));
  }, [normalizedSearch, tags]);
  const totalPages = Math.max(1, Math.ceil(filteredTags.length / pageSize));
  const visibleTags = filteredTags.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <article id="admin-tags" className="card admin-panel">
      <h3>{form.id ? "Editar tag" : "Nova tag"}</h3>
      <form className="admin-form" onSubmit={onSubmit}>
        <input value={form.name} onChange={(event) => onFormChange((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nome" required />
        <button type="submit" disabled={busyKey === "tag-create" || busyKey === `tag-save-${form.id}`}>
          {form.id ? "Salvar tag" : "Criar tag"}
        </button>
        {form.id && (
          <button type="button" className="btn-muted" onClick={onReset}>
            Cancelar
          </button>
        )}
      </form>
      <div className="section-head">
        <h4>Lista de tags</h4>
        <span className="kpi">{filteredTags.length}</span>
      </div>
      <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Filtrar tags" />
      <ul className="stacked-list">
        {visibleTags.map((tag) => (
          <li key={tag.id} className="stacked-list-item">
            <strong>{tag.name}</strong>
            <div className="card-actions">
              <button type="button" className="btn-muted" onClick={() => onEdit(tag)}>
                Editar
              </button>
              <button type="button" className="btn-muted" disabled={busyKey === `tag-delete-${tag.id}`} onClick={() => onDelete(tag.id)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
      {filteredTags.length === 0 && <p className="section-sub">Nenhuma tag encontrada para esse filtro.</p>}
      {filteredTags.length > pageSize && (
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
