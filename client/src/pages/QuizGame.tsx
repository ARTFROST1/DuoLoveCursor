import { useSearchParams } from "react-router-dom";
import { useQuizSocket } from "../hooks/useQuizSocket";
import { useAppStore } from "../store";
import { useState } from "react";

export default function QuizGame() {
  const [search] = useSearchParams();
  const sessionId = Number(search.get("session"));
  const userId = useAppStore((s) => s.userId) ?? 0;

  const { state, sendPrefill, sendAnswer } = useQuizSocket(sessionId, userId);

  // Prefill local state
  const [prefillAnswers, setPrefillAnswers] = useState<Record<number, string>>({});

  // Handlers
  const handlePrefillSubmit = () => {
    // Map answers to string keys of question id
    const mapped: Record<string, string> = {};
    Object.entries(prefillAnswers).forEach(([qid, ans]) => {
      mapped[qid] = ans;
    });
    sendPrefill(mapped);
  };

  // JSX helpers
  if (state.phase === "prefill" && state.prefillQuestions) {
    return (
      <div style={{ padding: 16 }}>
        <h3>Ответьте на вопросы о себе</h3>
        {state.prefillQuestions.map((q) => (
          <div key={q.id} style={{ marginBottom: 12 }}>
            <p>{q.text}</p>
            {q.options.map((opt) => (
              <label key={opt} style={{ marginRight: 8 }}>
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value={opt}
                  checked={prefillAnswers[q.id] === opt}
                  onChange={() => {
                    setPrefillAnswers((prev) => ({ ...prev, [q.id]: opt }));
                  }}
                />
                {opt}
              </label>
            ))}
          </div>
        ))}
        <button
          onClick={handlePrefillSubmit}
          disabled={Object.keys(prefillAnswers).length !== state.prefillQuestions.length}
          style={{ padding: 12 }}
        >
          Сохранить
        </button>
      </div>
    );
  }

  if (state.phase === "waiting") {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <p>Ждём партнёра…</p>
      </div>
    );
  }

  if (state.phase === "question" && state.question) {
    const q = state.question;
    return (
      <div style={{ padding: 16 }}>
        <h3>
          Вопрос {q.round}/{q.total}
        </h3>
        <p style={{ fontSize: 18, marginBottom: 12 }}>{q.text}</p>
        {q.options.map((opt) => (
          <button
            key={opt}
            style={{ display: "block", marginBottom: 8, padding: 12, width: "100%" }}
            onClick={() => sendAnswer(q.round, opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (state.phase === "reveal" && state.reveal) {
    const r = state.reveal;
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <p>Ваш выбор: {r.selected}</p>
        <p>Ответ партнёра: {r.actual ?? "—"}</p>
        <p>{r.match ? "Совпало!" : "Не угадали"}</p>
        <p>
          Счет: {r.youScore} — {r.partnerScore}
        </p>
        <p>Ждём следующего вопроса…</p>
      </div>
    );
  }

  if (state.phase === "summary" && state.summary) {
    const s = state.summary;
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <h2>Итог</h2>
        <p>
          Счет: {s.youScore} — {s.partnerScore}
        </p>
        {s.winnerId === userId ? <p>Вы победили 🎉</p> : s.winnerId ? <p>Победил партнёр</p> : <p>Ничья</p>}
        <button onClick={() => (window.location.href = "/")}>На главную</button>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div style={{ padding: 16, color: "red" }}>{state.error}</div>
    );
  }

  return null;
}
