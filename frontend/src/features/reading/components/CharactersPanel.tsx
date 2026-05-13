import type { NarrativeCharacter } from "../types";
import { formatNarrativeRole, humanizeNarrativeText } from "../lib/readingPresentation";

type CharactersPanelProps = {
  characters: NarrativeCharacter[];
};

export function CharactersPanel({ characters }: CharactersPanelProps) {
  return (
    <article className="card narrative-panel">
      <div className="section-head">
        <h3>Quem é quem</h3>
        <span className="kpi">{characters.length} personagem(ns)</span>
      </div>
      {characters.length ? (
        <ul className="stacked-list character-list">
          {characters.map((character) => (
            <li key={`${character.name}-${character.role}`} className="stacked-list-item">
              <div>
                <strong>{character.name}</strong>
                <p className="role-pill narrative-role">{formatNarrativeRole(character.role)}</p>
              </div>
              <span className="section-sub">{humanizeNarrativeText(character.note)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel-inline-state narrative-empty" role="status">
          <p className="eyebrow">Dinâmica em preparação</p>
          <h3>Personagens ainda não mapeados</h3>
          <p className="section-sub">
            Este livro ainda não tem elenco narrativo cadastrado para a página atual. O progresso continua funcionando normalmente.
          </p>
        </div>
      )}
    </article>
  );
}
