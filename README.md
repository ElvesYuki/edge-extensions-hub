# Edge Extensions Hub

基于 Manifest V3 的浏览器插件合集，适配 Edge、Chrome 及所有 Chromium 内核浏览器。

## 技术规范

- **Manifest V3 only**，不兼容 V2
- 原生 HTML + CSS + JavaScript，无框架依赖
- 统一使用 `chrome.*` API，Edge 完全兼容
- 存储统一使用 `chrome.storage.local`
- 严格环境隔离：Popup / Content Script / Service Worker

## 目录结构

```
├── template/          # 通用插件模板（manifest + popup + content + background + utils）
├── plugins/           # 插件目录，一个插件一个子目录
│   ├── hello-world/   # 示例插件
│   └── ...
├── scripts/           # 工具脚本
│   └── new-plugin.sh  # 从模板快速创建新插件
└── LICENSE
```

## 快速开始

### 创建新插件

```bash
./scripts/new-plugin.sh my-plugin "我的插件" "一个实用的浏览器小工具"
```

### 在 Edge 中加载调试

1. 打开 `edge://extensions`
2. 开启「开发人员模式」
3. 点击「加载解压缩的扩展」
4. 选择 `plugins/<your-plugin>/` 目录

### 每个插件独立目录包含

| 文件/目录 | 说明 |
|-----------|------|
| `manifest.json` | 插件清单（MV3） |
| `icons/` | 图标 (16/32/48/128) |
| `popup/` | 弹窗页面 (html/css/js) |
| `content/` | 内容脚本 |
| `background/` | Service Worker |
| `utils/` | 通用工具 (storage + messenger) |

## 安全原则

- 权限按需申请，不滥用全域权限
- 跨域请求统一由 Background Service Worker 中转
- 不使用 localStorage，全部走 chrome.storage.local
