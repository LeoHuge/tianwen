import { constructSummary } from "./instrument";
import type { SampleResult } from "./sample-size";
import { subjectSentence } from "./subject";
import { textParadigm } from "./text-paradigms";
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
  const who = subjectSentence(project.subjectParts, false, topic.paradigm) || project.subject || "【待写明研究对象】";
  const measures = constructSummary(project.instrumentDoc);
  const qualitative = topic.paradigm === "定性";
  const textual = topic.paradigm === "文本分析";
  const meta = topic.paradigm === "元分析";
  const sampleLine = sample ? sample.sentence : textual ? "文本范围见分析框架。" : meta ? "检索式和纳入标准见摘录表。" : "样本量见计算书。";
  const guide = textual ? textParadigm(topic.pattern) : null;
  const lens = topic.parts.iv || guide?.lens || guide?.mark || "所选范式";
  const phenomenon = topic.parts.dv || "【待补】";
  const hits = project.hotHits.filter((hit) => hit.name).slice(0, 4);
  const literature = hits.length
    ? `${hits
        .map((hit) => {
          const bits = [hit.theme && `主题是${hit.theme}`, hit.method && `做法是${hit.method}`, hit.variables && `涉及${hit.variables}`, hit.population && `写到的对象是${hit.population}`].filter(Boolean);
          return `「${hit.name}」${bits.length ? bits.join("，") : "页面上没有更细的做法说明"}`;
        })
        .join("。")}。这些条目还没有落到${textual ? "这一份文本上" : "你写的这组对象上"}。条目里没有的作者、年份和期刊不要补。`
    : "本轮没有可核对的检索条目。综述按论点写，不分成国内、国外两栏。先到知网、CSSCI 来源期刊和 Web of Science，用题目里的现象和对象检索，每条补上出处后再写入正文。【待核验】";
  const intro = textual
    ? `先写${topic.parts.object || who}里能够指认的一处文本现象，再说明已有读法还没有用${lens}处理其中的${phenomenon}。研究问题是：${topic.question}引言不展开文献，也不用「随着……的发展」起笔。`
    : meta
      ? `先写已经发表的研究怎样报告${topic.parts.iv || "这一条件"}和${topic.parts.dv || "这一结果"}。研究问题是：${topic.question}合并效应在摘录完成之后写入。引言不展开文献，也不用「随着……的发展」起笔。`
      : `先写${project.subjectParts.where || "研究场所"}里能够指认的处境，再说明已有研究还没有在${who}上看${topic.parts.iv || "这个条件"}和${topic.parts.dv || "这个现象"}。研究问题是：${topic.question}${qualitative ? "这里要理解的是过程。" : "横截面调查只准备说明关联，不写成因果。"}引言不展开文献，也不用「随着……的发展」起笔。`;
  const results = textual
    ? "编码完成前，这里留出待填位置：每一类多少条，以及各举哪一处能回到原文的例子。条数和例句在编码完成之后写入。"
    : meta
      ? "摘录完成前，这里留出待填位置：纳入多少项研究，效应量的方向是否一致。合并效应、异质性和 p 值在摘录完成之后写入。"
      : qualitative
        ? "访谈完成前，这里留出待填位置：主题名称，以及该主题来自哪一类情境。受访者原话在访谈完成之后写入。"
        : "数据核算前，这里留出待填位置：样本构成、预先规定的检验、方向和幅度。系数和 p 值在数据核算之后写入。";
  const conclusion = textual
    ? `结论只回答引言里的问题，而且必须限制在${topic.parts.object || "这一份文本"}已经归类的范围。一份文本的结论写在这份文本之内。局限集中写版本、未纳入部分和类目边界。结果填入之后，再写回答。`
    : meta
      ? "结论只回答已发表研究里这一关系是否同方向，而且必须限制在纳入的研究之内。综合范围以已经摘录的研究为准。结果填入之后，再写回答。"
      : `结论只回答引言里的问题，范围停在${who}。${qualitative ? "访谈主题写成这一研究中的过程。" : "横截面调查说明的是关联。"}${project.subjectParts.where || "一个场所"}的结论写在这一场所之内。局限集中写对象、设计和没有测到的内容。结果填入之后，再写回答。`;
  return {
    title: topic.title,
    abstract: textual
      ? `本文以${topic.parts.object || who}为材料，用${lens}分析其中的${phenomenon}。先划定文本范围，再按类目归类。${sampleLine}归类结果在编码完成之后写入。`
      : meta
        ? `本文综合已发表研究中${topic.parts.iv || keywords[0] || "【待补】"}与${topic.parts.dv || keywords[1] || "【待补】"}的关系${topic.parts.mechanism ? `，并看${topic.parts.mechanism}是否改变这一关系` : ""}。${sampleLine}合并效应在摘录完成之后写入摘要。`
        : `本文以${who}为研究对象，${qualitative ? "通过半结构访谈" : "通过问卷调查"}考察${topic.parts.iv || keywords[0] || "【待补】"}与${
            topic.parts.dv || keywords[1] || "【待补】"
          }之间的${qualitative ? "关联与过程" : "关系"}${topic.parts.mechanism ? `，并分析${topic.parts.mechanism}的作用` : ""}。${sampleLine}数字在核算完成之后写入摘要。`,
    keywords,
    sections: [
      { heading: "引言与背景", body: intro },
      { heading: "文献综述", body: literature },
      {
        heading: textual ? "文本与视角" : meta ? "检索与纳入" : "研究设计",
        body: textual
          ? `材料是${topic.parts.object || who}。理论视角是${lens}。先写明版本、纳入和不纳入的部分，再抽取${phenomenon}。分析按类目归类。类目在看材料之前确定，看完之后可以合并，不再临时增加刚好能得出预定结论的类目。`
          : meta
            ? `先写数据库、检索式、检索日期和纳入标准。纳入的研究必须报告效应量和样本量。未报告效应量的评论不纳入。`
            : qualitative
            ? `采用半结构访谈。受访者为${who}，按目的抽样并在关键特征上拉开差异。访谈提纲先写开场，再按「${topic.parts.iv || "情境"}」「${topic.parts.dv || "现象"}」及二者关联分模块提问，每条主问题配追问。主题在材料里归纳，不预先写成要证明的命题。`
            : `采用自编问卷的横截面调查。调查对象为${who}，问卷先用筛选题确认对象资格，再测量基本信息和核心变量。先做描述，再按预先写好的问题分析。横截面数据只说明关联，不作确定的因果推断。`,
      },
      {
        heading: textual ? "类目与编码" : meta ? "摘录" : "测量与样本",
        body: textual
          ? `${measures ? `类目：${measures}。` : ""}${sampleLine}每一条摘录只归入一个主类目，并写明判定规则。`
          : meta
            ? `${sampleLine}每一项研究抄录作者年份、效应量、标准误或可换算的统计量、样本量，以及变量测法。摘录栏在抄录之后填写。`
            : `${measures ? `测量：${measures}。` : ""}${sampleLine}抽样方式须写明。代表性取决于抽样方式。`,
      },
      { heading: "结果分析", body: results },
      { heading: "结论", body: conclusion },
    ],
    source: "rules",
    warnings: ["文献出处和结果数字请在核对后写入。"],
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
