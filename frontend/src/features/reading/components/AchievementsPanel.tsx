import { BadgeCheck, BookMarked } from "lucide-react";
import { pluralizePt } from "@shared/lib/presentation";
import { humanizeNarrativeText } from "../lib/readingPresentation";
import type { NarrativeAchievement } from "../types";

type AchievementsPanelProps = {
  achievements: NarrativeAchievement[];
};

const FLASHCARD_SYMBOL_LABELS: Record<string, string> = {
  CROWN: "Conquista desbloqueada",
  WOLF: "Conquista especial",
  CARD: "Flashcard",
};

function formatFlashcardSymbol(value?: string | null) {
  if (!value) return FLASHCARD_SYMBOL_LABELS.CARD;
  return FLASHCARD_SYMBOL_LABELS[value] ?? humanizeNarrativeText(value.replaceAll("_", " ").toLowerCase());
}

export function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  return (
    <article className="card narrative-panel">
      <div className="section-head">
        <h3>Conquistas da leitura</h3>
        <span className="kpi">{pluralizePt(achievements.length, "item", "itens")}</span>
      </div>
      {achievements.length ? (
        <div className="flashcards">
          {achievements.map((achievement) => (
            <article key={achievement.code} className={achievement.unlocked ? "flashcard unlocked" : "flashcard locked"}>
              <p className="flash-symbol">
                <BadgeCheck aria-hidden="true" />
                {formatFlashcardSymbol(achievement.flashcardSymbol)}
              </p>
              <h4>{humanizeNarrativeText(achievement.title)}</h4>
              <p>{humanizeNarrativeText(achievement.description)}</p>
              <small>{achievement.unlocked ? "Conquistado" : "Continue lendo para desbloquear"}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel-inline-state narrative-empty" role="status">
          <BookMarked aria-hidden="true" />
          <p className="eyebrow">Sem cartões narrativos</p>
          <h3>Nenhum flashcard cadastrado ainda.</h3>
          <p className="section-sub">A leitura continua salva; os cartões aparecem aqui quando a curadoria for criada.</p>
        </div>
      )}
    </article>
  );
}
