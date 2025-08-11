# DSA Levels

Interactive lessons for JavaScript and TypeScript data structures. Built with React, TypeScript, and Vite. Content is authored in Markdown with front matter and rendered with a lightweight prose theme.

## Features

- Lessons in Markdown with front matter fields: `id`, `title`, `topic`, `level`, `lesson`, `tags`, `prereqs`, `checks`
- Quiz support with local persistence and scoring
- Search palette with title, content, and tag search (use `#tag` for tag-only)
- Topic and level navigation with collapsible sidebar and active lesson highlighting
- Lesson map (table of contents) with scroll tracking and hash navigation
- Zen mode to focus on content
- Code highlighting via Shiki with copy-to-clipboard and mobile overflow handling
- Tailwind CSS v4 theme with dark mode

## Getting Started

Prerequisites

- Node 18+
- pnpm 9+

Install and run

```bash
pnpm install
pnpm dev
```

Build and preview

```bash
pnpm build
pnpm preview
```

## Content Authoring

Add lessons under `src/lessons/`. Each lesson has a `lesson.md` with front matter. Example:

```yaml
id: arrays-l1-overview
title: Arrays L1 — Overview & Mental Model
topic: arrays
level: 1
lesson: 1.1
tags: [arrays, basics]
prereqs: []
checks:
  - type: quiz
    id: arrays-l1-overview-quiz
```

The `lesson` field is used to order lessons within a level (`1.1`, `1.2`, `2.3`).

### Quizzes

- Quizzes are parsed from a `## Quiz` section in Markdown
- Completion and scores are stored in `localStorage` using keys:
  - `quiz.submitted.{quizId}` and `quiz.score.{quizId}`

## UI Notes

- Sidebar groups by Topic or Level, supports expand and collapse all
- Lesson map on the right tracks scroll and accounts for the sticky top navigation
- Zen mode hides top navigation and sidebars; toggle from the top bar or Command Palette

## Theming

Theme tokens and prose styles are defined in `src/index.css`. Dark mode is toggled by adding the `dark` class to the root element.

## Polyfills

Some libraries expect Node globals in the browser. The project provides a Buffer polyfill:

- `src/polyfills.ts` assigns `Buffer` from the `buffer` package to `window` and `globalThis`
- Imported in `src/main.tsx` so it loads before the app

`vite.config.ts` also enables basic Node polyfills for esbuild.

## Scripts

- `pnpm dev` run the development server
- `pnpm build` type-check and build for production
- `pnpm preview` preview the production build
- `pnpm lint` run ESLint
- `pnpm validate:curriculum` validate lessons against `curriculum.json`

## Contributing

See `contribution.md` for guidelines on adding or improving lessons, quizzes, and documentation.

## License

MIT
