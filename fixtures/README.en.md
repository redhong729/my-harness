# AgentInstall Installation Fixtures

This directory contains the four target-repository inputs and machine-readable expectations required by item 7. They are neither target-project templates nor external dependencies of `AgentInstall.md`; `AgentInstall.md` remains the only distribution artifact.

[中文](./README.md)

## Scenarios

| Fixture | Purpose | Key acceptance point |
| ------- | ------- | -------------------- |
| `empty-repository` | A truly empty Git repository | Select `general` without stack evidence, ask for missing values, and complete the minimum base install |
| `node-frontend` | A React + TypeScript + Vite frontend | Select `frontend` from the manifest, source, and scripts, then infer npm commands |
| `java-backend` | A Java 17 + Maven HTTP service | Select `backend`, add no frontend constraints, and use `N/A` when lint is not configured |
| `existing-agents` | An existing project with `AGENTS.md` | Analyze with zero writes, then stop on the direct-push conflict while preserving the original file byte-for-byte |

## Directory Contract

Each scenario contains:

- `fixture.json`: input inventory, fixed answers, and expected results;
- `input/`: original files copied into a temporary target repository; the truly empty fixture has no such directory.

`index.json` is the only fixture-set index. Path, profile, and capability-ID arrays in each `fixture.json` are sorted for deterministic automated validation. Dynamic fields—installation ID, UTC timestamp, source SHA-256, and artifact SHA-256—are not pinned to literal values; only their required format or behavior is specified.

## Execution

1. Create an isolated temporary directory and run `git init -b main`.
2. When a fixture has `input/`, copy only its contents into the temporary repository; do not copy `fixture.json`.
3. Commit the non-empty fixture input once so the installation diff can prove that original files were not overwritten.
4. Provide the repository-root `AgentInstall.md` as the installation source and say "执行 AgentInstall" to the AI.
5. Use the answers in `fixture.json#answers` exactly; answer "no" for every optional capability not listed.
6. Compare the installation report, actual file set, and state record with `fixture.json#expected`.
7. When `expected.rerun` exists, repeat with the same answers; artifact content must have zero diff and the state JSONL must not append a record.

## Common Acceptance Rules

- `expected.createdFiles` is the complete set of files created by the base install, including the final `docs/ai/agentinstall-state.jsonl` write.
- Every input listed by `expected.preservedByteForByte` must retain identical bytes.
- The state record's `profiles` and `capabilities` must equal `expected.profiles` and `expected.capabilities`; the `install-state` capability represents the state file itself.
- For the three current clean completed scenarios, state `artifacts[].path` must equal `expected.createdFiles` minus `docs/ai/agentinstall-state.jsonl`; the state file must never recursively list itself. A future fixture with existing managed artifacts must instead use “all currently managed artifacts minus the state file,” not only newly created files.
- `missingRequiredReferences` must be `0` before an installation can be marked `completed`.
- `existing-agents` must remain `blocked` while its conflict is unresolved; it may not modify the repository merely to create a state record.
- Fixture source files and manifests provide project evidence only; their dependencies and build commands do not need to be downloaded or executed.
