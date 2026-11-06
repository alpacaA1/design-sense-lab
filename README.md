# Design Sense Lab

一个用于训练组件尺寸直觉、调整真实文档排版并保存个人样式的纯前端工作台。

## 在线访问

<https://alpacaa1.github.io/design-sense-lab/>

`main` 分支每次推送后，会通过 `.github/workflows/pages.yml` 自动部署到 GitHub Pages。

## 运行

```bash
python3 -m http.server 4317
```

然后打开 <http://localhost:4317>。

## 当前能力

- Component Lab：按钮、输入框、标签页、卡片、表格行、对话框和侧边导航训练
- 猜尺寸默认遵循观察、作答、确认和揭晓流程；临摹匹配保留持续对照，探索沙盒用于自由调节
- 七类组件各有四套常见尺度预设，每轮受约束随机出题且不会连续重复
- 每题只训练二至三个相关参数，并只按本轮参数计算误差
- 支持基础、进阶、综合三级难度，逐步从常见尺度过渡到相近数值与全参数判断
- 目标、自己的版本与叠加校准视图；组件按 100% 原始尺寸显示，揭晓后以目标虚线、当前高宽和主要偏差完成校准
- 按钮揭晓后显示内部结构尺，将左右内边距、图标、图文间距、文字宽度与按钮总宽对应起来
- 画布支持 50%–200% 显示缩放与一键恢复 100%，缩放不改变组件参数和训练结果
- 揭晓后可再次练习、切换组件、展开全部误差或保存结果
- 浏览器本地保存最近的组件训练结果
- 按组件和参数汇总高估、低估与变化趋势，并可从至少两次样本的弱项启动专项复练
- 长文档、一页纸、简历、正式信件四种定制模板
- 单一完整文档画布，长文档支持连续分页
- Page、Typography、Hierarchy、Spacing、Components、Color 六类参数
- 数值、枚举、颜色和开关实时作用于当前文档
- 扩大的单一文档画布，减少与排版无关的状态占位
- My Styles 保存、筛选和恢复完整参数组合，支持模版备注、仅应用配色、转存至配色积累以及 JSON 备份导入导出
- 每种文档类型拥有独立参数状态
- 浏览器本地持久化、响应式布局、键盘操作和减少动态支持
- 配色积累：围绕纸张底色、主要文字、次级文字与强调色四角色语义色板，记录搭配心得与场景标签，实时计算对比度并渲染微缩样张预览；支持与文档排版双向联动（从文档一键存入配色、将配色一键应用到当前文档）及 JSON 备份合并导入导出；直接访问 `#colors` 可打开配色列表
- 提示词笔记：标题、原文、自己的理解与可选技术标签，支持新建、编辑、全文检索、技术筛选和一键复制
- 笔记首次打开提供可编辑的水彩动画提示词示例；数据独立保存在当前浏览器，可导出 JSON 备份并在另一台设备合并导入，重复内容跳过、冲突内容另存
- 保存和导入前检查本地数据是否已被另一窗口更新；若有变化，保留编辑内容并提示复制、刷新，避免旧页面覆盖新记录
- 提示词笔记按需加载；直接访问 `#prompts` 可打开笔记列表

## 文件结构

- `config.js`：四种文档类型及其参数定义
- `state.js`：文档状态、My Styles 模版库和本地持久化
- `controls.js`：六类参数及四类控件
- `renderers.js`：文档模板和实时指标
- `styles-library.js`：My Styles 模版筛选、恢复、仅用配色与转存
- `component-lab.js`：组件训练配置、预览、误差与本地记录
- `app.js`：工作台协调
- `color-palettes.js` / `color-palettes-store.js` / `color-palettes.css`：配色积累、对比度刻度、微缩样张与独立存储
- `prompt-notes.js` / `prompt-notes-store.js` / `prompt-notes.css`：轻量提示词笔记、独立本地存储与样式

## 验证

```bash
node --experimental-default-type=module tests/state_test.mjs
node --experimental-default-type=module tests/color_palettes_test.mjs
node --experimental-default-type=module tests/prompt_notes_test.mjs
```

启动本地服务后，可运行 `python3 tests/color_palettes_ui_smoke.py` 和 `python3 tests/prompt_notes_ui_smoke.py` 验证配色积累、文档模版与提示词笔记的保存、复制、备份合并与手机布局。

浏览器验收覆盖桌面端和 390px 手机宽度。

## 暂未包含

- 作品集、幻灯片、Markdown 演示稿和产品落地页
- Web / App 设计实验
- AI 内容生成和文档文件导出
- 登录、云同步和多人协作
