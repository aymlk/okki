# 将这个仓库连接到 GitHub

本地 `outputs/github-upload/` 是独立 Git 仓库，默认分支为 `main`，`origin` 已连接 [aymlk/okki](https://github.com/aymlk/okki)。原项目的两份 Git 历史仍在原工作区，没有合并进这个仓库。为兼容远端初始 README，本次采用保留远端提交的合并方式，不强制覆盖历史。

上传对象是这个干净仓库，不是原 `okki` 根目录。之前交付的 ZIP 是源码快照，不包含 `.git` 或提交历史；如果使用 ZIP，请先解压，再在独立目录初始化仓库，不要把 ZIP 本身作为唯一源码文件提交。

建议首次使用私有仓库。公开前核对 [第三方与授权说明](third-party-notices.md)；私有仓库也不应包含密码、API 密钥或未经允许的客户资料。

## 使用用户提供的 GitHub 仓库链接

收到仓库链接后，先检查远端是否为空、默认分支是什么。若仓库已有 README、LICENSE 或其他提交，不要强制推送覆盖，应先核对并保留远端历史。

在当前本地仓库打开 PowerShell，可以查看状态并重新运行检查：

```powershell
git status
git branch --show-current
git log -1 --oneline
git remote -v
npm run check
```

当前 `origin` 已存在，不要重复执行 `git remote add`。后续完成变更、检查并提交后，使用普通 push；如提示远端更新，先获取并核对历史，不强制覆盖：

```powershell
git remote -v
git push origin main
```

如果 `origin` 已存在，先查看地址，不要盲目覆盖。远端有内容时先 fetch 或克隆并评估合并方式，不使用强制推送。

## GitHub Desktop

选择 File → Add local repository，添加当前 `outputs/github-upload/`。无需重新 Create repository，也无需再复制一份代码。先检查当前分支与工作区状态；若要连接用户给出的现有仓库，先配置对应的 `origin`，不要误用 Publish repository 另建仓库。

## 从 ZIP 创建另一份本地仓库

ZIP 不含 `.git`，因此解压到新的独立空目录后，可以使用下面的初始化步骤。不要在已有仓库或原 `okki` 根目录重复初始化。

```powershell
npm run check
git init -b main
git add .
git status --short
git diff --cached --stat
```

人工检查待提交文件不含敏感资料后，再自行执行首次提交。解压得到的另一份仓库与当前已初始化的本地仓库是两个独立工作副本。

## 网页上传与大小限制

网页 Add file → Upload files 一次可上传最多 100 个文件，单文件不超过 25 MiB。[1] 需要确认 `.gitignore`、`.gitattributes` 等隐藏文件被选中，并保留 `okki-chat/site/` 与 `okkicrm/site/` 目录层级；不要上传 `.git`。

网页上传不会应用 `.gitattributes` 的行尾转换规则，也不读取本地忽略规则，更不会保留本地提交历史。因此当前已初始化的仓库推荐通过 Git 推送。[1] 后续加入大视频时要重新核对大小：Git 推送超过 50 MiB 的文件会收到警告，超过 100 MiB 会被阻止。[2]

## 提交范围

本仓库跟踪两个项目 `site/` 中的 HTML/CSS/JavaScript、图片、vendor、本地启动器、检查器、仓库配置和文档。原始视频、历史截图、PDF 操作手册、TODO 内部记录、工具缓存、`.manus-webdev/` 和原项目 `.git` 指针不纳入这个仓库。

后续新增资料前仍需检查隐私和授权，不要直接复制整个原工作区。检查器仅辅助发现明显凭据及资源问题，不能代替完整业务、隐私或许可证审查。

## References

[1]: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository "GitHub 官方：添加文件到仓库"
[2]: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github "GitHub 官方：大型文件限制"

上传约束查证日期：2026-11-16；本地 Git 仓库初始化日期：2026-11-16。
