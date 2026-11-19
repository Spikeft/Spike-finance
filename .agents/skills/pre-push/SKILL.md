---
name: pre-push
description: >-
  MANDATORY pre-push verification workflow for the Spike monorepo.
  Use this skill BEFORE every `git push` (and before creating a commit intended to be pushed)
  to verify that every workspace project builds, all project tests pass, and every Dockerfile builds cleanly.
---

# Monorepo Pre-Push Verification

Complete **all** checks below before running `git push`. Do **not** push if any build, test suite, or Docker build fails — fix the issue first and re-run the failing check.

## 1. Build Every Project in the Monorepo

Run the full Turborepo build across all apps and packages (`packages/database`, `packages/shared`, `apps/server`, `apps/admin`, `apps/landing`, `apps/Spike`, and any newly added workspaces):

```bash
pnpm build
```

- If a workspace does not define a `build` script in Turborepo or fails to compile, inspect its `package.json` and run its typecheck/build script explicitly (e.g., `tsc --noEmit`).
- Confirm exit code `0` with zero build errors.

## 2. Run All Tests for Every Project

Run tests across every workspace package that defines a `test` script:

```bash
pnpm -r --if-present test
```

- Verify every test suite in every project passes with zero failures.
- If a project has no `test` script, note that in your verification summary; do not skip projects that do have tests.

## 3. Build Every Dockerfile in the Monorepo

Discover all Dockerfiles in the repository (excluding `node_modules`):

```bash
find . -maxdepth 3 -name 'Dockerfile*' -not -path '*/node_modules/*'
```

For each Dockerfile found, build it from the repository root context:

- For `apps/server/Dockerfile`:
  ```bash
  pnpm docker:server
  ```
  (runs `docker build -f apps/server/Dockerfile -t spike-server .`)
- For any other `apps/<name>/Dockerfile` or `packages/<name>/Dockerfile`:
  ```bash
  docker build -f <path/to/Dockerfile> -t spike-<name>:pre-push .
  ```
- Confirm every Docker image builds cleanly (exit code `0`). If the Docker daemon is not running, report the block to the user and do **not** push until Docker builds are verified or the user explicitly approves skipping.

## 4. Final Git Check & Push

1. Run `git status --short` and `git diff --staged --stat` to ensure no secrets, `.env` files, build artifacts, or unintended files are staged.
2. Commit with a clear conventional commit message (`feat(...)`, `fix(...)`, `chore(...)`, etc.) summarizing all changes.
3. Push to the remote branch only after Steps 1–3 have all passed.
