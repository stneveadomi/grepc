# grepc CI/CD and Automation Roadmap

_Last reviewed: 2026-10-20. Scope: GitHub Actions, bots, repo settings and release tooling. Feature work for the extension itself is tracked in [issues](https://github.com/stneveadomi/grepc/issues)._

grepc last shipped 1.3.1 on 2025-06-22. Since then the GitHub Actions runtime, the Marketplace auth model, Node.js, Angular and most of the toolchain have moved on, and several of the project's existing automation pieces are now either broken or about to be. This document records the current state, the decisions that have been made, and a phased plan to bring the project's automation up to 2026 practice without over-engineering a one-maintainer project.

## 1. Where things stand

### Existing automation

| Piece                                       | State                    | Notes                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/node.js.yml`             | Broken-ish               | `actions/setup-node@v3` runs on the Node 20 action runtime, which GitHub removed from hosted runners on 2026-09-23. Matrix packages five platform-specific VSIX files for an extension with no native code, and omits `linux-x64`. Never runs the extension (`vscode-test`) tests. No `permissions:` block. |
| `.github/workflows/lint-and-formatting.yml` | Stale                    | Node 20 (EOL 2026-04-30). Installs the SPA twice (`npm ci --force` in the step and again inside `lint:spa`). No `permissions:` block, no `concurrency`.                                                                                                                                                     |
| `VSCE_PAT` secret                           | Almost certainly expired | Created 2024-08-08. Azure DevOps PATs live at most one year, so the publish step cannot have worked since mid-2025. Global PATs are retired entirely on **2026-12-01**.                                                                                                                                     |
| `main` ruleset                              | Partially useful         | Requires a PR with one approval and five status checks named after the current matrix jobs. Any change to the matrix blocks merges until the ruleset is edited. Admins bypass, so the review requirement is cosmetic for a solo maintainer.                                                                 |
| Dependabot alerts / security updates        | Disabled                 | `npm audit` reports 48 vulnerabilities at the root (1 critical, 34 high) and 91 in the webview (3 critical, 65 high). Nearly all are in dev tooling (Angular 19 CLI, Jest 29, eslint plugins, vsce 3), not in shipped code.                                                                                 |
| Secret scanning / push protection           | Disabled                 | Free for public repos. One toggle.                                                                                                                                                                                                                                                                          |
| CodeQL code scanning                        | Not configured           | Default setup is available for `actions`, `javascript-typescript`.                                                                                                                                                                                                                                          |
| Husky + lint-staged                         | Misconfigured            | `lint-staged` runs `eslint ./ext-src/ --fix` and `prettier . --write` over the whole repo instead of staged files, so every commit reformats everything.                                                                                                                                                    |
| Line endings                                | Noisy                    | No `.gitattributes`. On a Windows/WSL checkout 61 files show as modified with equal insertions and deletions (CRLF vs LF). Prettier expects LF.                                                                                                                                                             |
| Community health files                      | Missing                  | No `CONTRIBUTING.md` (issue #74), `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue templates or PR template. `FUNDING.yml` exists.                                                                                                                                                                                |
| Open VSX                                    | Not published            | `stneveadomi.grepc` does not exist on open-vsx.org, so Cursor, Windsurf, VSCodium, Gitpod and Theia users cannot install grepc.                                                                                                                                                                             |

### Toolchain versions in the repo vs. current

| Component                     | In repo  | Current (2026-10)                                                                          | Why it matters                                                                                    |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Node.js (CI)                  | 20 / 22  | 24 Active LTS until 2026-10-20, then maintenance to 2028-04. 26 becomes LTS late Oct 2026. | vsce 4 requires Node >= 22. Node 20 is EOL.                                                       |
| `@vscode/vsce`                | 3.5      | 4.0.0 (Node 22+, OIDC `--oidc` publish mode, PAT migration prompt)                         | Needed for trusted publishing once the Marketplace backend ships it.                              |
| `ovsx`                        | not used | 1.3.0 (`--trusted-publishing`)                                                             | Required for Open VSX.                                                                            |
| Angular (webview)             | 19.2     | 22 active, 21 LTS, 20 LTS until 2026-11-28. 19 is out of support.                          | Source of most webview audit findings. Upgrade path is 19 -> 20 -> 21 -> 22, one major at a time. |
| Jest (webview)                | 29       | 30                                                                                         | Comes along with the Angular upgrade.                                                             |
| `actions/checkout`            | v4       | v7 (Node 24)                                                                               | v7 blocks fork checkouts under `pull_request_target`; irrelevant here.                            |
| `actions/setup-node`          | v3 / v4  | v7 (Node 24, npm cache only)                                                               | v3/v4 are on the removed Node 20 runtime.                                                         |
| `actions/upload-artifact`     | v4       | v7 (Node 24)                                                                               | v5 still declared node20; v6+ fixed it.                                                           |
| `softprops/action-gh-release` | v2.0.8   | v3.0.3                                                                                     |                                                                                                   |

### Marketplace snapshot

19.6k installs, 5.0 average rating over 7 reviews, 2.2k updates. That is a user base worth keeping the release path working for.

## 2. Guiding decisions

These are settled so later phases do not relitigate them.

1. **Universal VSIX only.** grepc is TypeScript plus a bundled Angular app with no native dependencies. Drop the platform-target matrix. Build one `.vsix` on `ubuntu-latest`, test it on Linux (under `xvfb`) plus one Windows run for path handling, and publish that single file to both registries. This also removes the `linux-x64` gap.
2. **Dependabot, not Renovate.** GitHub-native, no app install, grouped updates and cooldown are enough for two `package.json` files plus workflows. Revisit only if PR volume becomes a problem.
3. **Tag-driven, maintainer-gated releases.** Keep CHANGELOG.md hand-written in Keep a Changelog format as today. Automate everything after the version bump: pushing a `v*` tag builds, tests, attests, creates the GitHub Release with the `.vsix` attached, and publishes to both registries. No semantic-release and no Conventional Commits requirement; the commit history does not follow that convention and a solo project gains little from it. release-please is an optional later step (see Phase 5).
4. **Pin third-party actions to full commit SHAs** with a version comment, and let Dependabot's `github-actions` ecosystem keep them current. Set `permissions: {}` at workflow level and grant per job.
5. **Secrets are a stop-gap.** Open VSX Trusted Publishing (OIDC) is live now. The Marketplace equivalent (`vsce publish --oidc`) exists in vsce 4 but the Marketplace backend did not accept it as of 2026-10-05 (vscode-vsce issue #1275). Plan for OIDC on both, use a fresh PAT in the meantime, and track the 2026-12-01 PAT retirement as a hard deadline.
6. **No auto-closing stale bot.** Sixteen open issues, several labelled `good first issue`, is not a triage problem. Auto-closing would discard real reports and annoy the people who filed them. A label-only nudge is acceptable later; auto-close is not.
7. **No third-party coverage SaaS.** Coverage is enforced by Jest thresholds in the repo and surfaced in the job summary. Codecov adds a token and an app for no decision-making benefit at this scale.

## 3. Phases

Each phase is independently mergeable. Phases 0 and 1 are the minimum to be able to ship a release again; everything after is incremental.

### Phase 0: Unblock (one PR, do first)

Goal: any PR can be merged and a release can be cut again.

-   [x] Replace both workflows with a single `ci.yml` (lint, format check, build, unit tests, extension tests, package) and a separate `release.yml` (see Phase 2). Use `actions/checkout@v7`, `actions/setup-node@v7` with `node-version-file: .nvmrc`, Node 24. _Done. `release.yml` is a minimal tag -> test, package, Marketplace publish, GitHub Release; Phase 2 extends it. Both workflows already carry `permissions: {}` with per-job grants, `persist-credentials: false` and CI `concurrency` from Phase 1; SHA pinning is still open._
-   [x] Add `.nvmrc` (`24`) and `engines.node` in both `package.json` files so local and CI agree.
-   [x] Run the extension tests in CI for the first time: `xvfb-run -a npm test` on Linux, `npm test` on Windows. Fix whatever has rotted in `ext-src/test/suite` (two files exist; neither has run in CI). _Done: every test built a `Rule` without enabling it (rules default to disabled since 87a26e7), so `updateOccurrences` returned early and 9 of 11 tests failed._
-   [x] Remove `--force` from `npm ci`. If it fails, fix the peer dependency conflict rather than hiding it. `--force` masks exactly the kind of breakage that dependency bots are meant to surface.
-   [x] Update the `main` ruleset's required status checks to the new job names (`lint`, `test`, `package`) and consider dropping the one-approval requirement, which admins already bypass. Enable "Require branches to be up to date" so stale PRs rerun CI.
-   [x] Rotate `VSCE_PAT` (new Azure DevOps PAT, Marketplace > Manage scope, all accessible organizations, max 1 year). This is only to make the next release possible; Phase 2 replaces it.
-   [x] Add `.gitattributes` with `* text=auto eol=lf` plus binary entries for `*.png`, `*.gif`, `*.vsix`, and renormalize once (`git add --renormalize .`). Stops the 61-file phantom diff and makes Prettier's LF expectation hold on Windows.
-   [x] Fix `lint-staged` to operate on staged files: `"*.ts": "eslint --fix"`, `"*.{ts,js,json,html,css,md}": "prettier --write"`, with a matching block in the webview `package.json`.
-   [x] Bump `@vscode/vsce` to 4.x at the root (needs Node 22+, which Phase 0 provides).

### Phase 1: Repo security baseline (settings, mostly no code)

Goal: the free GitHub security features are on and workflows follow least privilege.

-   [x] Settings > Security: enable Dependabot alerts, Dependabot security updates, secret scanning, push protection. Enable CodeQL default setup for `javascript-typescript` and `actions`. _Done 2026-11-11, along with private vulnerability reporting._
-   [x] Add `.github/dependabot.yml`: _Done. The committed file adds `globals` to the `eslint` group and a major-version ignore for `angular-eslint`, whose major is locked to Angular's._

    ```yaml
    version: 2
    updates:
        - package-ecosystem: github-actions
          directory: /
          schedule: { interval: weekly }
          cooldown: { default-days: 7 }
        - package-ecosystem: npm
          directories: ['/', '/webview-ui/grepc-webview']
          schedule: { interval: weekly }
          cooldown: { default-days: 7, semver-major-days: 14 }
          groups:
              angular:
                  patterns: ['@angular/*', 'angular-eslint', 'ngx-color-picker', 'zone.js']
              eslint:
                  patterns: ['eslint', '@eslint/*', 'typescript-eslint', '@typescript-eslint/*', 'eslint-config-prettier']
              jest:
                  patterns: ['jest', 'jest-*', '@jest/*', '@types/jest']
              vscode-tooling:
                  patterns: ['@vscode/*', '@types/vscode']
              dev-minor-patch:
                  dependency-type: development
                  update-types: [minor, patch]
          ignore:
              # Angular majors are upgraded by hand with `ng update`, one major at a time.
              - dependency-name: '@angular/*'
                update-types: ['version-update:semver-major']
              # @types/vscode must track engines.vscode, not latest.
              - dependency-name: '@types/vscode'
    ```

    The seven-day cooldown is the cheap defence against the npm supply-chain compromises of 2025-2026: a poisoned release is usually pulled within days.

-   [x] Every workflow: top-level `permissions: {}`, per-job grants (`contents: read` for CI; `contents: write`, `id-token: write`, `attestations: write` only in the release job). Add `concurrency` with `cancel-in-progress` on the CI workflow. _Done. The release job holds `contents: write` only; `id-token: write` and `attestations: write` arrive in Phase 2 with the steps that use them._
-   [x] Pin all third-party actions to commit SHAs with a `# vX.Y.Z` comment. Dependabot updates both. _Done, first-party actions included._
-   [x] Add `zizmor` (`zizmorcore/zizmor-action`, SARIF to code scanning) to CI. It catches template injection, unpinned actions, excessive permissions and credential persistence in workflow files. Also add `persist-credentials: false` to every checkout that does not push. _Done. Findings go to the Security tab and do not fail the job; the release job no longer uses the npm cache (zizmor `cache-poisoning`)._
-   [x] Add `SECURITY.md` (supported version: latest minor; report via GitHub private vulnerability reporting, which is enabled under Settings > Security).

### Phase 2: Release pipeline (`release.yml`)

Goal: `git tag v1.4.0 && git push --tags` produces a GitHub Release with an attested `.vsix`, published to both registries, with no manual uploads.

Trigger: `push: tags: ['v*']`. Job outline:

1. Checkout, setup Node 24, `npm ci` at root and in the webview.
2. Verify `package.json` version matches the tag; fail early if not.
3. Run the same lint and test steps as CI (or `needs:` a reusable CI workflow).
4. `npx vsce package` (universal). Upload as a workflow artifact.
5. `actions/attest-build-provenance` on the `.vsix` (SLSA Build L2 provenance; free for public repos; verifiable with `gh attestation verify`).
6. Create the GitHub Release with `softprops/action-gh-release@v3`, attaching the `.vsix`. Extract the matching section of CHANGELOG.md as the release body. Turn on **immutable releases** in repo settings (GA since 2025-10-28) so tags and assets cannot be moved after publishing.
7. Publish the same `.vsix` file (not a rebuild) to both registries:
    - **Visual Studio Marketplace:** `npx vsce publish --packagePath grepc-*.vsix` with `VSCE_PAT`. Switch to `--oidc` the moment the Marketplace backend accepts it (watch vscode-vsce issue #1275). **Hard deadline: 2026-12-01**, when Azure DevOps global PATs are retired. If the OIDC path is still not live by mid-November, the fallback is Entra ID workload identity federation, which requires an Azure subscription and an Azure DevOps pipeline rather than GitHub Actions.
    - **Open VSX:** first publish by hand with a PAT (`npx ovsx create-namespace stneveadomi`, sign the Eclipse publisher agreement, claim namespace ownership, `npx ovsx publish grepc-*.vsix -p $OVSX_PAT`). Then register this workflow under Settings > Trusted Publishers on open-vsx.org and switch to `npx ovsx publish grepc-*.vsix --trusted-publishing` with `id-token: write`. Delete the PAT afterwards; a leftover `OVSX_PAT` silently takes precedence.
8. Use a GitHub `environment: release` with required reviewer on the publish job. Open VSX trusted-publisher registrations are not tied to a branch, so the environment gate is what stops an arbitrary ref from publishing.

Also:

-   [ ] Add a `workflow_dispatch` input for `pre-release: true` so odd-minor pre-releases (`1.5.x`) can be pushed with `--pre-release` to both registries. The Marketplace convention is even minors for stable, odd for pre-release.
-   [ ] Add a `publish-dry-run` job to CI on PRs (`vsce package` plus `vsce ls`) so packaging regressions and accidental inclusion of `node_modules` or source maps are caught before tagging. Review `.vscodeignore` while at it.
-   [ ] Update README badges: replace the `node.js.yml` badge with `ci.yml`, add Open VSX version and OpenSSF Scorecard badges.

### Phase 3: Quality gates

Goal: CI catches regressions that users currently find.

-   [ ] Jest coverage thresholds in the webview `jest.config` so `npm run test:coverage` fails below the current baseline, and print the summary to `$GITHUB_STEP_SUMMARY`. Addresses issue #21.
-   [ ] Extension-host tests (`@vscode/test-cli`) running against both `engines.vscode` minimum (1.84) and `stable`, so the declared minimum stays honest. Addresses issue #20. Extend coverage toward the rule-matching and decoration code where the open bugs (#91, #115, #116) live.
-   [ ] TypeScript `--noEmit` type-check job for both packages, separate from webpack, so type errors fail fast and clearly.
-   [ ] Bundle size budget: fail the PR if `dist/extension.js` or the Angular bundle grows more than a set percentage. The Angular CLI already supports `budgets` in `angular.json`; the extension side can use a small script.
-   [ ] OpenSSF Scorecard workflow (`ossf/scorecard-action`, weekly `schedule` plus push to `main`, `publish_results: true` for the badge). It grades most of what this roadmap sets up (pinned deps, token permissions, SAST, branch protection, security policy) and will regress visibly if something is undone.
-   [ ] Prettier and ESLint on changed files only in CI is unnecessary; whole-repo check is fast. Keep as is but run once per package without reinstalling.

### Phase 4: Dependency catch-up (manual work the bots depend on)

Dependabot will open dozens of PRs against a repo this far behind, and most will fail against Angular 19 peer ranges. Do the big jumps by hand first, then let the bot maintain.

-   [ ] Angular 19 -> 20 -> 21 -> 22 using `ng update` one major at a time, running the Jest suite between each. Jest 29 -> 30 and `jest-preset-angular` 14 -> 17 ride along. `@types/node` 20 -> 24 in the webview.
-   [ ] Root: `eslint` 9 -> 10, `typescript-eslint` current, `mocha` 10 -> 12, `glob` 11 -> 13, `uuid` 10 -> 14, `webpack-cli` 5 -> 7, `@vscode/test-electron` 2 -> 3, `@vscode/test-cli` 0.0.15.
-   [ ] Decide whether to raise `engines.vscode` from `^1.84.0` (Nov 2023). Raising it lets `@types/vscode` move and unlocks newer decoration APIs relevant to open issues (#130 diff editors, #86 terminal). Not a CI matter, but it gates the `@types/vscode` ignore rule above.
-   [ ] After the catch-up, re-run `npm audit` in both packages; the expectation is zero high or critical findings. Any remaining ones are the real security backlog.

### Phase 5: Community automation

Goal: lower the cost of incoming issues and PRs without a bot that annoys people.

-   [ ] `CONTRIBUTING.md` (closes #74): link `docs/HOW_TO_BUILD.md`, describe the two-package layout, the branch naming already in use (`<issue>-<slug>`), the Keep a Changelog entry expectation, and how releases are cut.
-   [ ] Issue forms in `.github/ISSUE_TEMPLATE/`: bug report (VS Code version, grepc version, rule export, sample text), feature request, and a config link to Discussions or the FAQ. Label automatically via the form's `labels:` field.
-   [ ] `PULL_REQUEST_TEMPLATE.md` with a short checklist (changelog entry, tests, screenshots for webview changes).
-   [ ] `actions/labeler` to tag PRs `extension`, `webview`, `ci`, `docs` by path. Cheap and makes the release notes section-able.
-   [ ] `CODE_OF_CONDUCT.md` (Contributor Covenant) so the GitHub community profile is complete.
-   [ ] Optional, later: `release-please` in "manifest" mode to draft the version bump PR from merged PR titles. Only worth it if PR volume rises; today the hand-maintained CHANGELOG is fine. If adopted, keep Phase 2's tag-triggered pipeline unchanged, since release-please ends by creating the tag.
-   [ ] Decline for now: stale-issue auto-close, auto-merge of Dependabot PRs (fine for `github-actions` ecosystem patch bumps later, once CI actually exercises the extension), all-contributors bot, Discord/Slack notifications.

## 4. Proposed `.github/` layout

```
.github/
├── FUNDING.yml                      (exists)
├── dependabot.yml                   Phase 1
├── CODEOWNERS                       optional; single owner today
├── PULL_REQUEST_TEMPLATE.md         Phase 5
├── ISSUE_TEMPLATE/
│   ├── bug_report.yml
│   ├── feature_request.yml
│   └── config.yml
├── labeler.yml                      Phase 5
└── workflows/
    ├── ci.yml                       Phase 0: lint, typecheck, test (linux xvfb + windows), package dry-run, zizmor
    ├── release.yml                  Phase 2: tag -> build, attest, GitHub Release, Marketplace + Open VSX
    ├── codeql.yml                   Phase 1, or use default setup with no file
    ├── scorecard.yml                Phase 3
    └── labeler.yml                  Phase 5
```

Delete `node.js.yml` and `lint-and-formatting.yml` once `ci.yml` is green and the ruleset points at the new check names.

## 5. Dates that drive priority

| Date           | Event                                                                         | Action                                                            |
| -------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 2026-04-30     | Node 20 EOL                                                                   | Already past. Move CI to Node 24.                                 |
| 2026-09-23     | Node 20 action runtime removed from GitHub-hosted runners                     | Already past. `setup-node@v3` and `@v4` must go.                  |
| 2026-10-20     | Node 24 moves from Active LTS to Maintenance; Node 26 enters LTS late October | Node 24 remains fine for CI through 2028-04.                      |
| 2026-11-28     | Angular 20 LTS ends                                                           | Target Angular 21 or 22 in Phase 4, not 20.                       |
| **2026-12-01** | **Azure DevOps global PATs retired; PAT-based `vsce publish` stops working**  | Phase 2 Marketplace OIDC, or Entra ID fallback, before this date. |
| 2027-04-30     | Node 22 EOL                                                                   | Irrelevant if on 24.                                              |

## 6. Rejected or deferred alternatives

-   **Renovate**: more flexible grouping and presets, but requires installing a GitHub App and its own config dialect. Dependabot's `groups`, `directories` and `cooldown` cover this repo's needs.
-   **semantic-release / semantic-release-vsce**: fully automatic versioning from Conventional Commits. The commit history does not follow that convention, and a mis-typed commit type would publish a wrong major to 19k users.
-   **Changesets**: designed for monorepos with many publishable packages. grepc publishes one artifact.
-   **Platform-specific VSIX matrix**: only needed for native modules. Removing it cuts CI minutes by roughly 80 percent and removes the missing-`linux-x64` footgun.
-   **HaaLeo/publish-vscode-extension action**: convenient, but it wraps `vsce`/`ovsx` with its own release cadence and does not support trusted publishing yet. Calling the CLIs directly keeps the OIDC path available and one fewer third party in the supply chain.
-   **step-security/harden-runner**: egress auditing is useful for high-value targets, but adds noise for a project of this size. Reconsider if Scorecard flags it or if the project adopts auto-merge.
-   **Codecov / Coveralls**: see decision 7.
-   **Stale bot with auto-close**: see decision 6.

## 7. Sources consulted (2026-10-20)

-   GitHub Changelog, [Deprecation of Node 20 on GitHub Actions runners](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/) (final dates in editor's notes).
-   GitHub Changelog, [Immutable releases are now generally available](https://github.blog/changelog/2025-10-28-immutable-releases-are-now-generally-available/).
-   GitHub Docs, [Dependabot options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference) (`cooldown`, `groups`, `directories`).
-   GitHub Docs, [Using artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations).
-   VS Code API docs, [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) (PAT retirement 2026-12-01, Entra ID flow, pre-release conventions) and [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration) (`xvfb-run -a npm test`).
-   microsoft/vscode-vsce, [v4.0.0 release](https://github.com/microsoft/vscode-vsce/releases) (Node 22 baseline, `--oidc`) and [issue #1275, Support trusted publishing](https://github.com/microsoft/vscode-vsce/issues/1275) (backend not yet ready as of 2026-10-05).
-   Eclipse Foundation, [Trusted Publishing on Open VSX](https://blogs.eclipse.org/post/tamas-cservenak/trusted-publishing-open-vsx) (2026-09-30) and the [ovsx CLI README](https://github.com/eclipse/openvsx/blob/master/cli/README.md).
-   Release pages for [actions/checkout](https://github.com/actions/checkout/releases), [actions/setup-node](https://github.com/actions/setup-node/releases), [actions/upload-artifact](https://github.com/actions/upload-artifact/releases).
-   [zizmor integrations](https://docs.zizmor.sh/integrations/), [ossf/scorecard-action](https://github.com/ossf/scorecard-action).
-   [Angular release schedule](https://angular.dev/reference/releases); Node.js release schedule via [nodejs/Release](https://github.com/nodejs/Release).
-   Repo state gathered from `gh api` (ruleset, security settings, secrets, code scanning), `npm outdated` and `npm audit` in both packages, and the Marketplace gallery API.
