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
- **Excel 导入**：通过 SheetJS 解析 21 列 Excel 配置表
- **完成规则**：步骤可配置完成规则（多选 AI 事件码）
- **事件依赖**：AI 事件可配置依赖关系（OCCURRING_ALL / OCCURRED_STEP 等）
- **错误事件**：隐藏的错误事件区域，含归属步骤字段
- **导出前校验**：保存 / 导出前拦截 ADD 占位编码、空编码、重复编码和失效依赖
- **配置状态提示**：顶部状态条显示未保存、已保存、导入校验、校验失败、导出成功等状态
- **导入前备份**：JSON / Excel 导入会自动备份当前本地配置，可通过“恢复备份”回退

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
├── validate.js              # 保存 / 导出前业务校验
└── components/
    ├── top-form.js          # 顶部元数据表单 + 工具栏按钮
    ├── step-row.js          # 步骤行 + 完成规则 + 拖拽
    ├── scorepoint-row.js    # 评分点行
    ├── scoreevent-row.js    # 评分事件行
    ├── aievent-row.js       # AI 事件行 + 依赖列表
    └── error-events.js      # 错误事件区域
```

## 注意事项

- **持久化 key**：`LOCAL_CONFIG_JSON`（当前配置）、`LOCAL_CONFIG_JSON_BACKUP`（最近一次导入前备份），均存储在 chrome.storage.local
- **依赖**：`lib/xlsx.full.min.js`（SheetJS，约 944KB），通过 `<script>` 标签加载，非 ES module
- **无构建**：所有 JS 使用 `type="module"` 原生加载，不经过打包
- **Excel 列映射**：导入逻辑在 `import.js` 的 `EXCEL_COLUMNS` 中集中声明列号；第 2 行读取实验名称 / 实验编码，并作为首条数据行参与逐层归组；后续数据按步骤、评分点、评分事件、AI 事件编码归组
- **`model.js` 关键逻辑**：
  - `formatConfigScorePoint` 只在 `scoreEventIsCorrect === 1`（加分项）时累加分数
  - `formatConfigJson` 会检测重复的 stepCode，返回 `{ error: '...' }`
  - `scoreEventDefaultStatus` 默认为 `1`（默认满分），`duration` 默认为 `1`
- **保存 / 导出校验**：会阻止包含 `ADD` 占位编码、空编码、同层级重复编码、失效事件依赖、失效归属步骤的配置流出；导出前会自动保存当前配置
- **导入校验**：JSON / Excel 导入成功后会立即执行业务校验，存在问题时显示校验面板
- **导入前备份**：导入 JSON / Excel 前会备份当前本地配置；“恢复备份”会用最近一次备份覆盖当前配置
- **状态条**：编辑操作会标记为“存在未保存修改”，保存 / 导入 / 导出 / 校验失败会更新顶部状态
- **危险操作确认**：清空配置、恢复备份、移除步骤、移除评分点、移除评分事件前会显示居中确认弹框；点击遮罩空白处会取消操作
- **全量重渲染**：增删改操作后触发 `renderAll()`，手风琴模型保证性能
- **Edge 兼容**：使用 `chrome.*` API 命名空间（非 `browser.*`）
