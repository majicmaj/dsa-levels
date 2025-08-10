export type QuizOption = {
  key: string; // e.g., "A", "B" or "1", etc.
  text: string;
  correct: boolean;
};

export type QuizQuestion = {
  id: string; // q1, q2 ...
  prompt: string;
  options: QuizOption[];
};

export type ParsedQuiz = {
  id: string;
  questions: QuizQuestion[];
};

/**
 * Extracts the quiz section from markdown by locating a heading that starts with
 * "## Quiz" (case-insensitive). Returns both the raw quiz markdown section and
 * the original content with that section removed.
 */
export function extractQuizSection(markdown: string): {
  quizSection: string | null;
  stripped: string;
} {
  const lines = markdown.split(/\r?\n/);
  const startIdx = lines.findIndex((l) => /^##\s+quiz/i.test(l.trim()));
  if (startIdx === -1) return { quizSection: null, stripped: markdown };

  // Find next heading of same or higher level (## ...)
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (/^##\s+/.test(t)) {
      endIdx = i;
      break;
    }
  }

  const quizSection = lines.slice(startIdx, endIdx).join("\n");
  const stripped = [...lines.slice(0, startIdx), ...lines.slice(endIdx)].join(
    "\n"
  );
  return { quizSection, stripped };
}

/**
 * Parses a quiz from a markdown section. Supports two option formats within a
 * question block:
 * 1) Lettered choices: "A) ...", "B) ..." possibly ending with ✅ or ❌
 * 2) Bulleted choices: "* ... ✅" or "* ... ❌" (used for multi-select)
 *
 * A question block is introduced by a numbered line: "1. Question text".
 */
export function parseQuizFromSection(
  section: string,
  quizId: string
): ParsedQuiz | null {
  if (!section) return null;
  const lines = section.split(/\r?\n/);
  // Trim off the heading line (## Quiz ...)
  const bodyStart = lines.findIndex((l) => /^##\s+/i.test(l.trim()));
  const workLines = bodyStart === -1 ? lines : lines.slice(bodyStart + 1);

  // Group into question blocks
  const questions: QuizQuestion[] = [];
  let current: { promptLines: string[]; optionLines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const prompt = current.promptLines.join(" ").trim();
    const options = parseOptions(current.optionLines);
    if (prompt && options.length > 0) {
      const id = `q${questions.length + 1}`;
      questions.push({ id, prompt, options });
    }
    current = null;
  };

  for (let i = 0; i < workLines.length; i++) {
    const line = workLines[i];
    const m = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (m) {
      // New question
      flush();
      current = { promptLines: [m[2].trim()], optionLines: [] };
      continue;
    }
    if (!current) continue;

    // Stop collection on blank heading or horizontal rule
    if (/^---\s*$/.test(line) || /^##\s+/.test(line.trim())) {
      flush();
      break;
    }
    current.optionLines.push(line);
  }
  flush();

  if (questions.length === 0) return null;
  return { id: quizId, questions };
}

function parseOptions(lines: string[]): QuizOption[] {
  const options: QuizOption[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // Skip code fences and code content
    if (/^```/.test(line)) continue;

    // Lettered: A) foo bar ✅
    let m = line.match(/^([A-Z])\)\s+(.+?)(?:\s*(✅|❌))?\s*$/);
    if (m) {
      const [, key, text, mark] = m;
      options.push({ key, text: text.trim(), correct: mark === "✅" });
      continue;
    }
    // Bulleted: * something ✅
    m = line.match(/^\*\s+(.+?)(?:\s*(✅|❌))?\s*$/);
    if (m) {
      const [, text, mark] = m;
      const key = String.fromCharCode("A".charCodeAt(0) + options.length);
      options.push({ key, text: text.trim(), correct: mark === "✅" });
      continue;
    }
  }
  return options;
}

export function computeIsMultiSelect(question: QuizQuestion): boolean {
  return question.options.filter((o) => o.correct).length > 1;
}

export function quizStorageKeys(quizId: string) {
  return {
    answers: `quiz.answers.${quizId}`,
    submitted: `quiz.submitted.${quizId}`,
    score: `quiz.score.${quizId}`,
  } as const;
}
