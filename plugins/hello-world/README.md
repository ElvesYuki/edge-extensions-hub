# hello-world — 示例插件

演示 Manifest V3 浏览器扩展的基本结构，含 popup、storage 和 content script。

## 打开方式

工具栏图标 → Popup 弹窗。

## 功能

- **访问计数器**：点击图标累计次数，数字持久化到 `chrome.storage.local`
- **Storage 读写演示**：popup 中可手动 set/get/remove storage 键值

## 文件结构

```
popup/
├── popup.html              # Popup 界面
├── popup.css               # Popup 样式
└── popup.js                # Popup 逻辑（ES module）
content/
└── content.js              # Content script（自包含，无 import）
background/
└── service-worker.js       # 生命周期管理
utils/
├── storage.js              # chrome.storage.local promise 封装
└── messenger.js            # 消息传递工具
```

## 注意事项

- 作为模板参考，不承载业务功能
- Content script 必须自包含，不能使用 ES module import
- Service worker 使用 `"type": "module"` 声明
