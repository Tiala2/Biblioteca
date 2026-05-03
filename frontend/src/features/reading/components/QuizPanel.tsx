import type { NarrativeQuiz } from "../types";

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
    <article className="card">
      <div className="section-head">
        <h3>Quiz do trecho</h3>
        <span className="kpi">{quizzes.length} pergunta(s)</span>
      </div>
      {quizzes.length ? (
        <div className="quiz-list">
          {quizzes.map((quiz) => (
            <article key={quiz.id} className="quiz-card">
              <h4>{quiz.question}</h4>
              <div className="quiz-options">
                {quiz.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={getQuizOptionClassName(quiz, option, selectedOptions, revealed)}
                    aria-pressed={selectedOptions[quiz.id] === option}
                    onClick={() => onSelectOption(quiz.id, option)}
                  >
                    {option}
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
                <small>
                  {selectedOptions[quiz.id] === quiz.correctOption ? "Correto. " : "Incorreto. "}
                  {quiz.explanation}
                </small>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="section-sub">Nenhum quiz para a pagina selecionada.</p>
      )}
    </article>
  );
}
