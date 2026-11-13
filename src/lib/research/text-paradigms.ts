import type { TopicParts } from "./types";

/** 文本分析的专业范式。题目由范式决定句式，类目写进分析框架。 */
export type TextParadigm = {
  id: string;
  label: string;
  /** 写进「视角下」的理论名。空字符串表示理论名已经嵌在句式里。 */
  lens: string;
  /** 用来从题目里认出这一范式的短语。 */
  mark: string;
  cite: string;
  unit: string;
  cats: string[];
  work: string;
  make: (parts: TopicParts) => string;
};

function lensOf(parts: TopicParts, fallback: string) {
  return parts.iv.trim() || fallback;
}

export const TEXT_PARADIGMS: TextParadigm[] = [
  {
    id: "skopos",
    label: "目的论（Vermeer）",
    lens: "目的论",
    mark: "目的论",
    cite: "Vermeer, H. J. (1989). Skopos and commission in translational action. In A. Chesterman (Ed.), Readings in translation theory (pp. 173–187). Helsinki: Oy Finn Lectura.",
    unit: "一个文化负载词及其对应译文",
    cats: ["直译", "意译", "增译", "减译", "换译"],
    work: "先写明译文要让谁、在什么场合看懂，再按直译、意译、增译、减译、换译归类，并用这个目的解释每种译法。",
    make: (parts) => `${lensOf(parts, "目的论")}视角下${parts.object}中${parts.dv}的研究`,
  },
  {
    id: "venuti",
    label: "归化与异化（Venuti）",
    lens: "",
    mark: "归化与异化",
    cite: "Venuti, L. (1995). The translator's invisibility: A history of translation. London: Routledge.",
    unit: "一个文化负载表达及其对应译文",
    cats: ["归化", "异化"],
    work: "看译者是换成读者熟悉的说法，还是保留原文的文化形式，并各举能回到原文位置的例子。",
    make: (parts) => `${parts.object}中${parts.dv}的归化与异化`,
  },
  {
    id: "eco",
    label: "生态翻译学（胡庚申）",
    lens: "生态翻译学",
    mark: "生态翻译学",
    cite: "胡庚申 (2013). 生态翻译学：建构与诠释. 北京：商务印书馆.",
    unit: "一个语言项在语言维、文化维、交际维上的转换",
    cats: ["语言维", "文化维", "交际维"],
    work: "把现象放到语言维、文化维、交际维里看译者做了哪一种适应选择，三维都要有条目，不能只写其中一维。",
    make: (parts) => `${lensOf(parts, "生态翻译学")}视角下${parts.object}中${parts.dv}的适应选择`,
  },
  {
    id: "cda",
    label: "批评话语分析（Fairclough）",
    lens: "批评话语分析",
    mark: "批评话语分析",
    cite: "Fairclough, N. (1992). Discourse and social change. Cambridge: Polity Press.",
    unit: "一段能独立阅读的表述",
    cats: ["文本", "话语实践", "社会实践"],
    work: "先描写措辞和句式，再看这些表述如何被生产和传播，最后说明它维持或挑战了什么社会关系。",
    make: (parts) => `${lensOf(parts, "批评话语分析")}视角下${parts.object}中的${parts.dv}`,
  },
  {
    id: "frame",
    label: "框架分析（Entman）",
    lens: "",
    mark: "框架分析",
    cite: "Entman, R. M. (1993). Framing: Toward clarification of a fractured paradigm. Journal of Communication, 43(4), 51–58.",
    unit: "一条报道或一个意义单元",
    cats: ["问题定义", "因果归因", "道德评价", "处理对策"],
    work: "按问题定义、因果归因、道德评价、处理对策四项编码，看文本把什么说成问题、把原因归于谁、提出什么办法。",
    make: (parts) => `${parts.object}中${parts.dv}的框架分析`,
  },
  {
    id: "narrative",
    label: "叙事分析（Genette）",
    lens: "",
    mark: "叙事分析",
    cite: "Genette, G. (1980). Narrative discourse: An essay in method (J. E. Lewin, Trans.). Ithaca, NY: Cornell University Press.",
    unit: "一个叙事片段",
    cats: ["叙事者", "时间", "焦点", "情节"],
    work: "从叙事者、时间、焦点和情节四项读这份文本，说明现象是被谁、按什么顺序讲出来的。",
    make: (parts) => `${parts.object}的叙事分析：以${parts.dv}为线索`,
  },
  {
    id: "multimodal",
    label: "多模态话语分析（Kress & van Leeuwen）",
    lens: "多模态话语分析",
    mark: "多模态话语分析",
    cite: "Kress, G., & van Leeuwen, T. (2006). Reading images: The grammar of visual design (2nd ed.). London: Routledge.",
    unit: "一个镜头、一幅图或一处图文组合",
    cats: ["图像", "语言", "声音", "版式"],
    work: "把图像、语言、声音和版式分开登记，再说明它们怎样一起表达这个现象。只分析了字幕、没有看画面，就不要称多模态。",
    make: (parts) => `${lensOf(parts, "多模态话语分析")}视角下${parts.object}中的${parts.dv}`,
  },
  {
    id: "intertext",
    label: "互文性（Kristeva）",
    lens: "",
    mark: "互文性",
    cite: "Kristeva, J. (1980). Desire in language: A semiotic approach to literature and art. New York: Columbia University Press.",
    unit: "一处能指出来源的表述",
    cats: ["直接引用", "间接化用", "体裁套用", "典故"],
    work: "找出文本借用了哪些已有表述，分成直接引用、间接化用、体裁套用和典故，并写明能核对的来源。对不上来源的不要算互文。",
    make: (parts) => `${parts.object}中${parts.dv}的互文性分析`,
  },
  {
    id: "corpus",
    label: "语料库分析（McEnery & Hardie）",
    lens: "",
    mark: "语料库",
    cite: "McEnery, T., & Hardie, A. (2012). Corpus linguistics: Method, theory and practice. Cambridge: Cambridge University Press.",
    unit: "一个检索词及其搭配行",
    cats: ["词频", "搭配", "类连接", "语义倾向"],
    work: "先划定语料范围和检索词，再报告词频、搭配、类连接和语义倾向。频数只描述这份语料，不推断到语料之外的人群。",
    make: (parts) => `基于语料库的${parts.object}${parts.dv}研究`,
  },
  {
    id: "content",
    label: "内容分析（Krippendorff）",
    lens: "",
    mark: "内容分析",
    cite: "Krippendorff, K. (2019). Content analysis: An introduction to its methodology (4th ed.). Thousand Oaks, CA: SAGE.",
    unit: "一个按编码说明能判断归属的意义单元",
    cats: ["主题", "行动者", "评价", "诉求"],
    work: "先写类目和判定规则，再由两人独立编码并报告 Cohen's κ。下面四类只是起点，须按现象改写。计数只描述这份文本。",
    make: (parts) => `${parts.object}中${parts.dv}的内容分析`,
  },
  {
    id: "close",
    label: "文本细读（Brooks）",
    lens: "",
    mark: "文本细读",
    cite: "Brooks, C. (1947). The well wrought urn: Studies in the structure of poetry. New York: Harcourt, Brace.",
    unit: "一个词、一句或一个反复出现的意象",
    cats: ["词句", "意象", "结构", "语气"],
    work: "贴着词句、意象、结构和语气读，每个判断都要能指回原文位置。不把文本当成一群人的调查结果。",
    make: (parts) => `${parts.object}中${parts.dv}的文本细读`,
  },
  {
    id: "semiotic",
    label: "符号学（Barthes）",
    lens: "符号学",
    mark: "符号学",
    cite: "Barthes, R. (1977). Image, music, text (S. Heath, Trans.). London: Fontana.",
    unit: "一个符号",
    cats: ["能指", "所指", "内涵", "神话"],
    work: "先分开能指和所指，再写这个符号在文本里带上的内涵，以及它把哪种说法讲成了自然而然的事。",
    make: (parts) => `${lensOf(parts, "符号学")}视角下${parts.object}中的${parts.dv}`,
  },
];

const FAMILIES: { test: RegExp; ids: [string, string, string] }[] = [
  { test: /翻译|字幕|目的论|归化|异化|文化负载|译本|译语/, ids: ["skopos", "venuti", "eco"] },
  { test: /语料库|语料/, ids: ["corpus", "content", "cda"] },
  { test: /新闻|报道|舆情|媒体|框架/, ids: ["frame", "cda", "content"] },
  { test: /话语|意识形态|权力/, ids: ["cda", "intertext", "frame"] },
  { test: /叙事|小说|故事|回忆/, ids: ["narrative", "close", "intertext"] },
  { test: /电影|影像|镜头|广告|绘本|海报|多模态/, ids: ["multimodal", "semiotic", "close"] },
  { test: /政策|公文|法规|条例|政府工作报告/, ids: ["cda", "content", "frame"] },
];

const DEFAULT_IDS: [string, string, string] = ["close", "content", "cda"];

export function textParadigm(id: string) {
  return TEXT_PARADIGMS.find((item) => item.id === id) ?? TEXT_PARADIGMS[0]!;
}

/** 按文本材料挑三个彼此不同的范式；variant 用来换一批时轮换顺序。 */
export function textPatternIds(blob: string, variant = 0) {
  const family = FAMILIES.find((item) => item.test.test(blob))?.ids ?? DEFAULT_IDS;
  const shift = ((variant % family.length) + family.length) % family.length;
  return [...family.slice(shift), ...family.slice(0, shift)];
}

export function matchTextPattern(title: string) {
  const hits = TEXT_PARADIGMS.filter((item) => (item.lens && title.includes(item.lens)) || (item.mark && title.includes(item.mark)));
  hits.sort((a, b) => Math.max(b.lens.length, b.mark.length) - Math.max(a.lens.length, a.mark.length));
  return hits[0]?.id ?? "close";
}
