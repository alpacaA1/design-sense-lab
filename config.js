export const CATEGORY_ORDER = ["page", "typography", "hierarchy", "spacing", "components", "color"];

export const CATEGORY_META = {
  page: { label: "Page", zh: "页面", icon: "▤" },
  typography: { label: "Typography", zh: "文字", icon: "Aa" },
  hierarchy: { label: "Hierarchy", zh: "层级", icon: "≡" },
  spacing: { label: "Spacing", zh: "间距", icon: "↕" },
  components: { label: "Components", zh: "组件", icon: "□" },
  color: { label: "Color", zh: "颜色", icon: "◯" },
};

const number = (id, label, description, value, min, max, step, unit = "px") => ({
  id, label, description, type: "number", default: value, min, max, step, unit,
});

const select = (id, label, description, value, options) => ({
  id, label, description, type: "select", default: value, options,
});

const color = (id, label, description, value) => ({
  id, label, description, type: "color", default: value,
});

const toggle = (id, label, description, value) => ({
  id, label, description, type: "toggle", default: value,
});

const formatOptions = [
  { value: "a4", label: "A4 · 210 × 297mm" },
  { value: "a5", label: "A5 · 148 × 210mm" },
  { value: "letter", label: "Letter · 8.5 × 11in" },
];

const fontOptions = [
  { value: "serif", label: "中文宋体 · 阅读" },
  { value: "sans", label: "现代黑体 · 清晰" },
  { value: "kai", label: "系统楷体 · 人文" },
];

const weightOptions = [
  { value: "400", label: "400 Regular" },
  { value: "500", label: "500 Medium" },
  { value: "600", label: "600 Semibold" },
];

const baseTypography = () => [
  select("fontFamily", "正文中文字体", "决定文档的正式度、阅读感和文字灰度。", "serif", fontOptions),
  number("bodySize", "正文字号", "影响可读性、行长和页面容量。", 16, 12, 21, 1),
  number("lineHeight", "正文行高", "影响连续阅读的节奏和页面密度。", 1.65, 1.3, 2, 0.05, "×"),
  number("letterSpacing", "字间距", "细微调整中文正文的松紧和秩序感。", 0, -1, 2, 0.25),
  select("bodyWeight", "正文字重", "影响长文疲劳感和页面整体灰度。", "400", weightOptions),
];

const baseHierarchy = (title = 38, section = 22, titleWidth = 10) => [
  number("titleSize", "主标题字号", "建立文档的第一视觉层级。", title, 26, 58, 2),
  number("titleWidth", "标题行宽", "控制中文标题每行的最长距离与换行节奏。", titleWidth, 6, 20, 1, "字"),
  number("sectionTitleSize", "章节标题字号", "决定章节与正文之间的层级差。", section, 17, 32, 1),
  select("titleWeight", "标题字重", "影响标题的力量感和页面灰度。", "600", weightOptions),
  number("titleTracking", "标题字间距", "用于校准大字号标题的紧凑程度。", -0.4, -1.5, 2, 0.1),
];

const baseSpacing = (paragraph = 16, section = 32) => [
  number("paragraphGap", "段落间距", "决定段落边界和连续阅读节奏。", paragraph, 6, 30, 2),
  number("sectionGap", "章节间距", "决定不同内容模块的分组强度。", section, 16, 56, 4),
  number("headingAfter", "标题下间距", "标题下方应比章节上方更紧密。", 12, 6, 28, 2),
  number("itemGap", "条目间距", "控制列表、经历和项目条目的密度。", 10, 4, 24, 2),
];

const baseComponents = () => [
  select("surfaceStyle", "内容容器", "判断内容是否需要底色或边界承托。", "quiet", [
    { value: "flat", label: "无容器" },
    { value: "quiet", label: "浅底色" },
    { value: "outlined", label: "细边框" },
  ]),
  select("calloutStyle", "重点信息", "选择引用与结论的强调方式。", "fill", [
    { value: "plain", label: "纯文字" },
    { value: "fill", label: "浅底色" },
    { value: "rule", label: "分隔线" },
  ]),
  number("radius", "组件圆角", "控制文档组件的正式感和柔和程度。", 6, 0, 16, 2),
  toggle("showDividers", "分割线", "判断间距能否替代结构分割线。", true),
];

const baseColors = () => [
  color("textColor", "主要文字", "用于标题和正文，决定整体对比度。", "#262522"),
  color("mutedColor", "次级文字", "用于标签、日期、页码和辅助信息。", "#716d66"),
  color("pageColor", "纸张底色", "改变纸张的冷暖和屏幕阅读感。", "#fffefb"),
  color("accentColor", "强调色", "只用于少量标题、链接和关键信息。", "#315f9e"),
];

const category = (summary, parameters) => ({ summary, parameters });

export const DOCUMENT_TYPES = {
  longdoc: {
    label: "长文档",
    prompt: "帮我排版一份长文档",
    description: "连续阅读、清晰章节与稳定分页",
    defaultCategory: "typography",
    categories: {
      page: category("控制纸张、页边距与连续分页", [
        select("pageFormat", "纸张尺寸", "选择目标阅读或打印尺寸。", "a4", formatOptions),
        number("pageMargin", "页面边距", "影响行长、呼吸感和单页容量。", 44, 24, 68, 4),
        select("columns", "正文分栏", "单栏适合连续阅读，双栏适合扫描。", "1", [
          { value: "1", label: "单栏" }, { value: "2", label: "双栏" },
        ]),
        toggle("showHeaderFooter", "页眉页脚", "显示文档名称、章节和页码。", true),
      ]),
      typography: category("建立适合长时间阅读的文字节奏", baseTypography()),
      hierarchy: category("用字号、行宽、字重和位置组织章节", baseHierarchy(40, 23, 10)),
      spacing: category("控制段落、标题和章节之间的关系", baseSpacing(17, 36)),
      components: category("调整引用、信息块和分隔方式", baseComponents()),
      color: category("研究纸张、文字层级和强调色", baseColors()),
    },
  },
  onepager: {
    label: "一页纸",
    prompt: "帮我做一份一页纸",
    description: "一页内建立重点、证据与行动",
    defaultCategory: "page",
    categories: {
      page: category("在固定页面中平衡信息量与留白", [
        select("pageFormat", "纸张尺寸", "一页纸默认使用 A4，也可以选择 Letter。", "a4", formatOptions),
        number("pageMargin", "页面边距", "直接影响可用空间和页面气质。", 32, 20, 56, 4),
        select("columns", "内容结构", "选择纵向叙事或双栏信息结构。", "2", [
          { value: "1", label: "单栏叙事" }, { value: "2", label: "双栏信息" },
        ]),
        toggle("fitOnePage", "控制在一页", "开启后压缩溢出的间距和内容块。", true),
      ]),
      typography: category("让有限空间中的文字保持可读", baseTypography().map((item) => item.id === "bodySize" ? { ...item, default: 14 } : item.id === "lineHeight" ? { ...item, default: 1.5 } : item)),
      hierarchy: category("突出核心主张和关键数字", baseHierarchy(44, 20, 12)),
      spacing: category("压缩空间但保留清楚分组", baseSpacing(12, 24)),
      components: category("调整指标、行动块和信息容器", baseComponents()),
      color: category("用少量强调色强化重点", baseColors()),
    },
  },
  resume: {
    label: "简历",
    prompt: "帮我做一份简历",
    description: "快速扫读、经历层级与信息密度",
    defaultCategory: "page",
    categories: {
      page: category("确定简历结构与页面容量", [
        select("pageFormat", "纸张尺寸", "根据投递地区选择 A4 或 Letter。", "a4", formatOptions),
        number("pageMargin", "页面边距", "平衡经历容量和打印留白。", 28, 18, 52, 2),
        select("resumeLayout", "简历布局", "单栏强调经历，双栏容纳辅助信息。", "two", [
          { value: "single", label: "单栏" }, { value: "two", label: "双栏" },
        ]),
        number("sidebarWidth", "侧栏比例", "控制辅助信息占据的页面宽度。", 32, 24, 42, 2, "%"),
        toggle("showPhoto", "个人照片", "比较有无照片时顶部信息结构。", false),
      ]),
      typography: category("保证高密度内容仍可快速扫读", baseTypography().map((item) => item.id === "bodySize" ? { ...item, default: 13 } : item.id === "lineHeight" ? { ...item, default: 1.45 } : item)),
      hierarchy: category("组织姓名、职位、经历和元数据", baseHierarchy(36, 19, 18)),
      spacing: category("控制经历条目和模块之间的密度", baseSpacing(8, 22)),
      components: category("调整技能标签、经历分隔和侧栏容器", baseComponents()),
      color: category("保持专业对比并控制强调色面积", baseColors()),
    },
  },
  letter: {
    label: "正式信件",
    prompt: "帮我写一封正式信件",
    description: "正式语气、信息位置与充足留白",
    defaultCategory: "page",
    categories: {
      page: category("组织信头、日期、正文和签名位置", [
        select("pageFormat", "纸张尺寸", "根据收件地区选择 A4 或 Letter。", "a4", formatOptions),
        number("pageMargin", "页面边距", "正式信件通常需要更充足的留白。", 52, 32, 76, 4),
        select("dateAlign", "日期位置", "控制信件开头的信息秩序。", "right", [
          { value: "left", label: "左对齐" }, { value: "right", label: "右对齐" },
        ]),
        toggle("letterhead", "正式信头", "显示发件人名称和联系信息。", true),
        number("signatureGap", "签名留白", "为手写或电子签名保留空间。", 44, 20, 80, 4),
      ]),
      typography: category("建立正式、稳定且易读的正文", baseTypography().map((item) => item.id === "lineHeight" ? { ...item, default: 1.7 } : item)),
      hierarchy: category("控制主题、称呼和正文的层级", baseHierarchy(32, 20, 20)),
      spacing: category("调整地址、正文段落和签名节奏", baseSpacing(18, 32)),
      components: category("调整主题区、联系信息和签名结构", baseComponents()),
      color: category("保持克制、正式的文字和纸张关系", baseColors()),
    },
  },
};

export function allParameters(config) {
  return CATEGORY_ORDER.flatMap((categoryId) => config.categories[categoryId].parameters);
}

export function findParameter(config, parameterId) {
  return allParameters(config).find((parameter) => parameter.id === parameterId);
}

export function optionLabel(parameter, value) {
  return parameter.options?.find((option) => option.value === String(value))?.label ?? String(value);
}
