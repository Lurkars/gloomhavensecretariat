# Contributing to Gloomhaven Secretariat

Thank you for your interest in contributing to _Gloomhaven Secretariat_! This document outlines how to get involved, what to expect, and the conventions to follow.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)
- [Translating](#translating)
- [Game Data](#game-data)
- [Development Setup](#development-setup)
- [Code Conventions](#code-conventions)
- [Formatting & Linting](#formatting--linting)
- [Commit & Pull Request Guidelines](#commit--pull-request-guidelines)
- [AI Usage Policy](#ai-usage-policy)

## Ways to Contribute

- **Bug reports** – Found something broken? Open a [new issue](https://github.com/Lurkars/gloomhavensecretariat/issues/new?template=bug_report.yml).
- **Feature requests & improvements** – Have an idea? File a [new issue](https://github.com/Lurkars/gloomhavensecretariat/issues/new?template=feature_request.yml) or start a [discussion](https://github.com/Lurkars/gloomhavensecretariat/discussions/new/choose).
- **Help & feedback** – Use [discussions](https://github.com/Lurkars/gloomhavensecretariat/discussions/new/choose) for general questions.
- **Game data review** – All data lives in the [`data/`](./data/) folder as human-readable JSON files. A third-party review of correctness is very welcome.
- **Code contributions** – Pull requests are welcome! Please read the [guidelines](#commit--pull-request-guidelines) below first.
- **Translations** – Help translate the app via [Weblate](https://i18n.gloomhaven-secretariat.de/).

## Reporting Bugs & Requesting Features

Use the [issue tracker](https://github.com/Lurkars/gloomhavensecretariat/issues/new/choose). Please include:

- A clear description of the problem or request.
- Steps to reproduce (for bugs).
- The version/build of the app you are using.
- Screenshots or logs where applicable.

## Translating

Translation is managed via [Weblate](https://i18n.gloomhaven-secretariat.de/). Log in with your GitHub account to contribute. Please do **not** edit translation files directly in the repository.

## Game Data

All game data is located in the [`data/`](./data/) folder, with subfolders per edition. Files are plain JSON, one file per character, monster, or monster deck etc., making them easy to review and edit.

**Important:** All files in the `data/` subfolder are automatically formatted and staged on each commit via the pre-commit hook. If you have local changes to data files that you do **not** want to commit, use `--no-verify` on your `git commit` and `git push` commands.

## Development Setup

**Prerequisites:**

- Current [Node.js](https://nodejs.org) and npm

```sh
git clone https://github.com/Lurkars/gloomhavensecretariat.git
cd gloomhavensecretariat
npm install
npm run start        # dev server at http://localhost:4200
```

Alternatively, with Docker:

```sh
docker compose -f docker-compose.dev.yaml up -d
```

## Code Conventions

This project is built with [Angular](https://angular.io/) and TypeScript and the following conventions apply:

- **Absolute imports** – Use `src/`-prefixed absolute imports instead of relative paths (e.g. `src/app/service/game` rather than `../../service/game`). The linter will warn about violations and can auto-fix them.
- **Single quotes** for strings in TypeScript.
- **2-space indentation**, no tabs, LF line endings, UTF-8 encoding.
- **No trailing commas** in TypeScript/JSON.
- **No `any`** is not strictly enforced, but prefer typed code where reasonable.
- Angular-specific lint rules (`@angular-eslint`) are active; follow component/directive naming conventions.

### Formatting & Linting

The project uses [ESLint](https://eslint.org/) (via `eslint.config.mjs`) and [Prettier](https://prettier.io/) (via `.prettierrc`). Both run automatically on staged files via [lint-staged](https://github.com/okonet/lint-staged) as part of the Husky pre-commit hook.

| Command                | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `npm run lint`         | Run ESLint on all `src/**/*.{ts,html}` files             |
| `npm run lint:fix`     | Run ESLint and auto-fix violations                       |
| `npm run format`       | Format all `src/**/*.{ts,html,scss}` files with Prettier |
| `npm run format:check` | Check formatting without writing changes                 |

**Prettier settings** (see [`.prettierrc`](./.prettierrc)):

- Single quotes, no trailing commas, print width 140, 2-space tab width, semicolons, LF line endings.
- Imports are auto-organized via `prettier-plugin-organize-imports`.
- HTML files use the Angular parser.

Please ensure your changes pass both lint and formatting checks before opening a pull request. The pre-commit hook should apply fixes automatically on commit for files in `src/`, but it is good practice to run them manually first.

## Commit & Pull Request Guidelines

- **Before opening a PR for a large or complex feature, please start a [discussion](https://github.com/Lurkars/gloomhavensecretariat/discussions/new/choose) first.** This avoids wasted effort on changes that may not align with the project's direction. PRs for significant new features without a prior discussion may be closed.
- Keep commits focused; one logical change per commit.
- Write a short, descriptive commit message in the imperative mood (e.g. `Fix monster initiative sorting`).
- If your PR addresses an open issue or discussion, reference it in the PR description (e.g. `Fixes #123`).
- PRs should target the `main` branch unless otherwise specified.
- Do not force-push to shared branches.
- Follow the [Code Conventions](#code-conventions)
- Fill out the [pull request template](.github/pull_request_template.md) completely and conscientiously.
- All PRs must pass the [Testing workflow](.github/workflows/testing.yml). PRs with a failing workflow run will not be reviewed.

### AI Usage Policy

The use of AI tools (such as GitHub Copilot, ChatGPT, or similar) is **allowed** when contributing to this project. However, transparency is required:

**If you used an AI tool for any part of your contribution, state this clearly in your pull request description.** Include:

- Which tool(s) were used (e.g. GitHub Copilot, ChatGPT, Claude).
- What the AI was used for (e.g. generating boilerplate, suggesting logic, writing tests, drafting documentation).
- Whether the output was reviewed and manually verified by you.

**Why this matters:**

- Game data correctness is critical. AI-generated data may contain plausible-looking but incorrect values. All AI-generated or AI-assisted game data **must** be manually verified against the physical game components.
- AI-generated code can introduce subtle bugs or patterns that deviate from the project's conventions. Human review is expected.
- Transparency helps maintainers understand the nature of contributions and review them appropriately.

AI is a tool, not a replacement for understanding the code or the game rules. Contributions consisting entirely of unreviewed AI output will not be accepted.

> **Note:** Pull requests that do not meet these guidelines or do not disclose AI usage as required will be closed without further comment, with a reference to this section.
