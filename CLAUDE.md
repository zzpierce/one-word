# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OneWord is a WeChat mini-program for daily vocabulary learning. It is built with **Taro 4.2.0** + **React 18** + **TypeScript** + **Sass**, using **Vite** as the compiler.

## Common Commands

This project uses **pnpm** (lockfile: `pnpm-lock.yaml`).

- `pnpm install` — Install dependencies.
- `pnpm dev:weapp` — Start development build for WeChat mini-program (watch mode).
- `pnpm build:weapp` — Production build for WeChat mini-program.
- `pnpm new` — Generate a new page/component via Taro CLI.

After running `pnpm dev:weapp`, open the **WeChat DevTools** and point it to the `dist/` directory.

Other platform targets exist but are secondary (e.g., `dev:h5`, `build:alipay`).

## Architecture

### Pages

The app has 3 pages defined in `src/app.config.ts`, with a TabBar containing 2 tabs:

| Page | Path | TabBar | Purpose |
|------|------|--------|---------|
| index | `pages/index/index` | Yes ("选词") | Displays floating word bubbles by difficulty. Tapping a word navigates to detail. |
| detail | `pages/detail/detail` | No | Shows a `WordCard` and a "已掌握" button. Records the word as learned and navigates back. |
| history | `pages/history/history` | Yes ("历史") | Lists learned words with timestamps; supports deletion. |

### Global State

`src/context/AppContext.tsx` provides global state via React Context:

- `vocabulary` — Static word list loaded from `src/data/vocabulary.json`.
- `currentWord` — The word selected on the index page, passed to the detail page.
- `learnHistory` — Array of `LearnRecord` persisted to Taro local storage via `src/utils/storage.ts`.
- `markAsLearned(wordId)` / `removeRecord(wordId)` / `isLearned(wordId)` — Mutations and checks.

### Data Flow

1. `vocabulary.json` is imported as a static module; there is no backend API.
2. Learning progress is stored locally with `Taro.setStorageSync` under the key `learn_history`.
3. Pages consume state through the `useAppContext()` hook.

### Styling

- Sass is used for all style files (`*.scss`).
- `designWidth` is 750; `pxtransform` is enabled, so raw `px` values in styles are automatically converted to responsive units for the mini-program.
- `cssModules` is disabled globally.

### Key Files

- `src/types/word.ts` — `Word` and `LearnRecord` interfaces.
- `src/data/vocabulary.json` — Static word database. Each word has `id`, `spell`, `phonetic`, `meaning`, `example` (en/cn), and `difficulty` (1–3).
- `src/utils/storage.ts` — Wrappers around Taro storage for `learn_history`.
- `config/index.ts` — Taro configuration; uses Vite as the compiler.
- `project.config.json` — WeChat DevTools project config. `miniprogramRoot` points to `dist/`.
