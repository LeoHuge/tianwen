import { createServerFn } from "@tanstack/react-start";
import type { AiConstruct, AiInstrumentPart, AiModule } from "./instrument";
import { CHAT_PREFERENCE, chatJson, modelChain, reason } from "./llm";
import { effectivePattern } from "./topic-parts";
import type { ComposeInput, Manuscript, Paradigm, TopicParts } from "./types";

const hits: number[] = [];

function allowCall() {
  const now = Date.now();
  while (hits.length > 0 && now - hits[0]! > 60 * 60 * 1000) hits.shift();
  if (hits.length >= 60) return false;
  hits.push(now);
  return true;
}

const SYSTEM = `你是「天问」的社科研究方法顾问，不是代写枪手。
硬性规则：
1. 禁止编造文献：不得给出具体作者、年份、篇名、期刊、DOI。需要文献处只写检索策略，并标【待核验】。
2. 禁止编造数据：不得写样本数、均值、系数、p值、访谈原话，除非「已核算汇总」里明确给出。未给出时，结果必须写「待数据回收后，仅填入研究者自行运算的结果」。
3. 禁止承诺发表、显著、查重率或 AIGC 率。
4. 不要抄录受版权保护的成熟量表原题（如 SCL-90、SDS）。若建议借用，写明须取得授权。
5. 样本量只复述用户给出的计算结果，不要另造一个数。
6. 只输出 JSON，不要 Markdown 围栏。`;

const FABRICATE = /伪造|编造|假的?\s*p\s*值|帮我写显著|不要管数据|假装有结果|随机生成样本|编一份数据/;

type InstrumentInput = {
  kind: "scale" | "interview";
  title: string;
  question: string;
  subject: string;
  discipline: string;
  parts: TopicParts;
  pattern: string;
  note: string;
};

function parseInstrument(input: unknown): InstrumentInput {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
  const parts = (data.parts && typeof data.parts === "object" ? data.parts : {}) as Record<string, unknown>;
  const title = text(data.title, 80);
  if (title.length < 6) throw new Error("还没有定下题目");
  return {
    kind: data.kind === "interview" ? "interview" : "scale",
    title,
    question: text(data.question, 160),
    subject: text(data.subject, 160),
    discipline: text(data.discipline, 20),
    parts: {
      object: text(parts.object, 30),
      iv: text(parts.iv, 30),
      dv: text(parts.dv, 30),
      mechanism: text(parts.mechanism, 30),
      method: text(parts.method, 40),
    },
    pattern: text(data.pattern, 20),
    note: text(data.note, 300),
  };
}

function instrumentPrompt(input: InstrumentInput) {
  const p = input.parts;
  const moderator = effectivePattern(input.pattern, input.title) === "effect-mod";
  if (input.kind === "scale") {
    return [
      "任务：为下面这个已经定好的题目写问卷的核心量表。筛选题、基本信息、注意力检测题、结尾和质量控制已经由系统生成，你只写核心变量。",
      `题目：${input.title}`,
      `研究问题：${input.question}`,
      `研究对象：${input.subject}`,
      `学科：${input.discipline}`,
      "变量：",
      p.iv ? `- 自变量：${p.iv}` : "",
      p.mechanism ? `- ${moderator ? "调节变量" : "中介变量"}：${p.mechanism}` : "",
      p.dv ? `- 因变量：${p.dv}` : "",
      input.note ? `修改意见（只按这条改，其他保持原样）：${input.note}` : "",
      "要求：",
      "1. 每个变量写一个 construct。name 用上面的变量名原样；role 写自变量、中介变量、调节变量或因变量；definition 写操作化定义：这个变量在本研究里具体指什么、从哪几个方面测，60–120 字。",
      "2. 每个 construct 写 6 条 items，李克特 5 点（1 非常不同意到 5 非常同意）。题干用研究对象听得懂的口语，一条只问一件事，不诱导，不用双重否定，不把两件事放进一句。",
      "3. 每个 construct 至少 1 条反向题，reverse 设为 true。",
      "4. 题项要贴住研究对象的处境和场所，不要写成泛泛的态度题。",
      "5. 不要照抄任何成熟量表的原题。reference 只写可参考的成熟量表名称，后面加【待核验】；不确定就写空字符串。",
      '只返回：{"constructs":[{"name":"","role":"","definition":"","reference":"","items":[{"text":"","reverse":false}]}]}',
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    "任务：为下面这个已经定好的题目写半结构访谈提纲的主体模块。开场、受访者筛选、登记表、收尾和质量控制已经由系统生成，你只写主体模块。",
    `题目：${input.title}`,
    `研究问题：${input.question}`,
    `研究对象：${input.subject}`,
    `学科：${input.discipline}`,
    p.iv ? `情境或实践：${p.iv}` : "",
    p.dv ? `要理解的现象：${p.dv}` : "",
    p.mechanism ? `关联或过程：${p.mechanism}` : "",
    input.note ? `修改意见（只按这条改，其他保持原样）：${input.note}` : "",
    "要求：",
    "1. 写 4 个模块，每个模块有 name、purpose（这一块要弄清什么，40 字内）和 3 条 questions。",
    "2. 每条主问题问过去发生过的具体事情和场合，不问「你觉得」「你会不会」「你认为应该」，不诱导，不预设答案。",
    "3. 每条主问题配 2–3 条 probes 追问：问时间、地点、在场的人、当时怎么做、后来怎样。",
    "4. 措辞让研究对象听得懂，不用学术词。",
    '只返回：{"modules":[{"name":"","purpose":"","questions":[{"text":"","probes":["",""]}]}]}',
  ]
    .filter(Boolean)
    .join("\n");
}

function readConstructs(raw: unknown): AiConstruct[] {
  const list = (raw as { constructs?: unknown })?.constructs;
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      const row = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
      const items = Array.isArray(row.items)
        ? row.items
            .map((item) => {
              if (typeof item === "string") return { text: item.trim(), reverse: /（反向|\(反向|\(R\)|（R）/.test(item) };
              const value = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
              return { text: String(value.text ?? "").trim().slice(0, 80), reverse: value.reverse === true || value.reverse === "true" };
            })
            .map((item) => ({ ...item, text: item.text.replace(/[（(](反向|R)[）)]/g, "").trim() }))
            .filter((item) => item.text.length >= 6)
            .slice(0, 8)
        : [];
      return {
        name: String(row.name ?? "").trim().slice(0, 30),
        role: String(row.role ?? "").trim().slice(0, 10),
        definition: String(row.definition ?? "").trim().slice(0, 240),
        reference: String(row.reference ?? "").trim().slice(0, 120),
        items,
      };
    })
    .filter((item) => item.name && item.items.length >= 3);
}

function readModules(raw: unknown): AiModule[] {
  const list = (raw as { modules?: unknown })?.modules;
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      const row = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
      const questions = Array.isArray(row.questions)
        ? row.questions
            .map((item) => {
              if (typeof item === "string") return { text: item.trim(), probes: [] as string[] };
              const value = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
              return {
                text: String(value.text ?? "").trim().slice(0, 90),
                probes: Array.isArray(value.probes) ? value.probes.map((probe) => String(probe).trim().slice(0, 60)).filter(Boolean).slice(0, 3) : [],
              };
            })
            .filter((item) => item.text.length >= 6)
            .slice(0, 4)
        : [];
      return { name: String(row.name ?? "").trim().slice(0, 30), purpose: String(row.purpose ?? "").trim().slice(0, 80), questions };
    })
    .filter((item) => item.name && item.questions.length >= 2)
    .slice(0, 5);
}

export const composeInstrument = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseInstrument(input))
  .handler(async ({ data }) => {
    if (data.note && FABRICATE.test(data.note)) return { ok: false as const, error: "不能按这个意见改：涉及伪造结果或编造数据。" };
    if (!allowCall()) return { ok: false as const, error: "这一小时的生成次数已满，先用已经生成的完整结构。" };
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "模型没有配置密钥，先用规则生成的完整版本。" };
    try {
      const models = await modelChain(apiKey, CHAT_PREFERENCE, undefined, "XAI_MODEL");
      const valid = (value: unknown) => (data.kind === "scale" ? readConstructs(value).length > 0 : readModules(value).length >= 2);
      const { data: raw } = await chatJson({
        apiKey,
        models,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: instrumentPrompt(data) },
        ],
        maxTokens: 7000,
        temperature: 0.4,
        deadline: Date.now() + 115_000,
        attemptMs: 90_000,
        validate: valid,
      });
      const part: AiInstrumentPart =
        data.kind === "scale" ? { kind: "scale", constructs: readConstructs(raw) } : { kind: "interview", modules: readModules(raw) };
      return { ok: true as const, part };
    } catch (error) {
      return { ok: false as const, error: `模型这次没有写成（${reason(error)}），先用规则生成的完整版本。` };
    }
  });

export const composePack = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseCompose(input))
  .handler(async ({ data }) => {
    if (!allowCall()) return { ok: false as const, error: "这一小时的生成次数已满。请稍后再试，或先用规则底稿。" };
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "模型暂不可用。可以改用规则底稿，它不调用模型。" };
    try {
      const models = await modelChain(apiKey, CHAT_PREFERENCE, undefined, "XAI_MODEL");
      const { data: raw } = await chatJson({
        apiKey,
        models,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: composePrompt(data) },
        ],
        maxTokens: 6000,
        temperature: 0.3,
        deadline: Date.now() + 115_000,
        attemptMs: 90_000,
        validate: (value) => sectionList((value as { manuscript?: { sections?: unknown } })?.manuscript?.sections ?? (value as { sections?: unknown })?.sections).length >= 3,
      });
      const record = raw as Record<string, unknown>;
      const body = (record.manuscript && typeof record.manuscript === "object" ? record.manuscript : record) as Record<string, unknown>;
      const warnings = asStrings(record.warnings, 6);
      const manuscript = asManuscript(body, "model", warnings);
      if (data.statsSummary == null && /p\s*[<=>＜＞]\s*0\.\d+|显著/.test(JSON.stringify(manuscript))) {
        manuscript.warnings = [...manuscript.warnings, "输出里出现了显著性措辞。没有你自己的运算结果时，请删掉这些句子。"];
      }
      return { ok: true as const, manuscript, analysisPlan: String(record.analysisPlan ?? "").slice(0, 1200) };
    } catch (error) {
      return { ok: false as const, error: `${reason(error)}。上面那版还在，可以再试一次。` };
    }
  });

export const revisePack = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseRevise(input))
  .handler(async ({ data }) => {
    if (FABRICATE.test(data.note)) {
      return { ok: false as const, error: "不能按这个意见改：涉及伪造结果或编造数据。请只改结构，或填入你自己算出的数字。" };
    }
    if (!allowCall()) return { ok: false as const, error: "这一小时的生成次数已满。" };
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "模型暂不可用，这一轮没有被消耗。" };
    try {
      const models = await modelChain(apiKey, CHAT_PREFERENCE, undefined, "XAI_MODEL");
      const { data: raw } = await chatJson({
        apiKey,
        models,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `这是一轮结构性修订。目标：${data.target}。意见：${data.note}
研究要点：${data.brief}
当前文稿 JSON：${JSON.stringify(data.manuscript)}
请返回完整 JSON 文稿，键为 title, abstract, keywords, sections（heading, body）。保留【待核验】和待填结果，不要新增任何未提供的统计数字或文献。`,
          },
        ],
        maxTokens: 6000,
        temperature: 0.3,
        deadline: Date.now() + 115_000,
        attemptMs: 90_000,
        validate: (value) => sectionList((value as { sections?: unknown })?.sections).length >= 3,
      });
      return { ok: true as const, manuscript: asManuscript(raw as Record<string, unknown>, "model", ["修订未核对文献，也未重新计算统计量。"]) };
    } catch (error) {
      return { ok: false as const, error: `${reason(error)}。这一轮没有被消耗。` };
    }
  });

function composePrompt(input: ComposeInput) {
  return [
    "把下面的研究设计写成一份初稿。",
    `题目：${input.title}`,
    `研究问题：${input.question}`,
    `学科：${input.discipline}`,
    `关键词：${input.keywords.join("、")}`,
    `研究对象：${input.subject}`,
    `研究单位：${input.unit}`,
    `范式与工具：${input.paradigm === "定性" ? "定性，半结构访谈" : "定量，自编问卷"}，数据由研究者自己收集`,
    `测量：${input.measures || "（未写）"}`,
    `样本量（原样复述，不要改数字）：${input.sampleSentence}`,
    `已核算汇总：${input.statsSummary ?? "无。禁止写任何统计结果。"}`,
    "manuscript.sections 必须是数组，正好六项，顺序与标题固定为：问题提出、研究设计、测量与样本、分析计划、结果（待填）、讨论与局限。每节 body 150–300 字。摘要不超过 200 字。",
    "需要引文献的地方只写检索方向并标【待核验】。",
    '只返回：{"manuscript":{"title":"","abstract":"","keywords":[],"sections":[{"heading":"","body":""}]},"analysisPlan":"","warnings":[]}',
  ].join("\n");
}

function parseCompose(input: unknown): ComposeInput {
  if (!input || typeof input !== "object") throw new Error("请求不完整");
  const data = input as Partial<ComposeInput>;
  const keywords = asStrings(data.keywords, 4).map((word) => clip(word, 24));
  if (keywords.length < 4 || keywords.some((word) => word.length < 2)) throw new Error("关键词不完整");
  const title = clip(String(data.title ?? ""), 80);
  if (title.length < 6) throw new Error("还没有定下题目");
  const paradigm: Paradigm = data.paradigm === "定性" ? "定性" : "定量";
  return {
    keywords,
    subject: clip(String(data.subject ?? ""), 200),
    unit: clip(String(data.unit ?? ""), 40),
    discipline: clip(String(data.discipline ?? ""), 40),
    title,
    question: clip(String(data.question ?? ""), 300),
    paradigm,
    measures: clip(String(data.measures ?? ""), 600),
    sampleSentence: clip(String(data.sampleSentence ?? ""), 600),
    statsSummary: data.statsSummary ? clip(String(data.statsSummary), 1500) : null,
  };
}

function parseRevise(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("请求不完整");
  const data = input as { note?: unknown; target?: unknown; brief?: unknown; manuscript?: Manuscript };
  const note = clip(String(data.note ?? ""), 500);
  if (note.length < 4) throw new Error("请写清要改什么");
  if (!data.manuscript || !Array.isArray(data.manuscript.sections)) throw new Error("还没有可修订的文稿");
  return {
    note,
    target: clip(String(data.target ?? "全文结构"), 40),
    brief: clip(String(data.brief ?? ""), 800),
    manuscript: data.manuscript,
  };
}

function asManuscript(data: Record<string, unknown>, source: Manuscript["source"], warnings: string[]): Manuscript {
  const sections = sectionList(data.sections)
    .slice(0, 8)
    .map((section) => ({
      heading: clip(String(section.heading ?? "未命名"), 40),
      body: clip(String(section.body ?? ""), 2000),
    }));
  return {
    title: clip(String(data.title ?? "未命名文稿"), 80),
    abstract: clip(String(data.abstract ?? ""), 600),
    keywords: asStrings(data.keywords, 6),
    sections,
    source,
    warnings,
  };
}

function sectionList(value: unknown): { heading?: unknown; body?: unknown }[] {
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === "object") as { heading?: unknown; body?: unknown }[];
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([heading, body]) => ({
      heading,
      body: typeof body === "string" ? body : "",
    }));
  }
  return [];
}

function asStrings(value: unknown, max: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string" && item.trim())
    .slice(0, max)
    .map((item) => clip(String(item).trim(), 240));
}

function clip(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}
