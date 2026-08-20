# my-harness

> A repository with one core distribution file: `AgentInstall.md` is the only file given to an AI; the READMEs and installation fixtures exist only for maintenance and verification. It is a self-contained **AI collaboration system installation guide** — "harness" refers to the guardrails-and-constraints system installed for AI collaboration. Say "执行 AgentInstall" to an AI, and it will install this system into any project on demand and non-destructively.

Current template version: `0.4.0`

[![Verify AgentInstall](https://github.com/redhong729/my-harness/actions/workflows/verify.yml/badge.svg)](https://github.com/redhong729/my-harness/actions/workflows/verify.yml)

[中文](./README.md)

---

## Table of Contents

- [Background](#background)
- [Current State](#current-state)
- [Problems](#problems)
- [Goals and Non-Goals](#goals-and-non-goals)
- [Core Strategy](#core-strategy)
- [Install Checklist](#install-checklist)
- [Impact and Risks](#impact-and-risks)
- [Benefits](#benefits)
- [Rollout Steps](#rollout-steps)
- [Post-install Usage Scenarios](#post-install-usage-scenarios)
- [Installation Fixtures](#installation-fixtures)
- [Automated Verification](#automated-verification)
- [Appendix](#appendix)

---

## Background

AI coding assistants are now deeply involved in daily development, but their behavior heavily depends on in-project context documents (such as `AGENTS.md`, task routing, and constraint notes). Without a unified protocol, every AI and every project behaves differently, and rules have to be repeated by humans over and over.

This repository distills "how to equip a project with this collaboration system" into a single guide: the AI installs by it, and humans verify by it.

## Current State

- In-project AI collaboration conventions are scattered, missing, or reinvented per project in inconsistent formats.
- Onboarding a new project or member means re-explaining the rules to the AI — costly and error-prone.
- The document system (protocol, task routing, constraints, skills) is not a coherent set and cannot be reused across projects.

## Problems

The state above directly leads to:

- **Not reusable**: every project rewrites its own conventions from scratch.
- **Uncontrollable behavior**: the AI may overstep (push directly, change shared contracts, expand scope).
- **No evidence in delivery**: the AI claims "done" without observable evidence.
- **Messy handoffs**: what changed, on what basis, and how it was verified are unclear.
- **Destructive risk**: forcing a new convention set may overwrite existing project conventions.

## Goals and Non-Goals

### Goals

- Provide a **self-contained, reusable** AI collaboration system installation guide (single file, no external dependencies).
- Install into any project **on demand and non-destructively**.
- Complete installation through **conversational guidance** — users never need to read a checklist.

### Success Criteria

| Goal | Measurable criterion |
| --- | --- |
| Reusable | The same `AgentInstall.md` installs into any new or existing project without rewriting its body |
| Non-destructive | The before/after diff shows only additions; no overwrites or deletions |
| Behavior convergence | After install, the AI asks for confirmation before high-side-effect operations (push / deploy / data deletion, etc.) |
| Trustworthy delivery | The AI delivers with observable evidence (tests / build / screenshots); unrun items are marked STALE / NOT RUN |
| Consistent template levels | L1 has no install placeholders and new files match verbatim; L2 leaves no registered variables; L3 includes rewrite rationale and verification evidence |
| Traceable installation | Every effective install records the template version, capabilities, profiles, source SHA-256, and artifact SHA-256 values |
| Verifiable scenarios | Empty repository, Node frontend, Java backend, and existing-`AGENTS.md` fixtures each define fixed inputs, answers, and expected results |

### Non-Goals

- Not a code framework / scaffold; generates no business code.
- Does not force restructuring of existing project docs or directories.
- Not an "install everything at once" approach — installs on demand.
- Does not replace product acceptance, integration testing, or human code review.

## Core Strategy

1. **Self-contained single file**: `AgentInstall.md` carries all templates (appendices A–S), with no external repository dependency.
2. **Three non-destructive principles**: file missing → create; file exists → supplement only, never overwrite; never break the target project.
3. **Conversational, on-demand install**: perform a read-only scan and collect every optional choice first, then execute one complete plan; task skills install on first use only while a trusted installation source is available.
4. **Three-level template contract**: L1 has no install-time placeholders and is copied verbatim; L2 only replaces registered variables and performs explicit deterministic selections; L3 must be rewritten and verified from project evidence and may never be installed verbatim.
5. **Layered architecture**: protocol (`AGENTS.md`) → task routing (`docs/ai/README.md`) → common constraints (`project-constraints.md`) + project profiles (`docs/ai/profiles/`) → delivery (`handoff-delivery.md`) → executable guardrails (`scripts/harness/`).
6. **Placeholder inference with reported basis**: placeholders such as `<STACK>`, `<BUILD_CMD>`, `<LINT_CMD>`, `<TEST_CMD>`, `<PRECHECK_CMD>`, and `<PROTECTED_BRANCHES>` are inferred by the AI with rationale; users can correct them. When a project lacks a tool, the placeholder is marked `N/A` (non-blocking).
7. **Executable Harness + append-only state**: projects with Node.js 18+ can install zero-third-party-dependency preflight, self-test, and run-log scripts; every project records versions, capabilities, and content checksums in JSONL.
8. **Installation scenario matrix**: four machine-readable fixtures pin project evidence, user answers, and expected results, covering minimum installation, frontend/backend profile inference, and non-destructive legacy conflict handling.
9. **Zero-dependency automated verification**: Node.js 18+ tests cover template closure, Markdown, local references, four installation scenarios, state relationships, zero-diff reruns, and the embedded Harness self-test.

## Install Checklist

### Base 5 categories (included in every complete plan)

| Target | Description |
| --- | --- |
| `AGENTS.md` | Protocol skeleton (7 sections) |
| `docs/ai/README.md` | Task routing table |
| `docs/ai/project-constraints.md` + `docs/ai/profiles/{applicable-type}.md` | Common constraints + at least one project profile |
| `docs/ai/skills/handoff-delivery.md` | Delivery note template |
| `docs/ai/agentinstall-state.jsonl` | Append-only install state, capabilities, and content checksums |

> Profiles are selected from `frontend`, `backend`, `mobile`, and `general` using observable evidence; full-stack projects and monorepos may install more than one. After the base install, the count of missing mandatory local references must be zero.

### Optional capabilities (asked in the wizard; installed only on "yes")

Automated testing, preflight review, frontend component / backend module reuse governance, legacy feature migration, change tracking, automated check guardrails, skill index. The automated guardrails include real zero-third-party-dependency scripts for Node.js 18+; unsupported runtimes are explicitly skipped.

### On-demand skills (installed on first occurrence)

Requirement analysis, bug fixing, refactoring, investigation / analysis, adding a page. On-demand installation requires a complete `AgentInstall.md` in the current trusted context; otherwise, continue with base routing and ask the user to provide the installer again instead of fetching a template from the network.

## Impact and Risks

### Impact

- The target project gains new doc structures such as `AGENTS.md` and `docs/ai/`, plus an append-only installation state file.
- Selecting automated guardrails adds `scripts/harness/`; generated `.harness-logs/` is added to `.gitignore` by default.
- After install, the AI's subsequent behavior is constrained by `AGENTS.md` (e.g. high-side-effect operations require confirmation, delivery requires evidence).
- The existing workflow is affected: the AI reads the protocol before acting, and may say "no" or ask for confirmation on certain requests.
- These docs require ongoing maintenance; otherwise they drift from reality and lose their binding force.
- `fixtures/` is only a maintainer verification asset; it is never copied into target projects and is not an external dependency of `AgentInstall.md`.
- `package.json` and `test/` are repository-maintenance checks only and are not distribution artifacts.

### Risks and Responses

| Risk | Trigger | Response |
| --- | --- | --- |
| Conflicts with existing docs | Existing project already has `AGENTS.md` etc. | Supplement only, never overwrite; pause and ask on conflict |
| Inaccurate placeholder inference | Tech stack / commands are guessed by the AI | Report the inference basis; users can correct; mark `N/A` when no tool exists |
| Mandatory docs or capabilities are absent | A base template references an optional file | Require only files that already exist or are created in this install; run a dependency-closure check afterward |
| Project type is misclassified | Multi-platform, full-stack, or monorepo project | Select one or more profiles from dependencies, directories, and build targets, and report the evidence |
| A template level is misused | L1 is rewritten, L2 variables remain, or L3 is copied verbatim | Use the single level manifest; validate verbatim equality, variable residue, and rewrite evidence after installation |
| Harness runtime is unavailable | The project has no Node.js 18+ runtime | Skip the optional capability and report it; do not download dependencies or create stub scripts |
| State checksums drift | A person or tool changes files after installation | Report drift and append a new snapshot only; checksums never authorize overwriting or rollback |
| Fixtures drift from the template | Installation rules change without updating scenario expectations | Review all four `fixture.json` files with each template version; never hard-code dynamic hashes or timestamps |
| Overly heavy constraints / rigid process | Full capability set installed by default | Optional capabilities install only on "yes"; triggered on demand, never forced |
| User doesn't understand what's installed | Non-technical users / first contact | Conversational guidance throughout, with an install report at the end |

## Benefits

- **No more repeated setup**: written once, installed anywhere; zero onboarding cost for new projects.
- **Predictable behavior**: hard constraints + verification gates + branch protection turn the AI from "uncontrollable" into "predictable".
- **Verifiable delivery**: every delivery carries observable evidence and rationale, not just "it's done".
- **Traceable changes**: the changelog records who changed what and why.
- **Evolvable system**: protocol / facts / guardrails are layered; on conflict, stop and confirm instead of fighting.

## Rollout Steps

1. Provide `AgentInstall.md` from this repository to the AI (copy the content, or let the AI read this repository).
2. Say to the AI:

   ```
   执行 AgentInstall
   ```

   > "执行 AgentInstall" is the agreed Chinese trigger phrase and is not translated.

3. The AI detects the project type and guides the install:
   - **New project**: read-only scan first, fill required facts, and collect every optional choice before executing the complete plan.
   - **Existing project**: read-only scan first, present a complete plan with every target and collision decision, then execute after confirmation.
4. The AI completes the Harness first when selected, writes other artifacts, runs closure checks, and writes installation state last; a pre-write conflict must leave the repository unchanged.
5. At the end, the AI outputs an "Installation Details" report (created / supplemented / skipped / conflicts / profile rationale / dependency closure / template-level validation / state snapshot), including blocked outcomes.
6. Correct inferred placeholders as needed (tech stack, build / lint / test commands, protected branches). A correction starts a new preflight and snapshot rather than editing history.
7. **Verify it works**: have the AI run one task routing or one delivery; confirm it reads the protocol first, follows constraints, and delivers with evidence.

## Post-install Usage Scenarios

After installation, you do not need to memorize a new command system. Describe work as usual. The AI first classifies the task through `AGENTS.md` and `docs/ai/README.md`, then loads only the constraints and skills needed for that task.

| Scenario | Example request | Expected behavior after installation |
| -------- | --------------- | ------------------------------------ |
| Build a feature | "Add status filtering to the order list. Confirm the scope before implementation." | Classify it as a Feature; read existing acceptance or product material; confirm unclear scope; run checks matched to the change. |
| Fix a bug | "Fix duplicate submissions creating two orders and add a regression test." | Classify it as a Bug; locate the reproduction path and root cause; make the smallest fix; provide observable before/after evidence. |
| Refactor safely | "Refactor payment state transitions without changing the API or existing behavior." | Classify it as a refactor; confirm current contracts and test protection; preserve behavior; report uncovered risks. |
| Investigate | "Analyze the intermittent blank home page. Do not change code yet." | Classify it as an investigation; stay read-only; separate facts, inferences, and open checks; make no implementation change without authorization. |
| Make a small change | "Change this button label to 'Resend'." | Read only nearby code and necessary constraints instead of the full documentation set; still run proportionate minimal verification. |
| Query the project knowledge base | "Using the documents under `docs/`, tell me what restrictions apply to order cancellation and cite the sources." | Locate relevant material through the documentation index and read only what is needed; cite source paths; distinguish documented facts, code-derived inferences, and missing information; flag conflicting or potentially stale documentation. |
| Reverse-engineer a PRD | "This project has no PRD. Derive one from the existing code without changing the code yet." | Extract implemented behavior from pages, routes, APIs, data models, and tests; clearly separate code facts, reasonable inferences, and open questions; require human confirmation before establishing the current project PRD. |
| Consolidate multiple PRDs | "Merge these historical PRDs into the single current project PRD while preserving the iteration trail." | Compare requirements with the current code, identify duplicates, conflicts, and obsolete items; maintain one current PRD; preserve each iteration's sources, decisions, and changes without silent overwrites. |
| Organize visual tokens | "Inventory the project's color, typography, spacing, radius, and shadow tokens and propose a cleanup plan first." | Inventory definitions and actual usage; identify duplicate, near-duplicate, and inconsistently named values; propose canonical tokens and legacy mappings; make no bulk code replacement without confirmation. |
| Run preflight | "This change is ready. Run a preflight review before I submit it." | Review the diff; run triggered lint / build / test, Profile checks, and the installed Harness; do not claim readiness while a BLOCK remains. |
| Hand off to QA / product | "The feature is complete. Prepare an acceptance handoff for QA." | Use the `handoff-delivery` structure for completed items, requirement-to-case mapping, manual review points, and regression suggestions; mark anything not run. |
| Request a high-impact action | "Push this branch directly to main and release it." | Recognize push and release as high-impact actions, request explicit confirmation first, and follow protected-branch rules. |
| Add capabilities later | "Here is AgentInstall again. Add automated testing and preflight review to this project." | Read the existing installation state, check drift and conflicts first, add only the selected capabilities, and append a snapshot only when stable state changes. |

After installation, try at least one investigation, one preflight review, and one QA/product handoff. If project documentation is missing or fragmented, also try reverse-engineering or consolidating a PRD. Together these scenarios quickly confirm task routing, fact-versus-inference boundaries, verification gates, and evidence-based delivery.

## Installation Fixtures

[`fixtures/README.en.md`](./fixtures/README.en.md) defines four reproducible target repositories:

| Fixture | Project evidence | Primary expectation |
| ------- | ---------------- | ------------------- |
| `empty-repository` | No manifest, source, or AI documentation | Ask for missing identity values and install the `general` profile |
| `node-frontend` | React, TypeScript, Vite, and npm scripts | Install the `frontend` profile and infer build/lint/test commands |
| `java-backend` | Java 17, Maven, and a JDK HTTP service | Install the `backend` profile and explicitly degrade lint to `N/A` |
| `existing-agents` | An existing `AGENTS.md` allows the AI to push directly to `main` | Make zero writes before installation; report the conflict and BLOCK while preserving the original bytes |

Each fixture's `fixture.json` pins its input file list, user answers, profile evidence, expected placeholders, artifact set, capability set, conflicts, and rerun behavior. Dynamic fields such as installation IDs, timestamps, and SHA-256 values are validated by rule rather than hard-coded.

## Automated Verification

The repository includes a zero-third-party-dependency regression suite for Node.js 18+:

```bash
npm test
```

`.github/workflows/verify.yml` runs the same command on Node.js 18 and 24 for pushes, pull requests, and manual dispatches. The workflow has only `contents: read`, does not persist checkout credentials, disables package-manager caching, and pins the verified official Actions to full commit SHAs.

It verifies the 17-token registry closure, 19 L1 and 9 L2 templates, Markdown fences, and local links. It then installs all four fixtures into isolated temporary directories, checks byte-preserved inputs, mandatory references, state SHA-256 values and the `artifacts` relationship, and proves that a second install produces no file diff and appends no JSONL record. Finally, it extracts the real Appendix N scripts and `.gitignore` entry and runs their self-test and preflight, including regressions for symlink escape, duplicate `runId`, unusual Git filenames, and false classification.

## Appendix

### File Structure

```
.
├── .github/
│   └── workflows/verify.yml       # Continuous push / PR / manual verification
├── fixtures/                      # Four installation inputs and expectations
│   ├── empty-repository/
│   ├── existing-agents/
│   ├── java-backend/
│   ├── node-frontend/
│   ├── index.json
│   ├── README.md
│   └── README.en.md
├── test/
│   └── agentinstall.test.cjs      # Item 8 checks and reference installer
├── AgentInstall.md                # Only distribution artifact; contains all templates
├── package.json                   # Node.js 18+ zero-dependency test entry point
├── README.md                      # This document (Chinese)
└── README.en.md                   # English version
```

### License

This repository is public but has not adopted an open-source license (all rights reserved by default). Add a `LICENSE` file before allowing others to reuse it.
