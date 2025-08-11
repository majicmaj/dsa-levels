# Contributing to DSA Levels

Thank you for your interest in contributing. This guide explains how to add or improve lessons and supporting content.

## Scope of Contributions

- New lessons or improvements to existing lessons
- Lesson quizzes and learning outcomes
- Minor UI copy or docs improvements related to lesson content

## Getting Started

1. Prerequisites: Node 18+ and pnpm 9+
2. Install dependencies and run the dev server:

```bash
pnpm install
pnpm dev
```

## Project Structure for Lessons

Lessons live under `src/lessons/` and are authored in Markdown as `lesson.md`. A recommended structure is:

```
src/lessons/
  <topic>/
    l<level>-<slug>/
      lesson.md
```

The lesson `id` is inferred from the path if omitted: the path after `src/lessons/` with slashes replaced by dashes (for example, `arrays/l1-basics/lesson.md` becomes `arrays-l1-basics`).

## Lesson Front Matter

Provide metadata in YAML front matter at the top of each `lesson.md`:

```yaml
id: arrays-l1-overview          # optional; inferred from path if omitted
title: Arrays L1 — Overview     # human-readable title
topic: arrays                   # topic slug
level: 1                        # difficulty level (number)
lesson: 1.1                     # ordering within a level (supports dotted)
tags: [arrays, basics]          # optional tags used for search
prereqs: [arrays-l0-intro]      # optional array of lesson ids
est_minutes: 15                 # optional estimated reading time
outcomes:                       # optional list of learning outcomes
  - Understand array indexing and iteration
  - Implement push/pop operations
checks:                         # optional checks (quiz or unit tests)
  - type: quiz                  # quiz identified by optional id
    id: arrays-l1-overview-quiz
```

Notes:
- `lesson` controls custom ordering across pages and the sidebar.
- `outcomes` are rendered near the top of the lesson as a checklist.
- `prereqs` should reference valid `id` values from other lessons.

## Markdown Conventions

- Use `##` and `###` headings to create a clear document structure. The Table of Contents and section anchors are derived from these headings.
- Use fenced code blocks with a language tag, for example:

```markdown
```ts
const arr = [1, 2, 3]
```
```

- Lists (bulleted or numbered) are supported and styled.

## Quizzes

- If the lesson has a quiz, ensure the front matter includes a `checks` item with `type: quiz` (and an optional `id`).
- Author quiz content under a `## Quiz` section in the Markdown body. The quiz parser supports single and multiple choice questions. Keep prompts and options concise and readable.

## Authoring Guidelines

- Keep lesson text clear, focused, and incremental.
- Prefer short paragraphs, examples, and diagrams where helpful.
- Be consistent with terminology and code style (TypeScript or modern JavaScript).

## Local Validation Checklist

- `pnpm dev` runs and the lesson renders without errors
- Front matter fields are valid and the lesson appears under the correct topic/level
- Sidebar, search (title/content/tags), and lesson map behave as expected
- If added, the quiz parses and can be completed successfully

## Submitting Changes

1. Create a feature branch
2. Commit your changes with clear messages
3. Run `pnpm lint` and fix any issues
4. Open a pull request describing the change, its motivation, and screenshots if UI is affected

## License and Attribution

By contributing, you agree that your contributions are licensed under the project’s MIT license. If you are adapting material from other sources, ensure you have rights to do so and include proper attribution within the lesson.


