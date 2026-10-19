import { constructSummary } from "./instrument";
import type { SampleResult } from "./sample-size";
import { subjectSentence } from "./subject";
import type { Manuscript, Project } from "./types";

const VAGUE = ["社会", "影响", "研究", "分析", "问题", "发展", "现状", "对策", "意义", "关系", "因素", "作用", "情况", "调查", "浅析", "探析", "视角", "路径", "机制", "创新"];

export function vagueKeywords(keywords: string[]) {
  return keywords.map((word) => word.trim()).filter((word) => VAGUE.includes(word));
}

/** 规则底稿：按已定的题目、问卷和样本量计算书整理，不调用模型，文献和结果都留空。 */
export function buildManuscript(project: Project, sample: SampleResult | null): Manuscript | null {
  const topic = project.topic;
  if (!topic) return null;
  const keywords = project.keywords.map((word) => word.trim()).filter(Boolean);
  const who = subjectSentence(project.subjectParts, false) || project.subject || "【待写明研究对象】";
  const measures = constructSummary(project.instrumentDoc);
  const qualitative = topic.paradigm === "定性";
  const sampleLine = sample ? sample.sentence : "样本量见计算书。";
  return {
    title: topic.title,
    abstract: `本文以${who}为研究对象，${qualitative ? "通过半结构访谈" : "通过问卷调查"}考察${topic.parts.iv || keywords[0] || "【待补】"}与${
      topic.parts.dv || keywords[1] || "【待补】"
    }之间的${qualitative ? "关联与过程" : "关系"}${topic.parts.mechanism ? `，并分析${topic.parts.mechanism}的作用` : ""}。${sampleLine}摘要中的结果在研究者运算之前不写数字。`,
    keywords,
    sections: [
      {
        heading: "问题提出",
        body: `${topic.question}本节先写现象：在${project.subjectParts.where || "研究场所"}里观察到了什么；再写理论问题：已有研究对此怎么解释、还缺什么。文献须研究者自行在知网、CSSCI 来源期刊或 Web of Science 检索后补入，每条注明出处。【待核验】`,
      },
      {
        heading: "研究设计",
        body: qualitative
          ? `采用半结构访谈。受访者为${who}，按目的抽样并在关键特征上拉开差异。访谈提纲先写开场，再按「${topic.parts.iv || "情境"}」「${topic.parts.dv || "现象"}」及二者关联分模块提问，每条主问题配追问。`
          : `采用自编问卷的横截面调查。调查对象为${who}，问卷先用筛选题确认对象资格，再测量基本信息和核心变量。横截面数据只说明关联，不作确定的因果推断。`,
      },
      {
        heading: "测量与样本",
        body: `${measures ? `测量：${measures}。` : ""}${sampleLine}抽样方式须研究者写明，人数够了不等于样本有代表性。`,
      },
      {
        heading: "分析计划",
        body: (project.instrumentDoc?.analysis ?? []).join("") || "先做描述，再按预先写好的问题分析，不根据结果改写假设。",
      },
      {
        heading: "结果（待填）",
        body: "待数据回收后，只填入研究者用统计软件或编码自行得出的结果。规则底稿不提供系数、p 值或访谈原话。",
      },
      {
        heading: "讨论与局限",
        body: `讨论只解释实际测量到的范围。${project.subjectParts.where || "一个场所"}的样本不能写成全国结论。人工智能辅助了结构，不能代替研究者对事实的责任。`,
      },
    ],
    source: "rules",
    warnings: ["这是规则底稿，没有调用模型润色。", "文献与结果都还空着，是故意的。"],
  };
}

export function manuscriptMarkdown(input: {
  title: string;
  abstract: string;
  keywords: string[];
  sections: { heading: string; body: string }[];
  disclosure: string;
}) {
  const parts = [
    `# ${input.title}`,
    "",
    `**摘要** ${input.abstract}`,
    "",
    `**关键词** ${input.keywords.join("；")}`,
    "",
    ...input.sections.flatMap((section) => [`## ${section.heading}`, "", section.body, ""]),
    "## 使用声明",
    "",
    input.disclosure,
    "",
  ];
  return parts.join("\n");
}
