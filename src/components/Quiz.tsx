import { useEffect, useMemo, useState } from "react";
import type { ParsedQuiz, QuizQuestion } from "@/lib/quiz";
import { computeIsMultiSelect, quizStorageKeys } from "@/lib/quiz";

type Props = {
  quiz: ParsedQuiz;
};

export default function Quiz({ quiz }: Props) {
  const keys = quizStorageKeys(quiz.id);
  const [answers, setAnswers] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem(keys.answers) || "{}");
    } catch {
      return {};
    }
  });
  const [submitted, setSubmitted] = useState<boolean>(() => {
    return localStorage.getItem(keys.submitted) === "1";
  });
  const [score, setScore] = useState<number>(() => {
    const raw = localStorage.getItem(keys.score);
    return raw ? Number(raw) : 0;
  });

  useEffect(() => {
    localStorage.setItem(keys.answers, JSON.stringify(answers));
  }, [answers, keys.answers]);

  function toggleAnswer(q: QuizQuestion, optKey: string, checked: boolean) {
    setAnswers((prev) => {
      const cur = new Set(prev[q.id] || []);
      if (computeIsMultiSelect(q)) {
        if (checked) cur.add(optKey);
        else cur.delete(optKey);
        return { ...prev, [q.id]: Array.from(cur) };
      } else {
        return { ...prev, [q.id]: [optKey] };
      }
    });
  }

  function onSubmit() {
    let correct = 0;
    for (const q of quiz.questions) {
      const chosen = new Set(answers[q.id] || []);
      const ok = q.options.every((o) => {
        const should = o.correct;
        const has = chosen.has(o.key);
        return should === has;
      });
      if (ok) correct++;
    }
    const s = Math.round((correct / quiz.questions.length) * 100);
    setScore(s);
    setSubmitted(true);
    localStorage.setItem(keys.submitted, "1");
    localStorage.setItem(keys.score, String(s));
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    localStorage.removeItem(keys.answers);
    localStorage.removeItem(keys.submitted);
    localStorage.removeItem(keys.score);
  }

  return (
    <section className="rounded-2xl border bg-card p-5">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">Quiz</h2>
        {submitted ? (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-sm text-accent-foreground">
            Score: {score}%
          </span>
        ) : null}
      </header>

      <ol className="space-y-5">
        {quiz.questions.map((q, idx) => (
          <li key={q.id} className="rounded-xl border bg-background p-4">
            <p className="font-medium">
              {idx + 1}. {q.prompt}
            </p>
            <ul className="mt-3 space-y-2">
              {q.options.map((o) => {
                const multi = computeIsMultiSelect(q);
                const chosen = new Set(answers[q.id] || []);
                const isChecked = chosen.has(o.key);
                const showResult = submitted;
                const isCorrect = o.correct;
                const borderClass = showResult
                  ? isCorrect
                    ? "border-emerald-400"
                    : isChecked
                    ? "border-rose-400"
                    : "border-transparent"
                  : "border-transparent";
                return (
                  <li
                    key={o.key}
                    className={
                      "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 " +
                      borderClass
                    }
                  >
                    <label className="flex w-full cursor-pointer items-center gap-2">
                      <input
                        type={multi ? "checkbox" : "radio"}
                        name={q.id}
                        value={o.key}
                        checked={isChecked}
                        onChange={(e) =>
                          toggleAnswer(
                            q,
                            o.key,
                            (e.target as HTMLInputElement).checked
                          )
                        }
                        disabled={submitted}
                      />
                      <span className="text-sm">
                        <span className="mr-1 inline-block w-5 text-zinc-500">
                          {o.key})
                        </span>
                        {o.text}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={submitted}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {submitted ? "Submitted" : "Submit"}
        </button>
        <button
          onClick={reset}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
