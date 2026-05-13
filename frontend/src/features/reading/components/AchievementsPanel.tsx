import type { NarrativeAchievement } from "../types";
import { humanizeNarrativeText } from "../lib/readingPresentation";

type AchievementsPanelProps = {
  achievements: NarrativeAchievement[];
};

export function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  return (
    <article className="card narrative-panel">
      <div className="section-head">
        <h3>Conquistas e flashcards</h3>
        <span className="kpi">{achievements.length} item(ns)</span>
      </div>
      {achievements.length ? (
        <div className="flashcards">
          {achievements.map((achievement) => (
            <article
              key={achievement.code}
              className={achievement.unlocked ? "flashcard unlocked" : "flashcard locked"}
            >
              <p className="flash-symbol">{achievement.flashcardSymbol ?? "CARD"}</p>
              <h4>{humanizeNarrativeText(achievement.title)}</h4>
              <p>{humanizeNarrativeText(achievement.description)}</p>
              <small>
                {achievement.unlocked ? "Desbloqueado" : `Bloqueado até página ${achievement.unlockPage ?? "?"}`}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel-inline-state narrative-empty" role="status">
          <p className="eyebrow">Sem conquistas deste livro</p>
          <h3>Flashcards ainda não cadastrados</h3>
          <p className="section-sub">
            A leitura continua salva normalmente. Quando a curadoria narrativa for adicionada, os cartões aparecem aqui.
          </p>
        </div>
      )}
    </article>
  );
}
