import { UsersRound } from "lucide-react";
import { pluralizePt } from "@shared/lib/presentation";
import { formatNarrativeRole, humanizeNarrativeText } from "../lib/readingPresentation";
import type { NarrativeCharacter } from "../types";

type CharactersPanelProps = {
  characters: NarrativeCharacter[];
};

export function CharactersPanel({ characters }: CharactersPanelProps) {
  return (
    <article className="card narrative-panel">
      <div className="section-head">
        <h3>Personagens deste trecho</h3>
        <span className="kpi">{pluralizePt(characters.length, "personagem", "personagens")}</span>
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
          <UsersRound aria-hidden="true" />
          <p className="eyebrow">Elenco em preparo</p>
          <h3>Nenhum personagem cadastrado para este trecho.</h3>
          <p className="section-sub">Continue lendo normalmente; a curadoria aparece aqui quando estiver disponível.</p>
        </div>
      )}
    </article>
  );
}
