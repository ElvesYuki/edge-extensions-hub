# AGENTS.md — Edge Extensions Hub

## 真相来源

本文件基于仓库实际目录结构、现有插件代码与 `template/` 模板整理而成。当文档与代码冲突时，优先以代码现状为准。

- 插件真实行为以 `manifest.json`、service worker、popup/page 脚本为准
- git log / git blame 是代码变更历史的权威来源
- `.claude/` 目录中的记忆文件是辅助参考，不能替代代码审查

## 项目概览

浏览器插件合集（Monorepo），Manifest V3，目标平台 Edge/Chromium。

- 每个插件一个子目录：`plugins/<plugin-name>/`
- 统一技术栈：vanilla HTML/CSS/JS，ES modules（`type="module"`），`chrome.*` APIs，`chrome.storage.local`
- 共用模板位于 `template/`，脚手架脚本 `scripts/new-plugin.sh`

### 三种运行环境

| 环境 | 载体 | 模块支持 | 持久化 |
|------|------|----------|--------|
| Popup | `popup/popup.html` | ES module | chrome.storage.local |
| Content Script | `content/content.js` | 自包含，禁止 import | chrome.storage.local |
| Background | `background/service-worker.js` | ES module（manifest 声明） | chrome.storage.local |
| New Tab Page | `page/editor.html` | ES module | chrome.storage.local |

关键约束：
- Content script 不能使用 ES module import，必须自包含
- Service worker 在 manifest 中声明 `"type": "module"`
- Popup / Page 的 `<script>` 标签需要 `type="module"`
- Page 资源和 lib 目录需要在 `web_accessible_resources` 中声明
- 三种环境隔离，不要假设彼此的内存状态

## 插件目录结构

```
plugins/<name>/
├── README.md               # 插件说明书（必须）
├── manifest.json           # MV3，permissions: [storage, tabs]
├── icons/                  # 16/32/48/128
├── background/
│   └── service-worker.js   # chrome.action.onClicked → tabs.create
├── popup/                  # 可选，popup 模式
├── content/                # 可选，content script 必须自包含（无 import）
├── page/                   # 可选，new-tab 模式页面
├── utils/                  # 插件内复用工具（storage.js, messenger.js）
├── lib/                    # 第三方库（如 SheetJS）
└── docs/memory/            # 可选，复杂插件才需要（见"记忆与协作"）
```

### README.md 最少内容

每个插件必须包含 README.md，至少写清楚：
1. **做什么** — 一句话描述
2. **怎么打开** — popup / new tab / content script
3. **关键操作** — 用户能做什么
4. **注意事项** — 容易踩的坑（如 storage key、依赖库、已知限制）

## 技术栈

- 无框架、无构建、无 npm
- `<template>` + `cloneNode` 模式做组件化（参考 ai-config 插件）
- `chrome.storage.local` 持久化（非 localStorage，注意 storage quota）
- SheetJS（xlsx.full.min.js）处理 Excel 导入，vendored 到 `lib/`
- 原生 HTML5 Drag & Drop 做排序
- ES modules 做模块拆分，无打包

## 开发流程

1. 新建插件：`bash scripts/new-plugin.sh <plugin-name> "<中文标题>" "<描述>"`
2. 加载测试：Edge `edge://extensions` → 开发者模式 → 加载解压缩的扩展 → 选 `plugins/<name>/`
3. 修改后点插件卡片上的刷新按钮
4. 查看控制台：插件页面右键 → 检查，查看 Console 输出

### 推荐协作节奏：Read → Think → Act → Verify → Sync

- **Read**：先看目标插件现有代码和相关文档，不凭印象改动
- **Think**：先确认现有模式、依赖方向和复用点，再决定方案
- **Act**：只做当前任务需要的最小改动，不顺手重构
- **Verify**：至少覆盖受影响范围的编译检查、关键路径手工验证
- **Sync**：收口时同步说明改动内容、验证结果和已知风险

## 记忆与协作

记忆体系分两层：项目级和插件级。

### 项目级 `docs/memory/`

跨插件决策、模板变更、通用规则调整放在这里：

```
docs/memory/
├── index.md          # 项目阶段、导航入口
├── 待办.md           # 跨插件待办、里程碑
├── 决策/             # 架构取舍、规则收口、重要边界
│   └── template-design.md
└── 会话纪要/         # 阶段性讨论结论、排障记录
```

### 插件级 `plugins/<name>/docs/memory/`

复杂插件的架构决策、历史踩坑、联调结论放在插件自己的 memory 目录下：

```
plugins/<name>/docs/memory/
├── 待办.md           # 该插件待办
├── 决策/             # 该插件特有的设计取舍
└── 会话纪要/         # 该插件的排障记录
```

简单插件（如 hello-world）不需要这一层，一个 README.md 就够了。

### 使用原则

- 记忆文件用于降低协作成本，不替代代码和 `README.md`
- 当记忆内容与代码冲突时，优先相信代码
- 当记忆内容与 `README.md` 或 `AGENTS.md` 冲突时，优先相信正式文档
- 新增长期约束和架构决策时，写入对应层级的决策文档，不要只留在聊天记录里
- 修复复杂问题后，结论对后续有价值则沉淀为简洁结论，不粘贴整段过程
- 可以推导的信息（函数签名、文件列表）不写入记忆

## 架构与分层

### 插件内部分层

```
manifest.json          → 权限声明、资源配置
background/            → 生命周期管理、事件路由（不承载业务逻辑）
popup / page           → UI 层（DOM 渲染、用户交互）
utils/                 → 通用工具（storage 封装、消息传递）
components/            → 可复用 UI 组件（template + cloneNode 模式）
model / store          → 数据模型与持久化
```

### 插件间关系

- 每个插件独立，不相互依赖
- 共用能力沉淀到 `template/`，通过脚手架复制
- 不要在一个插件中引用另一个插件的文件

### 数据流（以 ai-config 为例）

```
用户操作 → DOM 事件 → 组件 syncFromDOM() → configJson 对象直接修改
→ formatConfigJson() 规范化 → store.saveConfig() → chrome.storage.local.set

页面加载 → store.loadConfig() → formatConfigJson() → renderAll() → 组件 syncToDOM()
```

- 组件直接读写 configJson 对象（in-place mutation），不做 immutability
- 全量重渲染策略：增删改操作后调用 `renderAll()`，手风琴模型限制可见 DOM 节点
- 保存时才序列化到 storage

## 核心约束

- Manifest V3，不使用已废弃的 V2 API
- `chrome.storage.local` 存储有配额限制（默认 5MB / 10MB），大数据要做拆分或压缩
- Service worker 不保持常驻，不要在 worker 中维护内存状态
- Content script 运行在隔离的"isolated world"，DOM 可见但 JS 变量不可见
- 不要使用 `innerHTML` 拼接用户输入或外部数据，避免 XSS
- 文件上传后要及时 `revokeObjectURL`，避免内存泄漏
- Import 路径使用相对路径（`./`、`../`），不使用绝对路径或裸 specifier

## 简洁优先

- 优先删除无引用代码、重复逻辑、历史兼容壳和已注释掉的代码块
- 同一职责只有一个主入口，避免多处重复实现
- 不过度设计，不提前为假想需求写抽象
- 三个相似行好过一个过早抽象
- 不要新增半成品实现或未完成的 feature flag
- 不需要的错误处理不要加：信任内部代码和框架保证，只在系统边界校验（用户输入、外部 API）

## 修复原则

- 先分析根因，做源头修复，不叠加分支掩盖症状
- 新增判断必须有明确理由，只用于真实边界、必要容错或兼容场景
- 发现问题后优先在源头模块修正，不在上层绕过
- 不要因为"改不动"就用破坏性操作（如 `git reset --hard`）绕过问题
- 遇到障碍时先诊断，不是删除绕过

## 代码风格

- 不写注释解释"做了什么"，命名已经说明；只在 WHY 不明显时写一行短注释
- 不要写多行 docstring 或多行注释块
- 不要在注释中引用当前任务编号、fix 版本号或具体调用方
- 只做当前任务需要的最小改动，不顺手重构无关代码
- 不要向后兼容命名（如 `_oldMethod`、`// removed` 注释），确定无用就删干净

## 安全

- 不引入 XSS、命令注入等漏洞
- 文件上传、外部数据解析要校验格式和边界
- 不在前端代码中硬编码密钥或敏感信息
- `innerHTML` 只用于静态模板内容，动态数据走 `textContent` 或 DOM API
- JSON/Excel 导入时要 try/catch 解析错误并给出用户可理解的提示

## 命名与数据模型

- 文件名：kebab-case（`scorepoint-row.js`）
- 函数名：camelCase（`renderScorePointRow`）
- 常量：UPPER_SNAKE_CASE（`STORE_KEY`）
- 组件文件与渲染函数命名对应：`aievent-row.js` → `renderAiEventRow()`

数据模型字段沿用原业务命名（camelCase，中文语义），例如 `experimentTotalScore`、`stepFinishedRules`。新增字段保持与同层级已有字段风格一致。

## 插件说明

每个插件的详细说明见各自的 `plugins/<name>/README.md`。AGENTS.md 只保留项目级通用规范，不承载单个插件文档。

## 文档规则

### 需要更新文档的场景

| 改动类型 | 更新目标 |
|----------|----------|
| 新增插件 | 创建 `plugins/<name>/README.md` |
| 插件重大功能 | 更新 `plugins/<name>/README.md` |
| 插件设计取舍 | 写入 `plugins/<name>/docs/memory/决策/` |
| 跨插件模板/脚本变更 | 更新 `docs/memory/决策/` |
| 项目级规范调整 | 更新 `AGENTS.md` |
| 数据模型字段语义变化 | 更新对应插件的 README.md |

### 不需要更新文档的场景

- 修 bug（除非修复过程暴露了值得记录的设计问题）
- 纯内部重构（不改变行为）
- 代码风格修正

如果改动只是修 bug 或内部重构，不强制更新文档。但如果接口语义、统计口径或协作协议发生变化，文档必须同步。

## 验证清单

改完代码后至少确认：
- JS 语法无报错，import 路径正确
- 在 Edge 中加载插件并点击关键路径
- 控制台无未预期的错误或 CSP 告警
- 数据持久化：保存 → 刷新 → 确认数据仍在
- 增删改操作后 UI 状态正确（手风琴、统计数字、颜色标记）
- 导出 JSON 与原始页面输出一致（diff 校验）

## 提交规范

```
feat:【<模块>】<中文简述>
fix:【<模块>】<中文简述>
refactor:【<模块>】<中文简述>
docs:【<范围>】<中文简述>
```

模块名用插件目录名或功能区域：
- `feat:【ai-config】新增步骤拖拽排序功能`
- `fix:【ai-config】修复 Excel 导入列号错位`
- `refactor:【template】统一 storage.js 封装`
- `docs:【项目】新增 AGENTS.md 协作规范`

提交前确保：
- 不提交 `.DS_Store`、`.env`、`*.zip` 等文件（依赖 `.gitignore`）
- 不跳过 hooks（`--no-verify`），hook 失败时修复后新建提交
- 不 amend 已发布的提交
