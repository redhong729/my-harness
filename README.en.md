# my-harness

> A single-file repository: `AgentInstall.md` is its entire content. It is a self-contained **AI collaboration system installation guide** — "harness" refers to the guardrails-and-constraints system installed for AI collaboration. Say "执行 AgentInstall" to an AI, and it will install this system into any project on demand and non-destructively.

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

### Non-Goals

- Not a code framework / scaffold; generates no business code.
- Does not force restructuring of existing project docs or directories.
- Not an "install everything at once" approach — installs on demand.
- Does not replace product acceptance, integration testing, or human code review.

## Core Strategy

1. **Self-contained single file**: `AgentInstall.md` carries all templates (appendices A–R), with no external repository dependency.
2. **Three non-destructive principles**: file missing → create; file exists → supplement only, never overwrite; never break the target project.
3. **Conversational, on-demand install**: the 4 base files install directly, optional capabilities are asked one by one, and task skills install on first use.
4. **Three-level templates**: L1 use as-is / L2 replace placeholders / L3 rewrite as reference — balancing generality and per-project customization.
5. **Layered architecture**: protocol (`AGENTS.md`) → task routing (`docs/ai/README.md`) → hard constraints (`project-constraints.md`) → delivery (`handoff-delivery.md`) → executable guardrails (`scripts/harness/`).
6. **Placeholder inference with reported basis**: placeholders such as `<STACK>`, `<BUILD_CMD>`, `<LINT_CMD>`, `<TEST_CMD>`, and `<PROTECTED_BRANCHES>` are inferred by the AI with rationale; users can correct them. When a project lacks a tool, the placeholder is marked `N/A` (non-blocking).

## Install Checklist

### Base 4 items (installed for any project)

| Target | Description |
| --- | --- |
| `AGENTS.md` | Protocol skeleton (7 sections) |
| `docs/ai/README.md` | Task routing table |
| `docs/ai/project-constraints.md` | Project hard constraints |
| `docs/ai/skills/handoff-delivery.md` | Delivery note template |

### Optional capabilities (asked in the wizard; installed only on "yes")

Automated testing, preflight review, frontend component / backend module reuse governance, legacy feature migration, change tracking, automated check guardrails, skill index.

### On-demand skills (installed on first occurrence)

Requirement analysis, bug fixing, refactoring, investigation / analysis, adding a page.

## Impact and Risks

### Impact

- The target project gains new doc structures such as `AGENTS.md` and `docs/ai/`.
- After install, the AI's subsequent behavior is constrained by `AGENTS.md` (e.g. high-side-effect operations require confirmation, delivery requires evidence).
- The existing workflow is affected: the AI reads the protocol before acting, and may say "no" or ask for confirmation on certain requests.
- These docs require ongoing maintenance; otherwise they drift from reality and lose their binding force.

### Risks and Responses

| Risk | Trigger | Response |
| --- | --- | --- |
| Conflicts with existing docs | Existing project already has `AGENTS.md` etc. | Supplement only, never overwrite; pause and ask on conflict |
| Inaccurate placeholder inference | Tech stack / commands are guessed by the AI | Report the inference basis; users can correct; mark `N/A` when no tool exists |
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
   - **New project**: install the 4 base files first, then ask about optional capabilities one by one.
   - **Existing project**: scan existing docs first, present an analysis, then execute after confirmation.
4. When done, the AI outputs an "Installation Details" report (created / supplemented / skipped / conflicts).
5. Correct the inferred placeholders as needed (tech stack, build / lint / test commands, protected branches).
6. **Verify it works**: have the AI run one task routing or one delivery; confirm it reads the protocol first, follows constraints, and delivers with evidence.

## Appendix

### File Structure

```
.
├── AgentInstall.md   # Installation guide (the single core file, self-contained with all templates)
├── README.md         # This document (Chinese)
└── README.en.md      # English version
```

### License

This repository is public but has not adopted an open-source license (all rights reserved by default). Add a `LICENSE` file before allowing others to reuse it.
