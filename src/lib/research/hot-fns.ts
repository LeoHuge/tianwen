import { createServerFn } from "@tanstack/react-start";
import { normalizeIndexes } from "./indexes";
import { looseJson } from "./json-loose";
import { CHAT_PREFERENCE, chatJson, modelChain, reason, SEARCH_PREFERENCE, webSearch, xaiBase } from "./llm";
import { modelById } from "./models";
import { subjectSentence } from "./subject";
import { BANNED, inferParts, rulesCandidates, type TopicSeed } from "./topic-parts";
import type { Candidate, HotHit, Paradigm, SubjectParts, TopicAlt, TopicParts } from "./types";

const SOURCES = ["论文", "国社科", "国自然"] as const;
const LEVELS = ["重大", "重点", "一般", "青年", "面上", "西部"];

export const searchHot = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { keywords?: unknown; subject?: unknown };
    const keywords = Array.isArray(data?.keywords) ? data.keywords.map((word) => String(word).trim()).slice(0, 4) : [];
    if (keywords.length < 4 || keywords.some((word) => word.length < 2)) throw new Error("四个关键词都要写满。");
    return { keywords, subject: String(data?.subject ?? "").slice(0, 120) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "检索服务没有配置密钥，这一轮没有检索。" };
    try {
      const models = await modelChain(apiKey, SEARCH_PREFERENCE, undefined, "XAI_SEARCH_MODEL");
      const result = await webSearch({ apiKey, models, prompt: searchPrompt(data.keywords, data.subject), deadline: Date.now() + 170_000 });
      const hits = normalizeHits(result.text, result.links);
      if (!hits.length) return { ok: false as const, error: "这一轮检索没有形成可核对的条目。" };
      return { ok: true as const, hits };
    } catch (error) {
      return { ok: false as const, error: `检索没有完成：${reason(error)}。` };
    }
  });

function searchPrompt(keywords: string[], subject: string) {
  return [
    "请实际打开网页检索，不要靠记忆。时间范围是 2021 年到 2026 年。",
    `关键词：${keywords.join("、")}`,
    subject ? `研究对象：${subject}（用来判断相关性，不必逐字匹配）` : "",
    "分三块找，不要混在一起：",
    "1. 中文论文：近五年和这些词相关的中文期刊论文，优先看知网、万方、维普、期刊官网这类能看到收录情况和被引次数的公开页面。name 写论文题目，journal 写期刊名，year 写发表年份。",
    "   indexes 写这本期刊的收录情况，只能从下面这些值里选，可以多选：",
    '   "CSSCI"（CSSCI 来源期刊）、"CSSCI扩展"（CSSCI 扩展版，必须和 CSSCI 分开写，不能写成 CSSCI）、"北核"（北大中文核心）、',
    '   "AMI顶级"、"AMI权威"、"AMI核心"、"AMI扩展"、"AMI入库"、"CSCD核心"、"CSCD扩展"。',
    "   AMI 和 CSCD 要写出级别或库别；页面和期刊官网上都看不到就留空数组，不要猜。",
    "2. 外文论文：同一批关键词的英文期刊论文，优先看 Web of Science、期刊官网、出版商页面这类能看到收录的公开页面。source 仍写「论文」。题目和期刊名保留英文，不要翻译。",
    '   indexes 只能写 "SSCI"、"SCIE"、"SCI"、"ESCI"。页面写 SSCI 就写 SSCI；写 SCIE 或 Science Citation Index Expanded 就写 SCIE；只有 SCI、没有 SCIE 才写 SCI；写 ESCI 或 Emerging Sources Citation Index 就写 ESCI。',
    "   SSCI、SCIE、SCI、ESCI 彼此不要改写。AMI 要写出顶级、权威、核心、扩展或入库，扩展期刊不要写成核心。页面上看不到收录就留空数组，不要猜。",
    "   中文和外文论文都填 cites：被引次数；页面上只有下载次数就填下载次数，并把 metric 写成「下载」；都没有填 0。",
    "3. 课题：国家社科基金、国家自然科学基金立项公示里和这些词相关的项目。name 写项目名称，year 写立项年份，level 只能是重大、重点、一般、青年、面上、西部之一。",
    "basis 用一句话说在哪个页面看到。不要写作者、主持人、课题编号、DOI。",
    "link 必须是你这次打开过的 http 或 https 页面，没打开就不要写这一条。某一类没查到就不要补。中文论文最多 6 条，外文论文最多 6 条，课题最多 6 条。",
    "只输出 JSON，不要 Markdown：",
    '{"hits":[{"name":"","source":"论文或国社科或国自然","journal":"","year":"","indexes":[],"cites":0,"metric":"被引","level":"","basis":"","link":""}]}',
  ]
    .filter(Boolean)
    .join("\n");
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
    const safeLink = allowed.has(link) || /^https?:\/\/[^\s]+$/.test(link) ? link : "";
    if (!safeLink) continue;
    const cites = Number(row.cites);
    const level = LEVELS.find((item) => item === String(row.level ?? "").trim()) ?? "";
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
    });
    if (hits.length >= 18) break;
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
  discipline: string;
  field: string;
  paradigm: Paradigm;
  hits: { name: string; source: string; basis: string; journal: string; indexes: string[]; level: string }[];
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
    discipline: text(data.discipline, 20),
    field: text(data.field, 20),
    paradigm: data.paradigm === "定性" ? "定性" : "定量",
    hits: Array.isArray(data.hits)
      ? data.hits
          .map((item) => {
            const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
            return {
              name: text(row.name, 60),
              source: text(row.source, 8),
              basis: text(row.basis, 80),
              journal: text(row.journal, 30),
              indexes: Array.isArray(row.indexes) ? row.indexes.map((value) => String(value)).slice(0, 6) : [],
              level: text(row.level, 6),
            };
          })
          .filter((item) => item.name)
          .slice(0, 10)
      : [],
    modelId: text(data.modelId, 40) || "grok-4.7",
    avoid: Array.isArray(data.avoid) ? data.avoid.map((item) => text(item, 80)).filter(Boolean).slice(0, 9) : [],
  };
}

function topicMessages(data: TopicInput) {
  const s = data.subjectParts;
  const sentence = subjectSentence(s, false);
  const tool = data.paradigm === "定量" ? "问卷调查" : "半结构访谈";
  return [
    {
      role: "system" as const,
      content: [
        "你是社科选题顾问，按研究问题的范式出题，不按口号出题。",
        "好的选题是一个待解决的 problem：先有现象问题，再上升为理论问题。切口要小，能据此写出研究计划。",
        "定量：写清自变量、因变量，以及中介或调节变量；横截面数据不要写成确定因果。定性：写清具体情境和要理解的过程。",
        "不编文献、作者、年份、篇名、样本量、显著性。只输出 JSON。",
      ].join(""),
    },
    {
      role: "user" as const,
      content: [
        `关键词：${data.keywords.join("、")}`,
        `研究对象：${sentence || "未写"}`,
        `  · 在哪：${s.where || "未写"}`,
        `  · 是谁：${s.who || "未写"}`,
        `  · 年龄/年级/身份：${s.stage || "无"}`,
        `  · 状态/经历：${s.condition || "无"}`,
        `分析单位：${data.unit || "未写"}`,
        `学科：${data.discipline}${data.field ? ` / ${data.field}` : ""}`,
        `范式：${data.paradigm}（数据靠研究者自己做${tool}收集，不用公开数据库）`,
        data.hits.length ? "检索到的近五年论文与立项：" : "本轮检索没有返回可核对的条目，只按关键词和研究对象出题，basis 写「按关键词组合」，hitName 留空。",
        ...data.hits.map(
          (hit, index) =>
            `${index + 1}. ${hit.name}（${hit.source}${hit.journal ? `·${hit.journal}` : ""}${hit.indexes.length ? `·${hit.indexes.join("/")}` : ""}${hit.level ? `·${hit.level}` : ""}）${hit.basis}`,
        ),
        data.avoid.length ? `不要和这些题目重复或只换一个词：${data.avoid.join("；")}` : "",
        "要求：",
        "1. 出正好 3 个题目，三题的变量组合或问题类型要明显不同，不要只换一个词。",
        "2. 每题的研究对象必须带上上面的限定词：至少写出人群，再带上地点或一个年龄/身份/状态限定（地点也可以放进副标题）。",
        "3. title 是期刊题目：主标题不超过 30 字，可以加「——基于……」副标题，总长不超过 50 字。不用「浅析、现状、对策、探析」。",
        "4. question 先写现象问题，再写要检验或理解的理论问题，不超过 90 字。",
        "5. basis 一句话说对应哪条检索方向（写序号和名称）。hitName 原样抄那条方向的名称。",
        "6. parts 拆开题目要素：object 研究对象（题目里怎么写就怎么写）；iv 自变量（定性写情境或实践）；dv 因变量（定性写要理解的现象）；mechanism 中介或调节变量（没有就空字符串）；method 副标题里的数据来源（没有副标题就空字符串）。这些词必须原样出现在 title 里。",
        "7. alt 给用户改题用：object、iv、dv、mechanism 各给 2 个可以直接替换进题目的短语。",
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
    const question = String(row.question ?? "").trim().slice(0, 130);
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
    items.push({
      title,
      question,
      basis: String(row.basis ?? "").trim().slice(0, 90) || "按关键词组合",
      hitName: names.has(hitName) ? hitName : "",
      paradigm: data.paradigm,
      parts,
      alt,
      pattern: "keep",
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
      else notes.push(`「${option.name}」的中转站还没接通，这次改用默认模型。`);
    }
    const xaiKey = process.env.XAI_API_KEY;
    if (xaiKey) {
      const models = await modelChain(xaiKey, CHAT_PREFERENCE, option.route === "xai" ? option.model : undefined, "XAI_MODEL");
      routes.push({ apiKey: xaiKey, endpoint: `${xaiBase()}/chat/completions`, models });
    }
    let fromModel: Candidate[] = [];
    let failure = routes.length ? "" : "模型没有配置密钥";
    for (const route of routes) {
      if (Date.now() > deadline - 10_000) break;
      try {
        const { data: raw } = await chatJson({
          ...route,
          messages,
          maxTokens: 6000,
          temperature: 0.5,
          deadline,
          attemptMs: 75_000,
          validate: (value) => readCandidates(value, data, seed).length > 0,
        });
        fromModel = readCandidates(raw, data, seed);
        if (fromModel.length) break;
      } catch (error) {
        failure = reason(error);
      }
    }
    const items = [...fromModel];
    for (const rule of rules) {
      if (items.length >= 3) break;
      if (!items.some((item) => item.title === rule.title)) items.push(rule);
    }
    if (fromModel.length === 0) notes.push(`模型这次没有出成（${failure || "原因不明"}），3 个题先按规则生成，稍后可以换一批。`);
    else if (fromModel.length < 3) notes.push(`模型给了 ${fromModel.length} 个，另外 ${3 - fromModel.length} 个按规则补齐。`);
    return { ok: true as const, items: items.slice(0, 3), note: notes.join(""), modelCount: fromModel.length };
  });
