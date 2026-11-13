import { createServerFn } from "@tanstack/react-start";
import { normalizeIndexes } from "./indexes";
import { looseJson } from "./json-loose";
import { chatJson, reason, webSearch, xaiBase } from "./llm";
import { readXaiApiKey } from "./xai-key.server";
import { modelById } from "./models";
import { subjectSentence } from "./subject";
import { BANNED, inferParts, rulesCandidates, type TopicSeed } from "./topic-parts";
import { matchTextPattern, TEXT_PARADIGMS } from "./text-paradigms";
import type { Candidate, HotHit, Paradigm, SubjectParts, TopicAlt, TopicParts } from "./types";

const SOURCES = ["论文", "国社科", "国自然"] as const;
const LEVELS = ["重大", "重点", "一般", "青年", "面上", "西部"];

export const searchHot = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { keywords?: unknown; subject?: unknown };
    const keywords = Array.isArray(data?.keywords) ? data.keywords.map((word) => String(word).trim()).slice(0, 4) : [];
    if (keywords.length < 4 || keywords.some((word) => word.length < 2)) throw new Error("四个关键词都需要写满。");
    return { keywords, subject: String(data?.subject ?? "").slice(0, 120) };
  })
  .handler(async ({ data }) => {
    const apiKey = readXaiApiKey();
    if (!apiKey) return { ok: false as const, error: "检索尚未开始。" };
    try {
      const model = process.env.XAI_SEARCH_MODEL?.trim() || "grok-4.5";
      let papers: HotHit[] = [];
      try {
        const result = await webSearch({ apiKey, model, prompt: searchPrompt(data.keywords, data.subject), deadline: Date.now() + 120_000 });
        papers = normalizeHits(result.text, result.links).filter((hit) => hit.source === "论文");
      } catch {
        papers = [];
      }
      let grants: HotHit[] = [];
      try {
        const result = await webSearch({
          apiKey,
          model,
          prompt: grantPrompt(data.keywords),
          domains: ["fz.people.com.cn", "kd.nsfc.cn", "nopss.gov.cn"],
          deadline: Date.now() + 110_000,
        });
        grants = normalizeHits(result.text, result.links).filter((hit) => hit.source !== "论文");
      } catch {
        grants = [];
      }
      const hits = mergeHits(papers, grants);
      if (!hits.length) return { ok: false as const, error: "检索没有返回可核对的条目。" };
      const note = grants.length ? "" : "立项信息本轮未返回，论文条目仍可核对。";
      return { ok: true as const, hits, note };
    } catch (error) {
      return { ok: false as const, error: reason(error).replace(/。$/, "") + "。" };
    }
  });

function searchPrompt(keywords: string[], subject: string) {
  return [
    "请实际打开网页检索，不要靠记忆。时间范围是 2021 年到 2026 年。",
    `关键词：${keywords.join("、")}`,
    subject ? `研究对象：${subject}（用来判断相关性，不必逐字匹配）` : "",
    "相关的都写上，不要只留最先看到的两三条，也不要用只沾一个词的文献凑数。这一步只找论文，课题不要写。分两块：",
    "1. 中文论文：打开知网、万方或维普的结果页，写和这些词、这个研究对象相关的期刊论文。name 写论文题目，journal 写期刊名，year 写发表年份。最多 8 条。",
    "   indexes 写这本期刊的收录情况，只能从下面这些值里选，可以多选：",
    '   "CSSCI"（仅 CSSCI（2025-2026）来源期刊）、"CSSCI扩展"（仅 CSSCI（2025-2026）扩展版来源期刊，必须和来源期刊分开写）、"北核"（仅《中文核心期刊要目总览》2023年版）、',
    '   "AMI顶级"、"AMI权威"、"AMI核心"、"AMI扩展"、"AMI入库"（仅 AMI 综合评价报告（2022）的对应等级；2026 版尚未发布，不要写成 2026）、"CSCD核心"、"CSCD扩展"（仅中国科学引文数据库 2025-2026 年度核心库或扩展库）。',
    "   不要用 CSSCI（2023-2024）、北大核心 2020 年版、AMI（2018）、CSCD（2023-2024）给现行收录贴标签。AMI 和 CSCD 要写出级别或库别；页面和期刊官网上都看不到就留空数组，不要猜。",
    "2. 外文论文：同一批关键词里和研究对象相关的英文期刊论文，打开 Web of Science、期刊官网或出版商页面。source 仍写「论文」。题目和期刊名保留英文，不要翻译。最多 6 条。",
    '   indexes 只能写 "SSCI"、"SCIE"、"SCI"、"ESCI"、"EI"。页面写 SSCI 就写 SSCI；写 SCIE 或 Science Citation Index Expanded 就写 SCIE；只有 SCI、没有 SCIE 才写 SCI；写 ESCI 或 Emerging Sources Citation Index 就写 ESCI；写 EI、Compendex 或 Engineering Index 的期刊收录才写 EI。',
    "   SSCI、SCIE、SCI、ESCI、EI 彼此不要改写。EI 会议不要写成 EI。AMI 要写出顶级、权威、核心、扩展或入库，扩展期刊不要写成核心。页面上看不到收录就留空数组，不要猜。",
    "   中文和外文论文都填 cites：被引次数；页面上只有下载次数就填下载次数，并把 metric 写成「下载」；都没有填 0。",
    "每一条都读过再写，不要只抄标题。theme 写研究主题，method 写方法（如问卷调查、访谈、案例、实验），variables 写用到的变量或分析维度，population 写研究对象。都用短语，页面上看不到就留空，不要猜。",
    "basis 用一句话说在哪个页面看到。不要写作者、主持人、课题编号、DOI。",
    "link 必须是你这次打开过的 http 或 https 页面，而且页面上能看到这条的题目或项目名称。登录墙、只写「请登录」的页面不要当链接。某一类打开了但没有相关结果，就空着，不要补。",
    "只输出 JSON，不要 Markdown：",
    '{"hits":[{"name":"","source":"论文或国社科或国自然","journal":"","year":"","indexes":[],"cites":0,"metric":"被引","level":"","theme":"","method":"","variables":"","population":"","basis":"","link":""}]}',
  ]
    .filter(Boolean)
    .join("\n");
}

function grantPrompt(keywords: string[]) {
  return [
    "只查立项，不要写论文。时间范围是 2021 年到 2026 年。",
    `关键词：${keywords.join("、")}`,
    "先逐页打开国家社科基金项目数据库。页面是表格，列有项目名称、项目类别、立项时间。表格里和这些词相关的项目都要写入，不要整页跳过。source 写「国社科」。name 只写项目名称。level 只写重大、重点、一般、青年、西部之一。四页合计最多 8 条。",
    ...keywords.map((word) => `https://fz.people.com.cn/skygb/sk/index.php/Index/seach?xmname=${encodeURIComponent(word)}&p=1`),
    "再打开国家自然科学基金的结题检索。source 写「国自然」。level 只写重大、重点、面上、青年之一。最多 4 条。",
    ...keywords.map((word) => `https://kd.nsfc.cn/finalSearchList?s=${encodeURIComponent(word)}`),
    "theme 用项目名称里的研究问题，写成短语。method 留空。variables 写项目名称里的核心概念。population 写项目名称里的人群，没有就留空。不要写负责人、批准号。",
    "link 用你打开的结果页。只输出 JSON，不要 Markdown：",
    '{"hits":[{"name":"","source":"国社科或国自然","year":"","level":"","theme":"","variables":"","population":"","basis":"","link":""}]}',
  ].join("\n");
}

function mergeHits(papers: HotHit[], grants: HotHit[]) {
  const names = new Set<string>();
  const hits: HotHit[] = [];
  for (const hit of [...papers, ...grants]) {
    const key = hit.name.replace(/\s+/g, "");
    if (names.has(key)) continue;
    names.add(key);
    hits.push({ ...hit, id: `h${hits.length + 1}` });
    if (hits.length >= 26) break;
  }
  return hits;
}

export function normalizeHits(text: string, seen: string[]): HotHit[] {
  const parsed = looseJson(text) as { hits?: unknown; papers?: unknown; projects?: unknown } | unknown[] | null;
  const rows: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object"
      ? [
          ...(Array.isArray((parsed as { hits?: unknown }).hits) ? ((parsed as { hits: unknown[] }).hits) : []),
          ...(Array.isArray((parsed as { papers?: unknown }).papers) ? ((parsed as { papers: unknown[] }).papers) : []),
          ...(Array.isArray((parsed as { projects?: unknown }).projects) ? ((parsed as { projects: unknown[] }).projects) : []),
        ]
      : [];
  const allowed = new Set(seen.filter((link) => /^https?:\/\//.test(link)));
  const hits: HotHit[] = [];
  const names = new Set<string>();
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const sourceText = String(row.source ?? "").trim();
    const source =
      SOURCES.find((item) => item === sourceText) ??
      (/社科|社会科学/.test(sourceText) ? "国社科" : /自然|NSFC/i.test(sourceText) ? "国自然" : /论文|期刊|文章/.test(sourceText) ? "论文" : undefined);
    const name = clean(String(row.name ?? row.title ?? ""), 160);
    const basis = clean(String(row.basis ?? ""), 80);
    const link = String(row.link ?? row.url ?? "").trim();
    if (!source || name.length < 4 || names.has(name)) continue;
    if (/DOI|doi|主持人|课题编号/.test(name + basis)) continue;
    const levelText = String(row.level ?? "").trim();
    let safeLink = allowed.has(link) || /^https?:\/\/[^\s]+$/.test(link) ? link : "";
    if (!safeLink && source === "国社科") safeLink = `https://fz.people.com.cn/skygb/sk/index.php/Index/seach?xmname=${encodeURIComponent(name)}&p=1`;
    if (!safeLink && source === "国自然") safeLink = `https://kd.nsfc.cn/finalSearchList?s=${encodeURIComponent(name)}`;
    if (!safeLink) continue;
    const cites = Number(row.cites);
    const level = LEVELS.find((item) => levelText === item || levelText.includes(item)) ?? "";
    const metric = String(row.metric ?? "").includes("下载") ? "下载" : Number.isFinite(cites) && cites > 0 ? "被引" : "";
    names.add(name);
    hits.push({
      id: `h${hits.length + 1}`,
      name,
      source,
      window: "2021-2026",
      basis: basis || "检索页面",
      link: safeLink,
      cites: Number.isFinite(cites) && cites > 0 ? Math.round(cites) : 0,
      metric,
      level: source === "论文" ? "" : level,
      indexes: source === "论文" ? normalizeIndexes(row.indexes) : [],
      journal: source === "论文" ? clean(String(row.journal ?? ""), 80).replace(/[《》]/g, "") : "",
      year: /^(20[12]\d)/.exec(String(row.year ?? ""))?.[1] ?? "",
      theme: clean(String(row.theme ?? ""), 40),
      method: clean(String(row.method ?? ""), 24),
      variables: clean(String(row.variables ?? ""), 48),
      population: clean(String(row.population ?? ""), 32),
    });
    if (hits.length >= 26) break;
  }
  return hits;
}

function clean(text: string, max: number) {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

type TopicInput = {
  keywords: string[];
  subjectParts: SubjectParts;
  unit: string;
  category: string;
  branch: string;
  discipline: string;
  field: string;
  paradigm: Paradigm;
  hits: { name: string; source: string; basis: string; journal: string; indexes: string[]; level: string; theme: string; method: string; variables: string; population: string }[];
  modelId: string;
  avoid: string[];
};

function parseTopicInput(input: unknown): TopicInput {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const keywords = Array.isArray(data.keywords) ? data.keywords.map((word) => String(word).trim()).slice(0, 4) : [];
  if (keywords.length < 4 || keywords.some((word) => word.length < 2)) throw new Error("四个关键词都要写满。");
  const parts = (data.subjectParts && typeof data.subjectParts === "object" ? data.subjectParts : {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
  return {
    keywords,
    subjectParts: {
      where: text(parts.where, 40),
      who: text(parts.who, 24),
      stage: text(parts.stage, 30),
      condition: text(parts.condition, 40),
      time: text(parts.time, 30),
      exclude: text(parts.exclude, 40),
    },
    unit: text(data.unit, 20),
    category: text(data.category, 12),
    branch: text(data.branch, 24),
    discipline: text(data.discipline, 40),
    field: text(data.field, 24),
    paradigm: data.paradigm === "定性" || data.paradigm === "文本分析" || data.paradigm === "元分析" || data.paradigm === "定量" ? data.paradigm : "定量",
    hits: Array.isArray(data.hits)
      ? data.hits
          .map((item) => {
            const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
            return {
              name: text(row.name, 100),
              source: text(row.source, 8),
              basis: text(row.basis, 120),
              journal: text(row.journal, 40),
              indexes: Array.isArray(row.indexes) ? row.indexes.map((value) => String(value)).slice(0, 6) : [],
              level: text(row.level, 6),
              theme: text(row.theme, 40),
              method: text(row.method, 24),
              variables: text(row.variables, 48),
              population: text(row.population, 32),
            };
          })
          .filter((item) => item.name)
          .slice(0, 24)
      : [],
    modelId: text(data.modelId, 40) || "grok-4.7",
    avoid: Array.isArray(data.avoid) ? data.avoid.map((item) => text(item, 80)).filter(Boolean).slice(0, 9) : [],
  };
}

function topicMessages(data: TopicInput) {
  const s = data.subjectParts;
  const text = data.paradigm === "文本分析";
  const meta = data.paradigm === "元分析";
  const sentence = subjectSentence(s, false, data.paradigm);
  const tool = text ? "文本摘录和分类" : meta ? "元分析摘录表" : data.paradigm === "定量" ? "问卷调查" : "半结构访谈";
  const paradigms = TEXT_PARADIGMS.map((item) => item.label).join("、");
  return [
    {
      role: "system" as const,
      content: [
        "你是社科选题顾问，按研究问题的范式出题，不按口号出题。",
        "好的选题是一个待解决的 problem：先有现象问题，再上升为理论问题。切口要小，能据此写出研究计划。",
        "定量：写清自变量、因变量，以及中介或调节变量；横截面数据不要写成确定因果。定性：写清具体情境和要理解的过程。文本分析：写清理论视角、一份文本和要分析的现象，材料是文本，不是人和问卷。元分析：研究对象是一批已发表的实证研究，题目写成「X与Y关系的元分析」。不要写合并效应、I²、p 值或漏斗图结果。",
        "只能使用下面已经检索到的篇名、方法、变量、对象和主题，不要另编文献。不要编作者、年份、样本量和显著性。只输出 JSON。",
      ].join(""),
    },
    {
      role: "user" as const,
      content: [
        `关键词：${data.keywords.join("、")}`,
        text ? `文本：${sentence || "未写"}` : meta ? `纳入的研究：${sentence || "未写"}` : `研究对象：${sentence || "未写"}`,
        text ? `  · 文本名称：${s.where || "未写"}` : meta ? `  · 研究关系：${s.where || "未写"}` : `  · 在哪：${s.where || "未写"}`,
        text ? `  · 文本类型：${s.who || "未写"}` : meta ? `  · 纳入的研究：${s.who || "未写"}` : `  · 是谁：${s.who || "未写"}`,
        text ? `  · 版本/范围：${s.stage || "无"}` : meta ? `  · 检索范围：${s.stage || "无"}` : `  · 年龄/年级/身份：${s.stage || "无"}`,
        text ? `  · 纳入部分：${s.condition || "无"}` : meta ? `  · 必须摘录：${s.condition || "无"}` : `  · 状态/经历：${s.condition || "无"}`,
        `分析单位：${data.unit || "未写"}`,
        `学科：${[data.category, data.branch, data.discipline].filter(Boolean).join(" / ")}${data.field ? ` / ${data.field}` : ""}`,
        `范式：${data.paradigm}（材料靠研究者自己做${tool}，不用公开数据库代替）`,
        data.hits.length
          ? "下面是这次打开过的论文和立项。先通读，再出题。每条后面的主题、方法、变量、对象来自检索页面，没有写的就当不知道。"
          : "本轮检索没有返回可核对的条目，只按关键词和研究对象出题，basis 写「按关键词组合」，hitName 留空。",
        ...data.hits.map((hit, index) => {
          const reading = [
            hit.theme ? `主题 ${hit.theme}` : "",
            hit.method ? `方法 ${hit.method}` : "",
            hit.variables ? `变量 ${hit.variables}` : "",
            hit.population ? `对象 ${hit.population}` : "",
          ].filter(Boolean);
          return `${index + 1}. ${hit.name}（${hit.source}${hit.journal ? `·${hit.journal}` : ""}${hit.indexes.length ? `·${hit.indexes.join("/")}` : ""}${hit.level ? `·${hit.level}` : ""}）${reading.length ? reading.join("；") + "。" : ""}${hit.basis}`;
        }),
        data.avoid.length ? `不要和这些题目重复或只换一个词：${data.avoid.join("；")}` : "",
        "要求：",
        ...(meta
          ? [
              "1. 这是元分析。三个题都写成「X与Y关系的元分析」，可以换一对变量，不要写成问卷、访谈或单份文本细读。",
              "2. 不要写合并效应、置信区间、I²、p 值或漏斗图的结果。这些要等摘录表做完再算。",
              "3. title 主标题不超过 40 字。question 问已发表研究里这一关系是否同方向，不超过 160 字。",
              "4. parts：object 写「已发表研究」；iv、dv 是要综合的两个变量；mechanism 是可能改变关系的第三个变量，没有就空。这些词必须原样出现在 title 里。",
              "5. basis 只引用上面检索到的条目。没有条目就写「按关键词组合」，hitName 留空。",
            ]
          : text
          ? [
              "1. 这是文本分析。三个题必须使用三个不同的专业范式，从下面选择：" + paradigms + "。",
              "2. 不要写成问卷调查或访谈。不要写自变量、因变量、中介、调节，也不要写样本量。",
              "3. title 写成「理论视角 + 文本名称 + 现象」，例如：目的论视角下《青春变形记》电影字幕中文化负载词的研究。主标题不超过 40 字。文本名称用用户写的那一份。",
              "4. question 先点出检索到的文献处理过什么文本，再写这一题从这份文本里抽什么、按什么类目归类。不超过 160 字。",
              "5. basis 写用了哪个范式、参考了哪几条。hitName 原样抄最主要那一条的名称。",
              "6. parts：object 是文本名称；iv 是理论名（目的论、批评话语分析这类，句式里没有理论名就留空）；dv 是要分析的现象；mechanism 和 method 留空。这些词必须原样出现在 title 里。",
              "7. alt 的 iv 给另外两个理论名，dv 给另外两个现象说法。",
            ]
          : [
              "1. 先归纳这些文献已经覆盖的研究主题、常用方法、用过的变量、研究过的人群，以及立项已经资助过的问题。三个题要从这些已有工作里找缺口，再落到用户的研究对象上。",
              "2. 不要把四个关键词重新搭配成三句话。三题必须在选题、方法、变量、研究对象或研究主题上彼此错开，错开的依据要来自上面的文献，不能凭空换词。",
              "3. 每题的研究对象必须带上上面的限定词：至少写出人群，再带上地点或一个年龄/身份/状态限定（地点也可以放进副标题）。",
              "4. title 是期刊题目：主标题不超过 30 字，可以加「——基于……」副标题，总长不超过 50 字。不用「浅析、现状、对策、探析」。",
              "5. question 先写这些文献已经做了什么，再写这题要检验或理解的问题，不超过 120 字。",
              "6. basis 写参考了哪几条（序号和名称），以及缺口在选题、方法、变量、对象或主题的哪一处。hitName 原样抄最主要那一条的名称。",
              "7. parts 拆开题目要素：object 研究对象（题目里怎么写就怎么写）；iv 自变量（定性写情境或实践）；dv 因变量（定性写要理解的现象）；mechanism 中介或调节变量（没有就空字符串）；method 副标题里的数据来源（没有副标题就空字符串）。变量尽量沿用文献里出现过、但这组对象还没被检验的那一个。这些词必须原样出现在 title 里。",
              "8. alt 给用户改题用：object、iv、dv、mechanism 各给 2 个可以直接替换进题目的短语，优先从检索结果里的变量和对象来。",
            ]),
        '只返回 {"items":[{"title":"","question":"","basis":"","hitName":"","parts":{"object":"","iv":"","dv":"","mechanism":"","method":""},"alt":{"object":[],"iv":[],"dv":[],"mechanism":[]}}]}',
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

function strings(value: unknown, max: number, len: number) {
  return Array.isArray(value)
    ? value
        .map((item) => String(item ?? "").trim())
        .filter((item) => item && item.length <= len)
        .slice(0, max)
    : [];
}

function readCandidates(raw: unknown, data: TopicInput, seed: TopicSeed): Candidate[] {
  const record = (raw && typeof raw === "object" ? raw : {}) as { items?: unknown; topics?: unknown };
  const rows: unknown[] = Array.isArray(raw) ? raw : Array.isArray(record.items) ? record.items : Array.isArray(record.topics) ? record.topics : [];
  const names = new Set(data.hits.map((hit) => hit.name));
  const avoid = new Set(data.avoid);
  const items: Candidate[] = [];
  for (const entry of rows) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const title = String(row.title ?? "").trim().replace(/\s+/g, "").replace(/—{1,2}/, "——").slice(0, 64);
    const question = String(row.question ?? "").trim().slice(0, 160);
    if (title.length < 8 || question.length < 8 || BANNED.test(title) || avoid.has(title) || items.some((item) => item.title === title)) continue;
    const given = (row.parts && typeof row.parts === "object" ? row.parts : {}) as Record<string, unknown>;
    const inferred = inferParts(title, seed);
    const pick = (key: keyof TopicParts) => {
      const value = String(given[key] ?? "").trim().slice(0, 30);
      return value && title.includes(value) ? value : inferred[key];
    };
    const parts: TopicParts = { object: pick("object"), iv: pick("iv"), dv: pick("dv"), mechanism: pick("mechanism"), method: pick("method") };
    const altRaw = (row.alt && typeof row.alt === "object" ? row.alt : {}) as Record<string, unknown>;
    const alt: TopicAlt = {
      object: strings(altRaw.object, 3, 24),
      iv: strings(altRaw.iv, 3, 16),
      dv: strings(altRaw.dv, 3, 16),
      mechanism: strings(altRaw.mechanism, 3, 16),
    };
    const hitName = String(row.hitName ?? "").trim();
    const cited = `${question}${String(row.basis ?? "")}${hitName}`;
    const grounded = data.hits.length === 0 || data.hits.some((hit) => hit.name.length >= 4 && cited.includes(hit.name.slice(0, Math.min(8, hit.name.length))));
    if (!grounded) continue;
    items.push({
      title,
      question,
      basis: String(row.basis ?? "").trim().slice(0, 180) || "按关键词组合",
      hitName: names.has(hitName) ? hitName : "",
      paradigm: data.paradigm,
      parts,
      alt,
      pattern: data.paradigm === "文本分析" ? matchTextPattern(title) : data.paradigm === "元分析" ? "meta" : "keep",
      source: "model",
    });
    if (items.length >= 3) break;
  }
  return items;
}

export const generateTopics = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseTopicInput(input))
  .handler(async ({ data }) => {
    const seed: TopicSeed = {
      keywords: data.keywords,
      subject: data.subjectParts,
      unit: data.unit,
      discipline: data.discipline,
      field: data.field,
      paradigm: data.paradigm,
      hits: data.hits,
    };
    const rules: Candidate[] = [];
    for (let variant = 0; variant < 4 && rules.length < 3; variant += 1) {
      for (const item of rulesCandidates(seed, variant)) {
        if (!data.avoid.includes(item.title) && !rules.some((rule) => rule.title === item.title)) rules.push(item);
      }
    }
    const deadline = Date.now() + 110_000;
    const messages = topicMessages(data);
    const option = modelById(data.modelId);
    const routes: { apiKey: string; endpoint: string; models: string[] }[] = [];
    const notes: string[] = [];
    if (option.route === "relay") {
      const relayKey = process.env.MODEL_RELAY_KEY;
      const relayBase = process.env.MODEL_RELAY_BASE;
      if (relayKey && relayBase) routes.push({ apiKey: relayKey, endpoint: `${relayBase.replace(/\/$/, "")}/chat/completions`, models: [option.model] });
      else notes.push("已改用默认模型继续出题。");
    }
    const xaiKey = readXaiApiKey();
    if (xaiKey) {
      const chosen = process.env.XAI_MODEL?.trim() || (option.route === "xai" ? option.model : "") || "grok-4.5";
      routes.push({ apiKey: xaiKey, endpoint: `${xaiBase()}/chat/completions`, models: [chosen] });
    }
    let fromModel: Candidate[] = [];
    for (const route of routes) {
      if (Date.now() > deadline - 10_000) break;
      try {
        const { data: raw } = await chatJson({
          ...route,
          messages,
          maxTokens: 8000,
          temperature: 0.5,
          deadline,
          attemptMs: 75_000,
          validate: (value) => readCandidates(value, data, seed).length > 0,
        });
        fromModel = readCandidates(raw, data, seed);
        if (fromModel.length) break;
      } catch {
        // 这一路没有返回题目时，继续下一路。
      }
    }
    const items = [...fromModel];
    for (const rule of rules) {
      if (items.length >= 3) break;
      if (!items.some((item) => item.title === rule.title)) items.push(rule);
    }
    if (fromModel.length === 0) notes.push("题目已按当前材料整理，可以再生成一批。");
    else if (fromModel.length < 3) notes.push("三个题目已整理完成。");
    return { ok: true as const, items: items.slice(0, 3), note: notes.join(""), modelCount: fromModel.length };
  });
