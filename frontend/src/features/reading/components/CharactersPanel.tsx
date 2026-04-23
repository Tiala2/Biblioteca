import type { NarrativeCharacter } from "../types";

type CharactersPanelProps = {
  characters: NarrativeCharacter[];
};

export function CharactersPanel({ characters }: CharactersPanelProps) {
  return (
    <article className="card">
      <div className="section-head">
        <h3>Quem e quem</h3>
        <span className="kpi">{characters.length} personagem(ns)</span>
      </div>
      {characters.length ? (
        <ul className="stacked-list">
          {characters.map((character) => (
            <li key={`${character.name}-${character.role}`} className="stacked-list-item">
              <div>
                <strong>{character.name}</strong>
                <p className="section-sub">{character.role}</p>
              </div>
              <span>{character.note}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="section-sub">Nenhum personagem mapeado neste trecho.</p>
      )}
    </article>
  );
}
