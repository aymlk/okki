# 第三方与授权说明

本仓库没有为自有代码指定统一开源许可证。把源码放到 GitHub，或选择私有仓库，都不等于获得素材授权或替第三方库授予新许可证。以下是整理时的核查提示，不构成法律意见。

## GSAP 与插件

`okkicrm/site/vendor/` 中包含 GSAP，`okki-chat/site/vendor/` 中包含 GSAP、Flip、SplitText、ScrambleTextPlugin 和 CustomEase。现有文件头部的版本均为 3.13.0。

所有 vendor 文件按原始字节复制，保留 `Copyright 2025, GreenSock. All rights reserved.` 和 `Subject to the terms at https://gsap.com/standard-license` 等原始声明。不要删除版权头部，也不要把这些库标成 MIT。

2026-11-16 核查的 [GSAP 官方标准许可证](https://gsap.com/standard-license)允许在网站、Web 应用和数字界面中按条款使用 GSAP，但包含针对与 Webflow 可视化动画构建能力实质竞争产品的限制。当前仓库是本地界面交互演示，未加入动画编辑器或相关商业后台；后续用途变化时，应重新阅读完整条款，而不是将本说明理解为无条件授权。

本说明记录查证时的摘要，不替代完整许可证。发布、转交源码或商业使用前请再次核对链接中的有效条款，并保留库自带声明。

## 品牌、头像与客户内容

页面中出现 OKKI 和 WhatsApp 品牌名称。项目不是这两个品牌的官方产品，本次整理不声称得到品牌授权。

页面含客户名称、公司名、邮箱、对话内容和头像。原始来源及授权尚未逐项确认，本次未擅自删除或改写业务演示数据。公开发布前应确认它们是可公开的虚构数据或已获授权内容；不确定时，改为自行制作或明确获授权的占位数据和头像。

私有仓库也属于向服务提供方及仓库协作者上传资料，不能作为跳过隐私与授权核对的理由。不要把真实客户资料、密码或密钥加入仓库。

原工作区视频、截图和 PDF 未包含在本次源码仓库中。后续若加入，仍需单独核对其中的客户内容、来源授权和机器路径信息。

## 官方来源

- [GSAP Standard License](https://gsap.com/standard-license)
- [GitHub：添加文件时不要提交敏感信息](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)

核查日期：2026-11-16。演示页面、头像与虚构客户内容按用户确认保留；该选择不免除第三方许可要求。后续加入真实资料或新素材时，仍需核对隐私与授权。
