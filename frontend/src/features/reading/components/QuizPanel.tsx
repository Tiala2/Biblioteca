import type { NarrativeQuiz } from "../types";
import { humanizeNarrativeText } from "../lib/readingPresentation";

type QuizPanelProps = {
  quizzes: NarrativeQuiz[];
  selectedOptions: Record<string, string>;
  revealed: Record<string, boolean>;
  onSelectOption: (quizId: string, option: string) => void;
  onCheckQuiz: (quizId: string) => void;
};

function getQuizOptionClassName(
  quiz: NarrativeQuiz,
  option: string,
  selectedOptions: Record<string, string>,
  revealed: Record<string, boolean>
) {
  const selected = selectedOptions[quiz.id] === option;
  const isCorrect = quiz.correctOption === option;
  const showResult = revealed[quiz.id];

  if (showResult) {
    if (isCorrect) return "quiz-option correct";
    if (selected) return "quiz-option wrong";
    return "quiz-option";
  }

  return selected ? "quiz-option selected" : "quiz-option";
}

export function QuizPanel({
  quizzes,
  selectedOptions,
  revealed,
  onSelectOption,
  onCheckQuiz,
}: QuizPanelProps) {
  return (
    <article className="card narrative-panel">
      <div className="section-head">
        <h3>Quiz do trecho</h3>
        <span className="kpi">{quizzes.length} pergunta(s)</span>
      </div>
      {quizzes.length ? (
        <div className="quiz-list">
          {quizzes.map((quiz) => (
            <article key={quiz.id} className="quiz-card">
              <h4>{humanizeNarrativeText(quiz.question)}</h4>
              <div className="quiz-options">
                {quiz.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={getQuizOptionClassName(quiz, option, selectedOptions, revealed)}
                    aria-pressed={selectedOptions[quiz.id] === option}
                    onClick={() => onSelectOption(quiz.id, option)}
                  >
                    {humanizeNarrativeText(option)}
                  </button>
                ))}
              </div>
              <div className="card-actions">
                <button
                  type="button"
                  className="btn-muted"
                  onClick={() => onCheckQuiz(quiz.id)}
                  disabled={!selectedOptions[quiz.id]}
                >
                  Verificar resposta
                </button>
              </div>
              {revealed[quiz.id] ? (
                <small className="quiz-feedback">
                  {selectedOptions[quiz.id] === quiz.correctOption ? "Correto. " : "Incorreto. "}
                  {humanizeNarrativeText(quiz.explanation)}
                </small>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="panel-inline-state narrative-empty" role="status">
          <p className="eyebrow">Sem pergunta nesta página</p>
          <h3>Quiz ainda não disponível</h3>
          <p className="section-sub">
            Quando este livro receber perguntas por trecho, elas aparecerão aqui conforme a página de leitura.
          </p>
        </div>
      )}
    </article>
  );
}
