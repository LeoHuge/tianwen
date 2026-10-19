import type { Instrument } from "./instrument";
import { DEFAULT_PLAN, sanitize, type SamplePlan } from "./sample-size";

export type PlanId =
  | "topic"
  | "survey"
  | "buyout"
  | "revise3"
  | "upgrade-buyout"
  | "upgrade-revise"
  | "deposit-buyout"
  | "balance-buyout"
  | "deposit-revise"
  | "balance-revise"
  | "addon-buyout"
  | "addon-revise"
  | "code"
  | "year";

export type Order = {
  id: string;
  planId: PlanId;
  amount: number;
  title: string;
  status: "pending" | "paid";
  createdAt: string;
  channel: "wechat" | "alipay";
  projectId?: string;
};

export type Paradigm = "定量" | "定性";

/** 研究对象拆成几格：在哪、是谁、年龄或身份、状态或经历，另加选填的时间与排除。 */
export type SubjectParts = {
  where: string;
  who: string;
  stage: string;
  condition: string;
  time: string;
  exclude: string;
};

export type Manuscript = {
  title: string;
  abstract: string;
  keywords: string[];
  sections: { heading: string; body: string }[];
  source: "model" | "rules";
  warnings: string[];
};

export type HotHit = {
  id: string;
  name: string;
  source: "论文" | "国社科" | "国自然";
  window: string;
  basis: string;
  link: string;
  cites: number;
  metric: "被引" | "下载" | "";
  level: string;
  indexes: string[];
  journal: string;
  year: string;
};

/** 题目的组成要素。定量：iv 自变量、dv 因变量、mechanism 中介或调节。定性：iv 情境或实践、dv 要理解的现象。 */
export type TopicParts = {
  object: string;
  iv: string;
  dv: string;
  mechanism: string;
  method: string;
};

export type TopicAlt = {
  object: string[];
  iv: string[];
  dv: string[];
  mechanism: string[];
};

export type Candidate = {
  title: string;
  question: string;
  basis: string;
  hitName: string;
  paradigm: Paradigm;
  parts: TopicParts;
  alt: TopicAlt;
  pattern: string;
  source: "model" | "rules";
};

export type ChosenTopic = Candidate & {
  index: number;
  originalTitle: string;
  edits: number;
};

export type Project = {
  id: string;
  updatedAt: string;
  keywords: string[];
  subject: string;
  subjectParts: SubjectParts;
  legacySubject: string;
  unit: string;
  discipline: string;
  field: string;
  paradigm: "" | Paradigm;
  instrument: "scale" | "interview";
  tier: "buyout" | "revise3";
  hotHits: HotHit[];
  hotKey: string;
  searchNote: string;
  candidates: Candidate[];
  candidateKey: string;
  candidateNote: string;
  rerolls: number;
  topic: ChosenTopic | null;
  instrumentDoc: Instrument | null;
  instrumentKey: string;
  samplePlan: SamplePlan;
  fileName: string;
  parseNote: string;
  csv: string;
  csvIsDemo: boolean;
  includeStats: boolean;
  analysisPlan: string;
  manuscript: Manuscript | null;
  revisions: { at: string; note: string; target: string }[];
  modelRuns: number;
};

export type ComposeInput = {
  keywords: string[];
  subject: string;
  unit: string;
  discipline: string;
  title: string;
  question: string;
  paradigm: Paradigm;
  measures: string;
  sampleSentence: string;
  statsSummary: string | null;
};

export const DISCLOSURE =
  "本稿由研究辅助工具「天问」根据研究者提供的设计生成或整理，未核对文献，未代替统计软件。数字只可来自研究者自己的数据文件。投稿、课程作业或答辩前，须按所在学校与期刊的规定披露人工智能使用情况。";

export const BLANK_SUBJECT: SubjectParts = { where: "", who: "", stage: "", condition: "", time: "", exclude: "" };

export function blankProject(): Project {
  return {
    id: "P" + Date.now().toString(36).toUpperCase(),
    updatedAt: new Date().toISOString(),
    keywords: ["", "", "", ""],
    subject: "",
    subjectParts: { ...BLANK_SUBJECT },
    legacySubject: "",
    unit: "社区",
    discipline: "社会学",
    field: "组织与劳动",
    paradigm: "",
    instrument: "scale",
    tier: "revise3",
    hotHits: [],
    hotKey: "",
    searchNote: "",
    candidates: [],
    candidateKey: "",
    candidateNote: "",
    rerolls: 0,
    topic: null,
    instrumentDoc: null,
    instrumentKey: "",
    samplePlan: { ...DEFAULT_PLAN },
    fileName: "",
    parseNote: "",
    csv: "",
    csvIsDemo: false,
    includeStats: false,
    analysisPlan: "",
    manuscript: null,
    revisions: [],
    modelRuns: 0,
  };
}

/** 把浏览器里存的旧项目补齐成当前结构。旧版的公开库、定金字段直接丢掉。 */
export function normalizeProject(raw: unknown): Project {
  const base = blankProject();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;
  const text = (key: string, fallback: string) => (typeof data[key] === "string" ? (data[key] as string) : fallback);
  const parts = (data.subjectParts && typeof data.subjectParts === "object" ? data.subjectParts : {}) as Record<string, unknown>;
  const subjectParts: SubjectParts = {
    where: String(parts.where ?? ""),
    who: String(parts.who ?? ""),
    stage: String(parts.stage ?? ""),
    condition: String(parts.condition ?? ""),
    time: String(parts.time ?? ""),
    exclude: String(parts.exclude ?? ""),
  };
  const hasParts = Object.values(subjectParts).some((value) => value.trim());
  const keywords = Array.isArray(data.keywords) ? data.keywords.map((word) => String(word ?? "")).slice(0, 4) : base.keywords;
  while (keywords.length < 4) keywords.push("");
  const candidates = Array.isArray(data.candidates)
    ? (data.candidates as Candidate[]).filter((item) => item && typeof item === "object" && item.parts && typeof item.title === "string")
    : [];
  const topic =
    data.topic && typeof data.topic === "object" && (data.topic as ChosenTopic).parts ? (data.topic as ChosenTopic) : null;
  const paradigm = data.paradigm === "定量" || data.paradigm === "定性" ? data.paradigm : "";
  return {
    ...base,
    id: text("id", base.id),
    updatedAt: text("updatedAt", base.updatedAt),
    keywords,
    subject: text("subject", ""),
    subjectParts,
    legacySubject: hasParts ? text("legacySubject", "") : text("legacySubject", "") || text("subject", ""),
    unit: text("unit", base.unit),
    discipline: text("discipline", base.discipline),
    field: text("field", base.field),
    paradigm,
    instrument: paradigm === "定性" ? "interview" : "scale",
    tier: data.tier === "buyout" ? "buyout" : "revise3",
    hotHits: Array.isArray(data.hotHits) ? (data.hotHits as HotHit[]).map(fillHit) : [],
    hotKey: text("hotKey", ""),
    searchNote: text("searchNote", ""),
    candidates,
    candidateKey: candidates.length ? text("candidateKey", "") : "",
    candidateNote: text("candidateNote", ""),
    rerolls: Number.isFinite(Number(data.rerolls)) ? Number(data.rerolls) : 0,
    topic,
    instrumentDoc: topic && data.instrumentDoc && typeof data.instrumentDoc === "object" ? (data.instrumentDoc as Instrument) : null,
    instrumentKey: topic ? text("instrumentKey", "") : "",
    samplePlan: sanitize((data.samplePlan ?? {}) as Partial<SamplePlan>),
    fileName: text("fileName", ""),
    parseNote: text("parseNote", ""),
    csv: text("csv", ""),
    csvIsDemo: Boolean(data.csvIsDemo),
    includeStats: Boolean(data.includeStats),
    analysisPlan: text("analysisPlan", ""),
    manuscript: data.manuscript && typeof data.manuscript === "object" ? (data.manuscript as Manuscript) : null,
    revisions: Array.isArray(data.revisions) ? (data.revisions as Project["revisions"]) : [],
    modelRuns: Number.isFinite(Number(data.modelRuns)) ? Number(data.modelRuns) : 0,
  };
}

function fillHit(hit: HotHit): HotHit {
  return {
    ...hit,
    metric: hit.metric ?? "",
    indexes: Array.isArray(hit.indexes) ? hit.indexes : [],
    journal: hit.journal ?? "",
    year: hit.year ?? "",
  };
}
