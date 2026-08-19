"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const AGENTINSTALL_PATH = path.join(ROOT, "AgentInstall.md");
const WORKFLOW_PATH = path.join(ROOT, ".github/workflows/verify.yml");
const SOURCE = fs.readFileSync(AGENTINSTALL_PATH, "utf8");
const STATE_PATH = "docs/ai/agentinstall-state.jsonl";
const FIXTURE_INDEX = readJson(path.join(ROOT, "fixtures/index.json"));
const TEMPLATE_VERSION = SOURCE.match(/模板版本：`([^`]+)`/)?.[1];

const PROFILE_MARKERS = {
  frontend: "### C2.",
  backend: "### C3.",
  mobile: "### C4.",
  general: "### C5."
};

const BASE_TEMPLATE_SPECS = [
  {
    path: "AGENTS.md",
    marker: "## 附录 A：",
    appendix: "A",
    level: "L2"
  },
  {
    path: "docs/ai/README.md",
    marker: "## 附录 B：",
    appendix: "B",
    level: "L2"
  },
  {
    path: "docs/ai/project-constraints.md",
    marker: "### C1.",
    appendix: "C1",
    level: "L2"
  },
  {
    path: "docs/ai/skills/handoff-delivery.md",
    marker: "## 附录 D：",
    appendix: "D",
    level: "L1"
  }
];

const L1_MARKERS = [
  "### C2.",
  "### C3.",
  "### C4.",
  "### C5.",
  "## 附录 D：",
  "## 附录 E：",
  "## 附录 F：",
  "## 附录 G：",
  "## 附录 H：",
  "## 附录 I：",
  "## 附录 J：",
  "## 附录 K：",
  "### N2.",
  "### N3.",
  "### N4.",
  "### N5.",
  "### O1.",
  "### O2.",
  "## 附录 R："
];

const L2_MARKERS = [
  "## 附录 A：",
  "## 附录 B：",
  "### C1.",
  "## 附录 L：",
  "## 附录 M：",
  "### N1.",
  "## 附录 P：",
  "## 附录 Q：",
  "### 追加记录模板"
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizedSource() {
  return `${SOURCE.replace(/\r\n?/g, "\n").replace(/\n*$/, "")}\n`;
}

function extractFencedBlockAfter(marker) {
  const markerIndex = SOURCE.indexOf(marker);
  assert.notEqual(markerIndex, -1, `missing template marker: ${marker}`);
  const tail = SOURCE.slice(markerIndex);
  const opening = /\n(`{3,}|~{3,})[^\n]*\n/.exec(tail);
  assert.ok(opening, `missing opening fence after ${marker}`);

  const fence = opening[1];
  const bodyStart = markerIndex + opening.index + opening[0].length;
  const closingPattern = new RegExp(
    `\\n${fence[0]}{${fence.length},}[ \\t]*(?:\\n|$)`
  );
  const closing = closingPattern.exec(SOURCE.slice(bodyStart));
  assert.ok(closing, `missing closing fence after ${marker}`);
  return SOURCE.slice(bodyStart, bodyStart + closing.index);
}

function registeredTokens() {
  const start = SOURCE.indexOf("### L2 占位符注册表");
  const end = SOURCE.indexOf("### 等级清单（唯一来源）", start);
  assert.ok(start >= 0 && end > start, "placeholder registry boundaries missing");
  return [
    ...new Set(
      [...SOURCE.slice(start, end).matchAll(/`(<[A-Z][A-Z0-9_]+>)`/g)].map(
        (match) => match[1]
      )
    )
  ];
}

function renderTemplate(template, values, tokens = registeredTokens()) {
  let rendered = template;
  for (const [name, value] of Object.entries(values)) {
    rendered = rendered.split(`<${name}>`).join(String(value));
  }
  const unresolved = tokens.filter((token) => rendered.includes(token));
  assert.deepEqual(unresolved, [], `unresolved placeholders: ${unresolved}`);
  return `${rendered}\n`;
}

function assertMarkdownFences(markdown, filePath) {
  let open = null;
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!open) {
      const match = /^ {0,3}(`{3,}|~{3,})[^\n]*$/.exec(line);
      if (match) {
        open = { character: match[1][0], length: match[1].length, line: index + 1 };
      }
      continue;
    }

    const closing = new RegExp(
      `^ {0,3}${open.character}{${open.length},}[ \\t]*$`
    );
    if (closing.test(line)) {
      open = null;
    }
  }

  assert.equal(
    open,
    null,
    `${filePath} has an unclosed fence from line ${open?.line}`
  );
}

function listFiles(root, relative = "") {
  const directory = path.join(root, relative);
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(root, child));
    } else {
      files.push(child.split(path.sep).join("/"));
    }
  }
  return files.sort();
}

function snapshot(root) {
  return new Map(
    listFiles(root).map((relativePath) => [
      relativePath,
      fs.readFileSync(path.join(root, relativePath))
    ])
  );
}

function assertSnapshotsEqual(actual, expected, message) {
  assert.deepEqual([...actual.keys()], [...expected.keys()], message);
  for (const [relativePath, expectedBytes] of expected) {
    assert.equal(
      Buffer.compare(actual.get(relativePath), expectedBytes),
      0,
      `${message}: ${relativePath}`
    );
  }
}

function copyFixtureInputs(fixtureId, targetRoot) {
  const inputRoot = path.join(ROOT, "fixtures", fixtureId, "input");
  if (!fs.existsSync(inputRoot)) {
    return;
  }
  fs.cpSync(inputRoot, targetRoot, { recursive: true });
}

function fixtureSpec(fixtureId) {
  return readJson(path.join(ROOT, "fixtures", fixtureId, "fixture.json"));
}

function profileTemplateSpec(profile) {
  const suffix = profile[0].toUpperCase() + profile.slice(1);
  return {
    path: `docs/ai/profiles/${profile}.md`,
    marker: PROFILE_MARKERS[profile],
    appendix: `C${["frontend", "backend", "mobile", "general"].indexOf(profile) + 2}`,
    level: "L1",
    label: suffix
  };
}

function artifactSpecs(fixture) {
  return [
    ...BASE_TEMPLATE_SPECS,
    ...fixture.expected.profiles.map(profileTemplateSpec)
  ].sort((left, right) => compareStrings(left.path, right.path));
}

function stableProjection(record) {
  return {
    templateVersion: record.templateVersion,
    status: record.status,
    source: record.source,
    profiles: record.profiles,
    capabilities: record.capabilities,
    artifacts: record.artifacts.map(({ mode: _mode, ...artifact }) => artifact)
  };
}

function installFixture(targetRoot, fixture, runNumber) {
  if (fixture.expected.status === "blocked") {
    for (const conflict of fixture.expected.conflicts) {
      const existingPath = path.join(targetRoot, conflict.path);
      assert.equal(fs.existsSync(existingPath), true, `missing conflict target ${conflict.path}`);
      if (conflict.path === "AGENTS.md") {
        const candidate = renderTemplate(
          extractFencedBlockAfter("## 附录 A："),
          fixture.expected.placeholderValues
        );
        assert.notEqual(fs.readFileSync(existingPath, "utf8"), candidate);
      }
    }
    return { stateAction: "not-created-before-conflict-resolution" };
  }

  const artifacts = [];
  for (const spec of artifactSpecs(fixture)) {
    const template = extractFencedBlockAfter(spec.marker);
    const content =
      spec.level === "L1"
        ? `${template}\n`
        : renderTemplate(template, fixture.expected.placeholderValues);
    const outputPath = path.join(targetRoot, spec.path);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    let mode = "created";
    if (fs.existsSync(outputPath)) {
      assert.equal(
        fs.readFileSync(outputPath, "utf8"),
        content,
        `reference install conflict: ${spec.path}`
      );
      mode = "verified-existing";
    } else {
      fs.writeFileSync(outputPath, content, "utf8");
    }
    artifacts.push({
      path: spec.path,
      appendix: spec.appendix,
      level: spec.level,
      mode,
      sha256: sha256(fs.readFileSync(outputPath))
    });
  }

  const stateFile = path.join(targetRoot, STATE_PATH);
  const record = {
    schemaVersion: 1,
    templateVersion: TEMPLATE_VERSION,
    runId: `${fixture.id}-run-${runNumber}`,
    installedAt: `2026-08-19T00:00:0${runNumber}.000Z`,
    status: fixture.expected.status,
    source: { name: "AgentInstall.md", sha256: sha256(normalizedSource()) },
    profiles: [...fixture.expected.profiles].sort(),
    capabilities: [...fixture.expected.capabilities].sort(),
    artifacts: artifacts.sort((left, right) => compareStrings(left.path, right.path))
  };

  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  let stateAction = "created";
  if (fs.existsSync(stateFile)) {
    const records = fs
      .readFileSync(stateFile, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const previous = records.at(-1);
    if (
      JSON.stringify(stableProjection(previous)) ===
      JSON.stringify(stableProjection(record))
    ) {
      stateAction = "unchanged";
    } else {
      fs.appendFileSync(stateFile, `${JSON.stringify(record)}\n`, "utf8");
      stateAction = "appended";
    }
  } else {
    fs.writeFileSync(stateFile, `${JSON.stringify(record)}\n`, "utf8");
  }

  return { record, stateAction };
}

function validateStateRecord(record, fixture, targetRoot) {
  assert.equal(record.schemaVersion, 1);
  assert.equal(record.templateVersion, TEMPLATE_VERSION);
  assert.match(record.runId, /^\S+$/);
  assert.equal(new Date(record.installedAt).toISOString(), record.installedAt);
  assert.equal(record.status, fixture.expected.status);
  assert.deepEqual(record.profiles, fixture.expected.profiles);
  assert.deepEqual(record.capabilities, fixture.expected.capabilities);
  assert.equal(record.source.name, "AgentInstall.md");
  assert.match(record.source.sha256, /^[a-f0-9]{64}$/);
  assert.equal(record.source.sha256, sha256(normalizedSource()));
  assert.deepEqual(
    record.artifacts.map((artifact) => artifact.path),
    fixture.expected.createdFiles.filter((file) => file !== STATE_PATH)
  );
  for (const artifact of record.artifacts) {
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/);
    assert.equal(
      artifact.sha256,
      sha256(fs.readFileSync(path.join(targetRoot, artifact.path)))
    );
    assert.ok(["L1", "L2", "L3"].includes(artifact.level));
    assert.ok(["created", "supplemented", "verified-existing"].includes(artifact.mode));
  }
}

function assertRequiredReferences(targetRoot, fixture) {
  const required = [
    "AGENTS.md",
    "docs/ai/README.md",
    "docs/ai/project-constraints.md",
    "docs/ai/skills/handoff-delivery.md",
    STATE_PATH,
    ...fixture.expected.profiles.map((profile) => `docs/ai/profiles/${profile}.md`)
  ];
  const missing = required.filter(
    (relativePath) => !fs.existsSync(path.join(targetRoot, relativePath))
  );
  assert.deepEqual(missing, []);
  assert.equal(fixture.expected.missingRequiredReferences, missing.length);
}

function assertLocalMarkdownLinks(filePath) {
  const markdown = fs.readFileSync(filePath, "utf8");
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    }
    target = target.split(/\s+["']/)[0];
    if (
      target === "" ||
      target.startsWith("#") ||
      /^[A-Za-z][A-Za-z0-9+.-]*:/.test(target)
    ) {
      continue;
    }
    target = decodeURIComponent(target.split("#")[0]);
    assert.equal(
      fs.existsSync(path.resolve(path.dirname(filePath), target)),
      true,
      `${path.relative(ROOT, filePath)} links to missing ${target}`
    );
  }
}

test("template, package, and fixtures use one version", () => {
  assert.equal(TEMPLATE_VERSION, "0.4.0");
  assert.equal(readJson(path.join(ROOT, "package.json")).version, TEMPLATE_VERSION);
  assert.equal(FIXTURE_INDEX.schemaVersion, 1);
  assert.deepEqual(
    FIXTURE_INDEX.fixtures,
    [...FIXTURE_INDEX.fixtures].sort()
  );
  for (const fixtureId of FIXTURE_INDEX.fixtures) {
    const fixture = fixtureSpec(fixtureId);
    assert.equal(fixture.id, fixtureId);
    assert.equal(
      fixture.expected.placeholderValues.TEMPLATE_VERSION,
      TEMPLATE_VERSION
    );
  }
});

test("all repository Markdown has balanced fences and valid local links", () => {
  const markdownFiles = listFiles(ROOT).filter((file) => file.endsWith(".md"));
  for (const relativePath of markdownFiles) {
    const filePath = path.join(ROOT, relativePath);
    assertMarkdownFences(fs.readFileSync(filePath, "utf8"), relativePath);
    assertLocalMarkdownLinks(filePath);
  }
});

test("template levels and placeholder registry are closed", () => {
  const tokens = registeredTokens();
  assert.equal(tokens.length, 17);
  assert.equal(L1_MARKERS.length, 19);
  assert.equal(L2_MARKERS.length, 9);

  for (const marker of L1_MARKERS) {
    const body = extractFencedBlockAfter(marker);
    assert.deepEqual(
      tokens.filter((token) => body.includes(token)),
      [],
      `${marker} is L1 but contains an install placeholder`
    );
  }

  const unregistered = new Set();
  const seen = new Set();
  for (const marker of L2_MARKERS) {
    for (const match of extractFencedBlockAfter(marker).matchAll(
      /<[A-Z][A-Z0-9_]+>/g
    )) {
      seen.add(match[0]);
      if (!tokens.includes(match[0])) {
        unregistered.add(match[0]);
      }
    }
  }
  assert.deepEqual([...unregistered], []);
  assert.deepEqual([...seen].sort(), [...tokens].sort());
});

test("critical workflow and lifecycle guardrails remain explicit", () => {
  assert.match(SOURCE, /选择收集完成前不写文件/);
  assert.match(SOURCE, /任一写入前冲突都以零写入结束/);
  assert.match(SOURCE, /状态文件永远是最后一个写入目标/);
  assert.match(
    SOURCE,
    /仅当规范化后的完整条目 `\.harness-logs\/` 不存在时追加一次/
  );
  assert.match(SOURCE, /用户在当前对话直接授权维护 `AGENTS\.md`/);
  assert.match(SOURCE, /未创建（写入前阻断）/);
  assert.match(SOURCE, /### 升级、schema 迁移与卸载/);
});

test("continuous verification uses a least-privilege Node matrix", () => {
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");
  assert.match(workflow, /^name: Verify AgentInstall$/m);
  assert.match(workflow, /^  push:$/m);
  assert.match(workflow, /^  pull_request:$/m);
  assert.match(workflow, /^  workflow_dispatch:$/m);
  assert.match(workflow, /^permissions:\n  contents: read$/m);
  assert.match(
    workflow,
    /uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1/
  );
  assert.match(workflow, /persist-credentials: false/);
  assert.match(
    workflow,
    /uses: actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7\.0\.0/
  );
  assert.match(workflow, /package-manager-cache: false/);
  assert.deepEqual(
    [...workflow.matchAll(/^          - (\d+)\.x$/gm)].map((match) => match[1]),
    ["18", "24"]
  );
  assert.match(workflow, /^        run: npm test$/m);
});

test("fixture input inventories are exact and deterministic", () => {
  for (const fixtureId of FIXTURE_INDEX.fixtures) {
    const fixture = fixtureSpec(fixtureId);
    const inputRoot = path.join(ROOT, "fixtures", fixtureId, "input");
    assert.deepEqual(listFiles(inputRoot), fixture.inputFiles);
    for (const key of ["inputFiles", "profiles", "createdFiles", "capabilities"]) {
      const values = key === "inputFiles" ? fixture[key] : fixture.expected[key];
      if (Array.isArray(values)) {
        assert.deepEqual(values, [...values].sort(), `${fixtureId} ${key} is not sorted`);
      }
    }
  }
});

for (const fixtureId of FIXTURE_INDEX.fixtures) {
  test(`reference installation satisfies ${fixtureId}`, (context) => {
    const fixture = fixtureSpec(fixtureId);
    const temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), `agentinstall-${fixtureId}-`)
    );
    context.after(() => {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    });
    copyFixtureInputs(fixtureId, temporaryRoot);
    const before = snapshot(temporaryRoot);
    const result = installFixture(temporaryRoot, fixture, 1);

    for (const relativePath of fixture.expected.preservedByteForByte) {
      assert.equal(
        Buffer.compare(
          fs.readFileSync(path.join(temporaryRoot, relativePath)),
          before.get(relativePath)
        ),
        0,
        `${fixtureId} changed preserved input ${relativePath}`
      );
    }

    if (fixture.expected.status === "blocked") {
      assertSnapshotsEqual(snapshot(temporaryRoot), before, `${fixtureId} must make zero writes`);
      assert.equal(result.stateAction, fixture.expected.stateRecord);
      return;
    }

    const afterFirst = snapshot(temporaryRoot);
    const createdFiles = [...afterFirst.keys()].filter((file) => !before.has(file));
    assert.deepEqual(createdFiles, fixture.expected.createdFiles);
    assert.equal(result.stateAction, "created");
    validateStateRecord(result.record, fixture, temporaryRoot);
    assertRequiredReferences(temporaryRoot, fixture);

    const tokens = registeredTokens();
    for (const artifact of result.record.artifacts) {
      const content = fs.readFileSync(path.join(temporaryRoot, artifact.path), "utf8");
      assert.deepEqual(tokens.filter((token) => content.includes(token)), []);
      if (artifact.path.endsWith(".md")) {
        assertMarkdownFences(content, `${fixtureId}/${artifact.path}`);
      }
    }

    const rerun = installFixture(temporaryRoot, fixture, 2);
    assert.equal(rerun.stateAction, "unchanged");
    assertSnapshotsEqual(
      snapshot(temporaryRoot),
      afterFirst,
      `${fixtureId} second install must be byte-for-byte idempotent`
    );
    assert.equal(
      fs.readFileSync(path.join(temporaryRoot, STATE_PATH), "utf8").trim().split("\n").length,
      1
    );
  });
}

test("embedded Harness passes self-test and preflight", (context) => {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "agentinstall-harness-")
  );
  context.after(() => {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  });

  const values = {
    ...fixtureSpec("empty-repository").expected.placeholderValues,
    LINT_CMD: "N/A",
    BUILD_CMD: "N/A",
    TEST_CMD: "N/A"
  };
  const harnessFiles = [
    {
      path: "scripts/harness/config.json",
      content: renderTemplate(extractFencedBlockAfter("### N1."), values)
    },
    {
      path: "scripts/harness/lib/run-log.cjs",
      content: `${extractFencedBlockAfter("### N2.")}\n`
    },
    {
      path: "scripts/harness/preflight-check.cjs",
      content: `${extractFencedBlockAfter("### N3.")}\n`
    },
    {
      path: "scripts/harness/test.cjs",
      content: `${extractFencedBlockAfter("### N4.")}\n`
    }
  ];
  for (const file of harnessFiles) {
    const outputPath = path.join(temporaryRoot, file.path);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, file.content, "utf8");
  }
  const ignoreEntry = `${extractFencedBlockAfter("### N5.")}\n`;
  assert.equal(ignoreEntry, ".harness-logs/\n");
  fs.writeFileSync(path.join(temporaryRoot, ".gitignore"), ignoreEntry, "utf8");

  const selfTest = spawnSync(process.execPath, ["scripts/harness/test.cjs"], {
    cwd: temporaryRoot,
    encoding: "utf8"
  });
  assert.equal(
    selfTest.status,
    0,
    `Harness self-test failed:\n${selfTest.stdout}\n${selfTest.stderr}`
  );

  const preflight = spawnSync(
    process.execPath,
    [
      "scripts/harness/preflight-check.cjs",
      "--files",
      ...harnessFiles.map((file) => file.path)
    ],
    { cwd: temporaryRoot, encoding: "utf8" }
  );
  assert.equal(
    preflight.status,
    0,
    `Harness preflight failed:\n${preflight.stdout}\n${preflight.stderr}`
  );
  assert.equal(fs.existsSync(path.join(temporaryRoot, ".harness-logs/runs.jsonl")), true);
});
