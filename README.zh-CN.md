<p align="center">
  <img src="assets/icons/icon-128-display.png" alt="EnvMate logo" width="96" height="96">
</p>

<h1 align="center">EnvMate</h1>

<p align="center">
  <a href="README.md">English</a> | 简体中文
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/envmate/mccdmjfnlkkjmcioapnehkmpgkblhiei">
    <img src="https://img.shields.io/chrome-web-store/users/mccdmjfnlkkjmcioapnehkmpgkblhiei?logo=googlechrome&amp;label=Chrome%20users" alt="Chrome Web Store users">
  </a>
  <a href="https://microsoftedge.microsoft.com/addons/detail/enighdiiommdnommodoninagjanhiogb">
    <img src="https://img.shields.io/badge/Edge%20Add--ons-0078D7?logo=microsoftedge&amp;logoColor=white" alt="Microsoft Edge Add-ons">
  </a>
  <a href="https://addons.mozilla.org/addon/envmate/">
    <img src="https://img.shields.io/amo/users/envmate?logo=firefoxbrowser&amp;logoColor=white&amp;label=Firefox%20users" alt="Firefox Add-on users">
  </a>
</p>

<p align="center">
  一款支持 Chrome、Edge 和 Firefox 的浏览器扩展，面向每天需要在开发、测试、预发布和生产环境之间切换的团队。
</p>

<p align="center">
  EnvMate 让当前环境一目了然、便于随手使用测试账号，并减少因系统界面相似导致的误操作。
</p>

## 功能亮点

- 通过 URL 规则识别环境。
- 在匹配页面显示角标、水印，或同时显示两者。
- 可选择在页面标题前添加环境标签。
- 在独立的选项页中管理分组环境。
- 为每个环境保存多个测试账号，并按需填充。
- 在扩展弹窗中直接显示当前匹配的环境。
- 为环境添加首页 URL，以便从弹窗直接跳转到分组内的环境入口。

## 从 Chrome 应用商店安装

[从 Chrome 应用商店安装 EnvMate](https://chromewebstore.google.com/detail/envmate/mccdmjfnlkkjmcioapnehkmpgkblhiei)

## 从 Microsoft Edge 加载项安装

[从 Microsoft Edge 加载项安装 EnvMate](https://microsoftedge.microsoft.com/addons/detail/enighdiiommdnommodoninagjanhiogb)

## 从 Firefox 附加组件安装

[从 Firefox 附加组件安装 EnvMate](https://addons.mozilla.org/addon/envmate/)

## 为什么需要 EnvMate

许多内部系统在开发、测试、预发布和生产环境中的界面几乎一致。EnvMate 通过轻量的视觉提示，让你在点击、编辑或提交重要操作前清楚知道自己正处在哪个环境。

## 更新日志

- 2026-08-12 · v0.5.1：修复展开快速访问后弹窗宽度异常变大的问题。
- 2026-08-05 · v0.5.0：新增页面文字编辑功能，方便临时修改文案进行核对和截图。
- 2026-07-31 · v0.4.0：新增呼吸灯标记，并修复导入和导出弹框在展开环境树时的自适应布局。
- 2026-07-20 · v0.3.0：新增通过 URL 导入配置，支持保存导入范围和一键重新导入。
- 2026-07-10 · v0.2.4：导出时可选择包含测试账号，并增加密码安全提示。
- 2026-07-06 · v0.2.3：快速访问改为按配置中的环境顺序排列，不再按最近访问排序。
- 2026-06-18 · v0.2.1：优化配置分组内环境的拖拽排序。
- 2026-06-17 · v0.2.0：新增 Quick Access。

## URL 规则类型

- `wildcard`：支持 `*`，例如 `https://test.example.com/*`
- `prefix`：匹配 URL 前缀，例如 `https://pre.example.com/`
- `regex`：使用 JavaScript 正则表达式

## 标记选项

- `badge`：仅显示浮动环境角标
- `watermark`：仅显示水印
- `badge-watermark`：同时显示环境角标和水印

环境角标包含角落飘带、药丸标签和呼吸灯边缘光晕三种样式。边缘光晕使用角标颜色，并遵循角标的尺寸和透明度设置。

水印支持设置文字、透明度、角度、大小和间距。

## 测试账号

每个环境可以保存多个测试账号。账号可排序、标记为默认填充目标，并在当前页面匹配该环境时从扩展弹窗中填充。

EnvMate 仅会在用户明确触发后填充字段，不会自动提交表单或触发登录按钮。

## 在 Chrome 或 Edge 中本地安装

1. 打开 `chrome://extensions`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择项目目录。

## 配置环境

打开扩展的选项页后，你可以：

- 创建分组
- 向分组添加环境
- 配置 URL 匹配规则
- 自定义环境角标和水印外观
- 添加和管理测试账号

每个环境最重要的部分是它的 `URL Rules`，因为这些规则决定 EnvMate 在哪些页面生效。

## 典型使用场景

- 为生产页面添加醒目的环境角标，避免与测试环境混淆。
- 在页面标题前添加标签，让浏览器标签页中的环境差异更明显。
- 随手使用共享的 QA 或预发布账号，不必翻找记录。
- 按产品或业务线分组环境，便于管理大量配置。

## 构建发布产物

- `make zip`：生成 `dist/envmate-<version>.zip`
- `make firefox-zip`：生成用于 Firefox AMO 的 `dist/envmate-<version>-firefox.zip`；该包使用 Firefox 后台脚本兼容方案，不会影响 Chrome/Edge 包。
- `make crx`：使用 Chrome 构建 `.crx` 包
- `make crx KEY=path/to/key.pem`：复用已有签名密钥

若未提供 `KEY`，Chrome 会在 `.keys/` 中生成新的私钥，扩展 ID 也会随之改变。请勿提交 `.keys/` 中的文件。
