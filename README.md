# OKKI 本地演示

两个独立运行的静态前端演示，共用一个源码仓库。此版本整理自 2026-11-16 的本地工作文件，包含当时尚未提交的最新功能，不包含旧 Git 历史。

这是界面与交互演示，并非 OKKI 官方产品或生产系统。AI 回复、背调结果、邮件接续和 WhatsApp 消息均为演示流程，不连接真实 CRM、模型或通讯后台，不发送真实邮件或消息。不要输入真实客户资料或密钥。

## 快速启动

需要 Node.js 22 或更新版本；本次在 Windows、Node.js 24.14.1 下验证。无需 `npm install`，所有运行时脚本和图片均已包含。

Windows 双击根目录的 **`启动全部.cmd`**。也可在仓库根目录运行：

```bash
npm start
```

不自动打开浏览器时：

```bash
node scripts/start-projects.mjs --no-open
```

智能销售与 AI 背调默认地址为 <http://127.0.0.1:8181/>，AI 对话、邮件和 WhatsApp 默认地址为 <http://127.0.0.1:8182/>。启动器只监听本机；这两个项目不会自动成为一个统一入口或共享后台。

保持终端窗口开启。按 Ctrl+C 停止本次启动的服务；如果启动器复用了已在同一目录运行的服务，它不会停止已有进程。

端口冲突时，在 PowerShell 设置新的起始端口再启动：

```powershell
$env:OKKI_BASE_PORT = '8191'
node .\scripts\start-projects.mjs --no-open
```

这时使用 8191 和 8192。不要结束不明占用进程。不要直接双击 HTML 代替 HTTP 启动，聊天页面包含 ES Modules。

## 仓库内容

```text
.
├── okkicrm/site/        智能销售、接待列表、AI 背调和拦截恢复演示
├── okki-chat/site/      AI 中英文对话、需求收集、交付卡片、邮件和 WhatsApp
├── scripts/            本地启动器与提交前检查
├── docs/               GitHub 上传指引和第三方许可提示
├── 启动全部.cmd         Windows 启动入口
├── package.json        无第三方 npm 依赖的运行命令
├── .gitignore          本地文件、凭据和缓存排除规则
└── .gitattributes      文本与二进制文件规则
```

两站保留原本的 HTML/CSS/JavaScript 文件布局和 `assets/`、`vendor/` 相对路径。暂未被页面加载的非临时模块也保留，方便后续编辑；本次整理不做业务代码重构。

原始输入视频、历史截图、两册 PDF 操作手册、开发过程记录和工具缓存未放进仓库。它们仍保留在原工作区，运行此仓库不需要这些资料。

## 检查与后续维护

```bash
npm run check
```

检查源码语法、HTML/ES Module/CSS 的静态本地依赖、明显凭据特征及文件大小。该检查是提交前辅助工具，不能替代完整业务测试、隐私审查或许可证审查。浏览器状态保存在各地址的 localStorage；换端口属于不同来源，演示状态可能不同。

当前代码含 GSAP 3.13.0 及插件，保留原始许可头部。自有代码未指定开源许可证。上传前阅读 [GitHub 上传指引](docs/github-upload.md) 和 [第三方与授权说明](docs/third-party-notices.md)。建议先用私有仓库整理，公开前核对品牌、头像和演示数据授权。
