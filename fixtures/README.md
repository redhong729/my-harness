# AgentInstall 安装 Fixtures

本目录保存第 7 项要求的四类目标仓库输入与机器可读预期。它们不是要安装到目标项目的模板，也不是 `AgentInstall.md` 的外部依赖；`AgentInstall.md` 仍是唯一分发物。

[English](./README.en.md)

## 场景

| Fixture | 目标 | 关键验收点 |
| ------- | ---- | ---------- |
| `empty-repository` | 真正的空 Git 仓库 | 无技术栈证据时选择 `general`，缺失值询问用户，完成最小基础安装 |
| `node-frontend` | React + TypeScript + Vite 前端 | 从 manifest、源码和 scripts 选择 `frontend` 并推断 npm 命令 |
| `java-backend` | Java 17 + Maven HTTP 服务 | 选择 `backend`，不得写入前端约束，未配置 lint 时使用 `N/A` |
| `existing-agents` | 已有 `AGENTS.md` 的存量项目 | 先分析、零写入；发现直接 push 规则冲突后暂停且逐字保留原文件 |

## 目录契约

每个场景包含：

- `fixture.json`：场景输入清单、固定回答和预期结果；
- `input/`：复制到临时目标仓库的原始文件；真正的空仓库没有该目录。

`index.json` 是场景集合的唯一索引。`fixture.json` 中的路径、Profile 和能力 ID 数组按字符串升序保存，便于自动验证做确定性比较。动态字段（安装 ID、UTC 时间、来源 SHA-256、产物 SHA-256）不写死，只声明必须满足的格式或行为。

## 执行方式

1. 创建独立临时目录并执行 `git init -b main`。
2. 若 fixture 存在 `input/`，只复制其内部内容到临时仓库；不要复制 `fixture.json`。
3. 对非空 fixture 提交一次输入基线，以便验证安装 diff 不覆盖原文件。
4. 把仓库根目录的 `AgentInstall.md` 作为安装来源，对 AI 说「执行 AgentInstall」。
5. 严格使用 `fixture.json#answers` 中的回答；未列出的可选能力全部回答「否」。
6. 将安装详情、实际文件集合和状态记录与 `fixture.json#expected` 比较。
7. 对 `expected.rerun` 存在的场景，用同样回答重复执行一次；产物内容应为零 diff，状态 JSONL 不应追加。

## 通用验收规则

- `expected.createdFiles` 是基础安装后应出现的完整新增文件集合，包含最后创建的 `docs/ai/agentinstall-state.jsonl`。
- `expected.preservedByteForByte` 中的输入文件不得发生任何字节变化。
- 状态记录的 `profiles` 与 `capabilities` 必须分别等于 `expected.profiles` 与 `expected.capabilities`；其中 `install-state` capability 表示状态文件本身。
- 对当前三个干净完成场景，状态记录的 `artifacts[].path` 必须严格等于 `expected.createdFiles` 去掉 `docs/ai/agentinstall-state.jsonl`；状态文件不得递归列入 `artifacts`。未来含既有受管产物的 fixture 应按「全部当前受管产物减状态文件」计算，而不是只看新增文件。
- `missingRequiredReferences` 必须为 `0` 才能标记 `completed`。
- `existing-agents` 在冲突未决时必须停在 `blocked`，不得为了生成状态文件而先修改仓库。
- Fixture 中的源码和 manifest 只提供项目证据，不要求下载依赖或运行其构建命令。
