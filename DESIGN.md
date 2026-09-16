---
name: Design Sense Lab
description: 一个围绕真实文档调整排版并保存个人样式的安静工作台。
colors:
  primary-ink-blue: "#1B365D"
  primary-deep: "#142D4F"
  canvas: "#F5F4ED"
  surface: "#FAF9F5"
  surface-subtle: "#EFEDE5"
  ink: "#141413"
  ink-soft: "#3D3D3A"
  muted: "#87867F"
  border: "#E8E5DA"
  document-ink: "#262522"
  placeholder: "#87867F"
  positive-bright: "oklch(0.78 0.14 151)"
typography:
  headline:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif"
    fontSize: "25px"
    fontWeight: 680
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  body:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  reading:
    fontFamily: "Songti SC, STSong, Noto Serif CJK SC, Georgia, serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  xxs: "4px"
  xs: "5px"
  sm: "6px"
  logo: "8px"
  md: "10px"
  lg: "14px"
  device-screen: "22px"
  device: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary-ink-blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
---

# Design System: Design Sense Lab

## Overview

**Creative North Star: "The Quiet Instrument"**

界面像一件校准准确的设计仪器。它提供像素刻度、真实纸张和结果反馈，却不替用户规定唯一答案。工具外壳保持中性和稳定，正在训练的组件或文档始终是视觉中心。

整体分为 Component Lab 与 Document Studio。两者都采用“参数侧栏 + 单一画布”的产品型布局：组件训练使用目标、当前和叠加视图进行校准；文档工作台通过类型导航切换长文档、一页纸、简历和正式信件。

**Key Characteristics:**

- 双栏式专业工具布局，参数与文档画布职责明确。
- 暖羊皮纸画布配单一油墨蓝强调色，颜色只表达状态和操作。
- 文档类型可以变化，工具外壳始终克制。
- 响应式改变结构，不使用流式夸张字号。
- 动画只反馈状态，并尊重减少动态设置。

## Colors

采用 Kami 的暖纸色作为工作台情感基底，墨蓝只用于当前状态、交互焦点和主要操作。

### Primary

- **Ink Blue** (`#1B365D`): 当前模式、参数进度、选中状态和保存按钮。
- **Deep Ink Blue** (`#142D4F`): 主要操作的悬停状态。

### Neutral

- **Parchment Canvas** (`#F5F4ED`): 实验区背景。
- **Ivory Surface** (`#FAF9F5`): 面板、控件和预览容器。
- **Near Black** (`#141413`): 主要文字。
- **Border Cream** (`#E8E5DA`): 区域分隔和控件边界。

**The One Signal Rule.** 墨蓝占任一屏幕面积不超过 10%，只表达选中、焦点和主要操作，不做装饰。

## Typography

**Display Font:** 系统无衬线字体栈
**Body Font:** 系统无衬线字体栈
**Reading Font:** Songti SC 与系统中文衬线回退

**Character:** 工具界面使用熟悉、清楚的无衬线字；文档实验单独使用衬线字，让媒介差异真实可见。

### Hierarchy

- **Headline** (680, 25px, 1.25): 实验主题，字距不小于 `-0.04em`。
- **Title** (650, 18px, 1.25): 面板和记录标题。
- **Body** (400, 14px, 1.5): 控件说明与界面正文。
- **Label** (590, 13px, 1.45): 参数、字段和按钮。
- **Reading** (400, 默认 16px, 由实验控制): 文档预览内容。

**The Two Voices Rule.** 无衬线只服务工具操作；衬线只进入文档实验内容，绝不混用来制造装饰性层级。

## Elevation

系统默认完全扁平。深度通过背景明度、单像素边界和固定区域结构表达；只有临时 Toast 使用深色反转，不使用宽而柔的装饰阴影。

**The Flat Instrument Rule.** 静止表面不悬浮。若隐藏阴影不影响状态和层级，就禁止添加阴影。

## Components

### Buttons

- **Shape:** 精确小圆角（6px），避免玩具感。
- **Primary:** Calibration Blue 填充、白字、高度 44px。
- **Hover / Focus:** 悬停加深；键盘焦点使用可见的半透明蓝色外环。
- **Secondary:** 白色表面加 Quiet Border，不使用阴影。

### Chips

- **Style:** 低高度胶囊仅用于筛选和场景标签；未选中为白底细边界。
- **State:** 选中使用浅蓝背景、墨蓝文字和墨蓝边界，不能只依赖颜色，原生勾选状态保持可访问。

### Cards / Containers

- **Corner Style:** 克制圆角（10px）。
- **Background:** True Surface。
- **Shadow Strategy:** 无阴影。
- **Border:** Quiet Border 单像素完整边界。
- **Internal Padding:** 以 8px 为基础，主要内容使用 16–24px。

### Inputs / Fields

- **Style:** 白底、6px 圆角、明确边界；占位文字满足可读对比。
- **Focus:** 边界切换为 Calibration Blue，并显示外部焦点环。
- **Select:** 使用与工作台一致的浅色自定义菜单，选中项以浅蓝底和勾选符号表示，不继承系统深色弹层。
- **Error / Disabled:** 不只依赖颜色，必须同时提供文字或状态符号。

### Navigation

顶部导航高度 60px，第二行以纯文字 Tab 承载四种文档类型。当前类型只使用墨蓝文字、字重和 2px 下划线，不增加分栏边框或整块底色；窄屏时允许横向滚动，不压缩文档名称。

工作区标题栏只保留当前文档标题与操作按钮，不重复展示类型、纸张尺寸和用途说明。
标题栏高度压缩到 48px；工作区不设置常驻底部指标栏，让可用高度优先交给文档画布。

### Document Canvas

画布一次只显示当前文档。长文档使用连续纸张堆叠，其他类型默认单页；纸张保持真实宽高比，在手机端允许画布内部横向滚动，不让整页产生横向溢出。

### Parameter Stack

六个分类使用单开式折叠结构。数字控件同时提供滑杆和精确输入，颜色控件同时提供色块和颜色值，布尔状态使用带文字反馈的开关。中文标题行宽使用 `em` 近似表达可容纳字数，不使用基于数字宽度的 `ch`。每个参数必须直接作用于当前文档，不能只改变面板数值。

### Component Training Canvas

猜尺寸默认按照观察目标、隐藏目标后独立判断、确认提交和校准误差推进；自由调节明确作为探索沙盒，不承担正式训练结果。每类组件使用四组常见尺度预设，正式训练每轮受约束随机抽取尺度与主题并避免连续重复；每题只呈现二至三个相关参数，未训练参数保持目标值，评分也只计算本轮参数。训练组件默认按 100% 原始尺寸显示，让屏幕像素与标注一致；画布可在 50%–200% 之间按 25% 调整显示倍率并一键恢复 100%，缩放不改变参数与误差计算。判断阶段隐藏目标数值和尺寸标线，揭晓后先显示当前高宽与最大偏差，其余参数按需展开。按钮在揭晓后额外显示内部结构尺，把左右内边距、图标、图文间距、文字宽度和总宽建立空间对应；标注只解释当前结果，不在作答阶段提示答案。叠加视图以虚线表达目标轮廓、实色表达用户判断并提供图例；接近度分数只作为次级信息。

训练难度分为基础、进阶和综合：基础使用常见尺度及二至三个关联参数，进阶在安全预设上偏移一个刻度，综合覆盖当前组件全部参数。偏差趋势按组件与参数聚合最近三十次已保存结果；至少两个同参数样本才开放弱项复练，四个样本后才判断改善、稳定或波动。专项复练只提高弱项参数的出现确定性，不改变目标范围和评分标准。组件训练界面的关键说明、目标值与误差文字不小于 12px，核心操作目标不小于 40px。

## Do's and Don'ts

### Do:

- **Do** 保持参数区与完整文档画布的职责清楚。
- **Do** 让每种文档类型拥有独立结构、默认值和适用参数。
- **Do** 使用熟悉的原生控件语义、键盘操作和清晰焦点状态。
- **Do** 保持 A4、A5 和 Letter 的真实页面比例与分页感。
- **Do** 将正文对比度保持在 WCAG AA 以上。
- **Do** 在颜色调整中实时显示文字与纸张的对比度和 AA 结果。

### Don't:

- **Don't** 做成营销型 SaaS 首页，不用口号、渐变和装饰性数据卡营造价值感。
- **Don't** 做参数堆砌的 CSS Playground；参数必须对真实文档产生明确影响。
- **Don't** 使用玻璃拟态、霓虹色、巨大圆角、过度阴影和无意义动效。
- **Don't** 复制 Kami 的成品风格；只借鉴其约束思维。
- **Don't** 用颜色之外的视觉装饰抢夺实验内容的注意力。
- **Don't** 为了比较而长期缩小并平铺多个文档；默认只保留一个可阅读的完整画布。
