# ai-config — AI 算法评分配置编辑器

源自 `msptp-platform-school-front` 项目的 `/scoreAI/aiConfigEdit` 页面，复刻为浏览器扩展。

## 打开方式

工具栏图标 → 新标签页（New Tab）。Service worker 调用 `chrome.tabs.create({ url: 'page/editor.html' })`。

## 功能

- **四级嵌套树编辑**：实验步骤（Step）→ 评分点（ScorePoint）→ 评分事件（ScoreEvent）→ AI 事件（AiEvent）
- **手风琴模式**：每级只展开一个节点，控制长列表的 DOM 体积
- **拖拽排序**：拖动步骤序号圆圈可重排步骤顺序
- **分数统计**：每级实时显示子级分数汇总，绿色（匹配）/ 红色（不匹配）
- **JSON 导入导出**：上传版 / 平台版 / 盒子版三种导出格式
- **Excel 导入**：通过 SheetJS 解析 22 列 Excel 配置表
- **完成规则**：步骤可配置完成规则（多选 AI 事件码）
- **事件依赖**：AI 事件可配置依赖关系（OCCURRING_ALL / OCCURRED_STEP 等）
- **错误事件**：隐藏的错误事件区域，含归属步骤字段

## 文件结构

```
page/
├── editor.html              # 页面壳 + 8 个 <template>
├── editor.css               # 全部样式
├── editor.js                # 主编排器（bootstrap / renderAll / save / refreshStats）
├── model.js                 # 数据模型、默认值工厂、规范化、分数求和
├── store.js                 # chrome.storage.local CRUD 包装
├── export.js                # 三种导出格式 + 下载
├── import.js                # JSON 导入 + Excel 导入
└── components/
    ├── top-form.js          # 顶部元数据表单 + 工具栏按钮
    ├── step-row.js          # 步骤行 + 完成规则 + 拖拽
    ├── scorepoint-row.js    # 评分点行
    ├── scoreevent-row.js    # 评分事件行
    ├── aievent-row.js       # AI 事件行 + 依赖列表
    └── error-events.js      # 错误事件区域
```

## 注意事项

- **持久化 key**：`LOCAL_CONFIG_JSON`（chrome.storage.local），与原始页面 localStorage key 同名以保持导入兼容
- **依赖**：`lib/xlsx.full.min.js`（SheetJS，约 944KB），通过 `<script>` 标签加载，非 ES module
- **无构建**：所有 JS 使用 `type="module"` 原生加载，不经过打包
- **`model.js` 关键逻辑**：
  - `formatConfigScorePoint` 只在 `scoreEventIsCorrect === 1`（加分项）时累加分数
  - `formatConfigJson` 会检测重复的 stepCode，返回 `{ error: '...' }`
  - `scoreEventDefaultStatus` 默认为 `1`（默认满分），`duration` 默认为 `1`
- **全量重渲染**：增删改操作后触发 `renderAll()`，手风琴模型保证性能
- **Edge 兼容**：使用 `chrome.*` API 命名空间（非 `browser.*`）
