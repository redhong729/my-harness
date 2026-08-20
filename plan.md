# AgentInstall 0.5.0 模块化与生命周期改造

## 目标

- 将约 82 KB 的单文件改为“轻量入口 + 模块化 Release 包”，避免模型一次加载全部模板与 Harness。
- 明确 fixture 如何验证、验证边界以及本地和 CI 报告的位置。
- 在目标项目中保存不可变的安装、调整和升级验收报告。
- 支持项目规则调整、能力启停、版本升级和 0.4.0 原地迁移。
- 安装后不保留 `AgentInstall.md`；把后续维护所需模块缓存到不提交的 `.agentinstall/`。
- 提供使用当前 Agent 运行时的手动 LLM CI；例如由 Codex 发起时复用其模型和 reasoning effort。

## 分发与 Context 控制

- 根 `AgentInstall.md` 只保留入口、来源校验、按需加载和阶段编排，不再内嵌模板或脚本。
- `AgentInstall.md` 硬限制为不超过 12 KiB；入口、manifest 和当前操作说明的常驻读取总量不超过 24 KiB。
- 模板、Profile、Skill、Harness、生命周期规范与迁移规则拆入 `agentinstall/`。
- `agentinstall/manifest.json` 是模块与能力的唯一清单。每个模块声明：
  - `id`、`capability`、`source`、`target`
  - `level`、`applyMode`、`ownership`
  - `contextPolicy`、`sha256`、`dependsOn`、`placeholders`
- `contextPolicy=copy-only` 的 L1 模板和 Harness 脚本只做原字节复制与哈希校验，不进入模型上下文；仅加载本轮选中的操作说明和需要渲染的 L2/L3 模板。
- 正式交付物为 `agentinstall-0.5.0.zip` 和对应 SHA-256。安装过程不得联网寻找模板。
- 标签发布流程必须验证版本、运行完整测试、构建 Release 包并发布压缩包与校验值。

## 目标项目本地缓存

- 安装确认后，将完整模块包复制到 `.agentinstall/versions/0.5.0/`，但不复制 `AgentInstall.md`。
- 根 `.gitignore` 确保忽略 `/.agentinstall/`；已有等价规则时不重复追加。
- `.agentinstall/` 保存完整版本模块并默认保留历史版本，便于同版本能力调整和版本差异分析。
- 缓存不是受管产物，不写入安装状态；缓存丢失不影响已安装体系和普通开发任务。
- `docs/ai/README.md` 只增加条件化维护入口。普通任务不得加载 `.agentinstall/`；仅在用户明确要求维护、启停能力或升级时读取。
- 缓存缺失时，维护操作要求用户重新提供对应 Release 包，不自动联网获取。

## 生命周期与所有权

支持以下明确操作：

- `维护 AgentInstall：调整 …`
- `启用 AgentInstall 能力 <id>`
- `停用 AgentInstall 能力 <id>`
- `升级 AgentInstall`，同时提供新版 Release 包

模块所有权分为：

- `managed`：安装器托管；当前哈希未漂移且迁移规则明确时允许新版替换。
- `seeded`：首次生成后由项目接管；升级不得覆盖，只能补充唯一且不冲突的缺失章节。
- `fragment`：只管理共享文件中的特定标题或行，例如 `.gitignore` 条目。

用户明确调整 `managed` 文件后，该文件转为项目接管，后续升级不再自动替换。停用能力只能自动删除未漂移、专属于该能力且仍为 `managed` 的文件；共享、已漂移或项目接管文件只更新引用并给出人工清理建议。

每次操作统一执行：

1. 只读扫描、状态校验和漂移检测。
2. 展示完整计划、用户选择、占位符、所有权变化与碰撞结果。
3. 在内存中完成全部候选生成、依赖闭环和写入前预检。
4. 校验 Release 包并复制本地缓存。
5. 应用受管产物和共享 fragment。
6. 执行引用、占位符、模块哈希和项目命令 Gate。
7. 写入不可变验收报告。
8. 最后追加状态快照。

写入前冲突必须保持目标项目零写入。无稳定状态变化的重复执行不创建报告、不追加状态。

## 安装验收报告与状态

- 每次产生稳定变化的安装、调整、能力启停或升级，生成：
  `docs/ai/agentinstall-reports/<YYYYMMDDTHHmmssZ>-<8hex>.md`。
- 报告包含操作类型、版本与来源、用户选择、Profile 依据、文件动作、所有权变化、漂移、冲突、Gate 结果、项目命令证据、人工审核点与回滚建议。
- 报告只有在 `docs/ai/agentinstall-state.jsonl` 中存在相同 `runId` 和报告 SHA-256 时才有效。
- 报告先于状态写入；状态写入失败时报告视为未绑定，安装不得声称完成。
- 写入前阻断不创建仓库报告，只输出阻断详情，以维持零写入。

状态升级为 schema v2，并保留现有路径与全部 v1 历史。v2 增加：

- `operation`、`previousRunId`
- Release 名称、版本、manifest 与 bundle 摘要
- `acceptanceReport.path` 与 `acceptanceReport.sha256`
- artifact 的 `moduleId`、`ownership`、`scope`、`selector`
- artifact 的来源哈希和安装后哈希

状态文件自身、本地缓存和运行期日志不进入 artifacts。

## 0.4.0 原地升级

- 0.5.0 Release 包提供官方 `0.4.0 -> 0.5.0` 迁移描述和已知 0.4.0 来源 SHA。
- 读取 v1 状态并把既有 appendix、能力和产物映射为 v2 模块与所有权，不修改历史行。
- 未漂移的 `managed` 文件仅按显式迁移规则更新；`seeded` 文件只补充；未知来源或漂移在写入前阻断。
- 首次迁移添加 `.agentinstall/` 忽略规则、本地版本缓存、升级验收报告和 v2 状态快照。
- 增加 `upgrade-from-0.4-clean` 与 `upgrade-from-0.4-drifted` fixture，分别验证成功迁移和零写入阻断。

## Fixture 验证与报告

- 现有参考安装逻辑改为 manifest 驱动，并明确标记：
  - `validatorKind=deterministic-reference`
  - `realAgentExecuted=false`
- `npm run verify` 生成 Markdown 和 JSON 报告：
  - 本地：`artifacts/agentinstall-verification/<run-id>/report.{md,json}`
  - 本地快捷入口：忽略提交的 `artifacts/agentinstall-verification/latest.{md,json}`
  - CI：写入 Job Summary，并上传按 Node 版本和 commit 命名的 artifact，默认保留 30 天
- 报告逐场景列出输入、回答、Profile、产物、保留文件、冲突、状态绑定、缓存忽略结果、二次执行 diff 和最终结论。
- Fixture 必须在真实临时 Git 仓库中执行，并断言 `.agentinstall/` 被忽略且未被跟踪。

确定性门禁覆盖：

- 入口和常驻上下文大小预算。
- manifest schema、模块路径唯一性、依赖闭包、占位符和 SHA-256。
- 四个现有场景的安装、字节保留、报告/状态绑定和二次执行零 diff。
- 能力启停、项目调整、所有权转换、fragment 与漂移处理。
- 0.4.0 迁移成功与迁移阻断。
- Release 包内容、版本和外部校验值。

## 当前 Agent 驱动的手动 LLM CI

- LLM CI 不要求用户选择“供应商”；由发起任务的 Agent 提供运行时描述。
- 运行时描述至少包含：

```json
{
  "schemaVersion": 1,
  "agent": "codex",
  "agentVersion": "<version>",
  "adapter": "codex-cli",
  "provider": "openai",
  "model": "gpt-5.6-sol",
  "reasoningEffort": "max",
  "capturedAt": "<ISO-8601 UTC>"
}
```

- `agent`、`model` 和 `reasoningEffort` 来自发起任务的当前 Agent；`adapter` 自动选择；`provider` 由适配器补充，仅作为报告来源元数据，不作为用户输入。
- GitHub Runner 无法自动读取桌面任务的模型，因此由本地分发命令将临时 runtime descriptor 传入 `workflow_dispatch`。
- 缺少 Agent、模型或 reasoning effort 时，手动 CI 直接 BLOCK，不静默使用 `latest` 或平台默认模型。
- Codex 参考适配器使用固定版本的 Codex CLI，通过 `codex exec` 在每个隔离 fixture 仓库中运行：
  - 显式传入 `--model` 和 reasoning effort
  - 使用 `workspace-write` 沙箱和临时会话
  - 输出 JSONL 工具事件和符合 JSON Schema 的最终结果
  - 不使用 `--yolo`，不复用本机登录文件，CI 使用专用凭据
- LLM 报告同时保存请求配置与实际配置、Codex CLI 版本、fixture 结果、日志、用量和失败原因。
- 当前开发环境示例为 `codex-cli 0.145.0`、`gpt-5.6-sol`、reasoning effort `max`；实际运行始终以当次 Agent 提交的 runtime descriptor 为准。
- 后续其他 Agent 只需实现相同的 runtime descriptor 和执行适配器契约。

## 仓库命令与工作流

- `npm test`：快速单元与契约测试。
- `npm run verify`：完整确定性场景验证并生成报告。
- `npm run bundle`：校验 manifest 并构建 Release 目录。
- `npm run verify:llm:dispatch`：捕获当前 Agent runtime，并手动触发 LLM CI。
- Push/PR 在 Node 18 与 24 上执行 `npm run verify`。
- LLM CI 仅由手动触发，不阻塞普通 PR；发布前是否要求一次成功的同 Agent 冒烟由 Release checklist 明确记录。

## 完成标准

- `AgentInstall.md` 不超过 12 KiB，且不包含任何完整模板或 Harness 实现。
- 新安装只加载本轮所需模块，L1/copy-only 文件不进入模型上下文。
- 安装完成后目标项目没有 `AgentInstall.md`，但存在被正确忽略的版本化 `.agentinstall/` 缓存。
- 每次有效生命周期操作都有可验证的不可变报告和对应状态记录。
- 四个现有 fixture、生命周期 fixture 和两个 0.4.0 迁移 fixture 全部通过。
- 本地和 CI 均能明确找到 Markdown/JSON 验证报告。
- 手动 LLM CI 能使用发起任务的 Codex 模型、reasoning effort 和 CLI 版本执行隔离 fixture，并在报告中证明实际运行配置。
- 中英文 README 与 fixture 文档准确区分确定性参考验证和真实 Agent 冒烟验证。

## 默认假设

- 下一版本为 `0.5.0`。
- 目标项目安装过程不依赖 Node.js；Node 18+ 只用于本仓库维护、验证和打包。
- 安装验收报告提交到目标仓库；fixture 与 CI 运行报告为生成物，不提交。
- `.agentinstall/` 默认保留全部已使用版本，清理由用户显式触发。
- 无 Git 的项目也准备 `/.agentinstall/` 忽略条目，以保护未来初始化的仓库。
- 正式安装源只有带 SHA-256 的 Release 包，不支持隐式远程拉取。
