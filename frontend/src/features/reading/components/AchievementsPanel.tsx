import type { NarrativeAchievement } from "../types";

type AchievementsPanelProps = {
  achievements: NarrativeAchievement[];
};

export function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  return (
    <article className="card">
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
              <h4>{achievement.title}</h4>
              <p>{achievement.description}</p>
              <small>
                {achievement.unlocked ? "Desbloqueado" : `Bloqueado ate pagina ${achievement.unlockPage ?? "?"}`}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <p className="section-sub">Sem conquistas mapeadas para este livro.</p>
      )}
    </article>
  );
}
