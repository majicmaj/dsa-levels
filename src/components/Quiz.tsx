import { useEffect, useState } from "react";
import type { ParsedQuiz, QuizQuestion } from "@/lib/quiz";
import { computeIsMultiSelect, quizStorageKeys } from "@/lib/quiz";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InlineMD } from "@/components/InlineMD";
import { MD } from "@/content/md";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  }, [answers]);

  useEffect(() => {
    setAnswers(() => {
      try {
        return JSON.parse(localStorage.getItem(keys.answers) || "{}");
      } catch {
        return {};
      }
    });
    setSubmitted(() => {
      return localStorage.getItem(keys.submitted) === "1";
    });
    setScore(() => {
      const raw = localStorage.getItem(keys.score);
      return raw ? Number(raw) : 0;
    });
  }, [keys.answers, setAnswers]);

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
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Quiz</h2>
        {submitted ? (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-sm text-accent-foreground">
            Score: {score}%
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        <ol className="space-y-5">
          {quiz.questions.map((q, idx) => (
            <li key={q.id} className="rounded-xl border bg-background p-4">
              <div className="font-medium">
                <span className="mr-1">{idx + 1}.</span>
                {/* Render full markdown for prompt so code fences display */}
                <MD markdown={q.prompt} />
              </div>

              {computeIsMultiSelect(q) ? (
                <ul className="mt-3 space-y-2">
                  {q.options.map((o) => {
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
                        <Checkbox
                          id={`${q.id}-${o.key}`}
                          checked={isChecked}
                          onCheckedChange={(v) =>
                            toggleAnswer(q, o.key, Boolean(v))
                          }
                          disabled={submitted}
                        />
                        <Label
                          htmlFor={`${q.id}-${o.key}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <span className="mr-1 inline-block w-5 text-zinc-500">
                            {o.key})
                          </span>
                          <InlineMD text={o.text} />
                        </Label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <RadioGroup
                  value={(answers[q.id] || [])[0] || ""}
                  className="mt-3"
                >
                  {q.options.map((o) => {
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
                      <div
                        key={o.key}
                        className={
                          "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 " +
                          borderClass
                        }
                      >
                        <RadioGroupItem
                          id={`${q.id}-${o.key}`}
                          value={o.key}
                          onClick={() => toggleAnswer(q, o.key, true)}
                          disabled={submitted}
                        />
                        <Label
                          htmlFor={`${q.id}-${o.key}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <span className="mr-1 inline-block w-5 text-zinc-500">
                            {o.key})
                          </span>
                          <InlineMD text={o.text} />
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}
            </li>
          ))}
        </ol>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={onSubmit} disabled={submitted}>
            {submitted ? "Submitted" : "Submit"}
          </Button>
          <Button variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
