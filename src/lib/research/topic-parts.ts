import { shortObject, subjectSentence, titleObject } from "./subject";
import type { Candidate, ChosenTopic, Paradigm, SubjectParts, TopicAlt, TopicParts } from "./types";

export const BANNED = /浅析|浅谈|现状|对策|探析|探究|研究综述|创新路径|若干思考|刍议/;
export const TWEAK_LIMIT = 6;
export const MAIN_MAX = 40;
export const TITLE_MAX = 60;

export type Pattern = {
  id: string;
  label: string;
  paradigm: Paradigm;
  needs: (keyof TopicParts)[];
  make: (parts: TopicParts) => string;
};

export const PATTERNS: Pattern[] = [
  {
    id: "effect-med",
    label: "X 对 Y 的影响：M 的中介作用",
    paradigm: "定量",
    needs: ["iv", "dv", "mechanism"],
    make: (p) => `${p.iv}对${p.object}${p.dv}的影响：${p.mechanism}的中介作用`,
  },
  {
    id: "effect-mod",
    label: "X 与 Y：W 的调节作用",
    paradigm: "定量",
    needs: ["iv", "dv", "mechanism"],
    make: (p) => `${p.iv}与${p.object}${p.dv}：${p.mechanism}的调节作用`,
  },
  {
    id: "effect",
    label: "X 对 Y 的影响",
    paradigm: "定量",
    needs: ["iv", "dv"],
    make: (p) => `${p.iv}对${p.object}${p.dv}的影响`,
  },
  {
    id: "relation",
    label: "X、M 与 Y",
    paradigm: "定量",
    needs: ["iv", "dv"],
    make: (p) => (p.mechanism ? `${p.iv}、${p.mechanism}与${p.object}${p.dv}` : `${p.iv}与${p.object}${p.dv}的关系`),
  },
  {
    id: "q-shape",
    label: "X 如何形塑 Y",
    paradigm: "定性",
    needs: ["iv", "dv"],
    make: (p) => `${p.iv}如何形塑${p.object}的${p.dv}${p.mechanism ? `：${p.mechanism}的视角` : ""}`,
  },
  {
    id: "q-in",
    label: "X 中的 Y：对象的日常经验",
    paradigm: "定性",
    needs: ["iv", "dv"],
    make: (p) => `${p.iv}中的${p.dv}：${p.object}的日常经验`,
  },
  {
    id: "q-view",
    label: "对象的 Y：基于 X 的质性考察",
    paradigm: "定性",
    needs: ["dv"],
    make: (p) => `${p.object}的${p.dv}${p.iv ? `：基于${p.iv}的质性考察` : ""}`,
  },
];

/** 模型写的题目没有句式编号，按题目里写的「中介」「调节」认回来。 */
export function effectivePattern(pattern: string, title: string) {
  if (pattern !== "keep") return pattern;
  if (/调节/.test(title)) return "effect-mod";
  if (/中介/.test(title)) return "effect-med";
  return "keep";
}

export function patternsFor(paradigm: Paradigm) {
  return PATTERNS.filter((item) => item.paradigm === paradigm);
}

export function composeTitle(parts: TopicParts, patternId: string, paradigm: Paradigm) {
  const pattern =
    PATTERNS.find((item) => item.id === patternId && item.paradigm === paradigm) ??
    patternsFor(paradigm).find((item) => item.needs.every((key) => parts[key])) ??
    patternsFor(paradigm)[0]!;
  const main = pattern.make(clean(parts));
  return parts.method.trim() ? `${main}——${parts.method.trim()}` : main;
}

export function patternFits(patternId: string, parts: TopicParts) {
  const pattern = PATTERNS.find((item) => item.id === patternId);
  return pattern ? pattern.needs.every((key) => parts[key].trim()) : false;
}

export function makeQuestion(parts: TopicParts, paradigm: Paradigm, subject: string) {
  const who = subject || parts.object || "研究对象";
  if (paradigm === "定性") {
    return `${who}在${parts.iv || "日常处境"}中，是怎样经历和理解${parts.dv || "这件事"}的？这一过程${
      parts.mechanism ? `与${parts.mechanism}有什么关联` : "受到哪些人和规则的影响"
    }？`;
  }
  return `在${who}中，${parts.iv || "X"}是否影响${parts.dv || "Y"}、影响有多大？${parts.mechanism ? `${parts.mechanism}在其中起什么作用？` : ""}`;
}

function clean(parts: TopicParts): TopicParts {
  return {
    object: parts.object.trim(),
    iv: parts.iv.trim(),
    dv: parts.dv.trim(),
    mechanism: parts.mechanism.trim(),
    method: parts.method.trim(),
  };
}

const OUTCOME =
  /感|度|满意|幸福|健康|焦虑|抑郁|压力|信任|参与|倦怠|投入|成绩|绩效|意愿|认同|孤独|福祉|质量|适应|获得|安全|归属|依赖|行为|情绪|心理|发展|融入|获得感/;

export type TopicSeed = {
  keywords: string[];
  subject: SubjectParts;
  unit: string;
  discipline: string;
  field: string;
  paradigm: Paradigm;
  hits: { name: string; source: string }[];
};

function splitKeywords(seed: TopicSeed) {
  const words = [...new Set(seed.keywords.map((word) => word.trim()).filter((word) => word.length >= 2))];
  const subjectText = Object.values(seed.subject).join("");
  const constructs = words.filter((word) => !subjectText.includes(word));
  const pool = constructs.length >= 2 ? constructs : words;
  const outcomes = pool.filter((word) => OUTCOME.test(word));
  const dv = outcomes[outcomes.length - 1] ?? pool[pool.length - 1] ?? "";
  const others = pool.filter((word) => word !== dv);
  return { pool, dv, others, outcomes };
}

function defaultMethod(seed: TopicSeed) {
  const where = seed.subject.where.trim();
  if (!where) return "";
  return seed.paradigm === "定量" ? `基于${where}的问卷调查` : `基于${where}的深度访谈`;
}

/** 模型出不来时用规则出 3 个题。三个题的变量组合和问法彼此不同；variant 换一种组合，用于「换一批」。 */
export function rulesCandidates(seed: TopicSeed, variant = 0): Candidate[] {
  const object = titleObject(seed.subject) || seed.subject.who.trim() || "研究对象";
  // 副标题里已经写了地点时，主标题只写人群，避免同一个地名出现两次。
  const short = shortObject(seed.subject) || object;
  const sentence = subjectSentence(seed.subject, false);
  const split = splitKeywords(seed);
  const pool = split.pool;
  const dv = variant % 2 === 1 && split.outcomes.length > 1 ? split.outcomes[0]! : split.dv;
  const rest = pool.filter((word) => word !== dv);
  const shift = rest.length ? variant % rest.length : 0;
  const others = [...rest.slice(shift), ...rest.slice(0, shift)];
  const a = others[0] ?? pool[0] ?? "";
  const b = others[1] ?? "";
  const c = others[2] ?? "";
  const method = defaultMethod(seed);
  const plans: { parts: TopicParts; pattern: string }[] =
    seed.paradigm === "定量"
      ? [
          { parts: { object: method ? short : object, iv: a, dv, mechanism: b, method }, pattern: b ? "effect-med" : "effect" },
          { parts: { object, iv: b || a, dv, mechanism: c || (b ? a : ""), method: "" }, pattern: c || b ? "effect-mod" : "relation" },
          { parts: { object: method ? short : object, iv: c || a, dv, mechanism: c ? a : b, method }, pattern: "relation" },
        ]
      : [
          { parts: { object: method ? short : object, iv: a, dv, mechanism: b, method }, pattern: "q-shape" },
          { parts: { object, iv: b || a, dv, mechanism: "", method: "" }, pattern: "q-in" },
          { parts: { object: method ? short : object, iv: c || a, dv, mechanism: "", method }, pattern: "q-view" },
        ];
  const seen = new Set<string>();
  const items: Candidate[] = [];
  plans.forEach((plan, index) => {
    let title = composeTitle(plan.parts, plan.pattern, seed.paradigm);
    if (seen.has(title)) {
      plan.parts = { ...plan.parts, method: plan.parts.method ? "" : method };
      title = composeTitle(plan.parts, plan.pattern, seed.paradigm);
    }
    seen.add(title);
    const hit = seed.hits[index] ?? seed.hits[0];
    items.push({
      title,
      question: makeQuestion(plan.parts, seed.paradigm, sentence),
      basis: hit ? `对应检索方向「${hit.name}」（${hit.source}），按你的关键词与研究对象组合。` : "本轮没有可核对的检索条目，按你的关键词与研究对象组合。",
      hitName: hit?.name ?? "",
      paradigm: seed.paradigm,
      parts: plan.parts,
      alt: altFrom(seed, plan.parts),
      pattern: plan.pattern,
      source: "rules",
    });
  });
  return items;
}

function altFrom(seed: TopicSeed, parts: TopicParts): TopicAlt {
  const { pool } = splitKeywords(seed);
  const s = seed.subject;
  const used = [parts.iv, parts.dv, parts.mechanism];
  return {
    object: unique([titleObject(s), shortObject(s), `${s.where.trim()}${s.who.trim()}`, s.who.trim()].filter((item) => item && item !== parts.object)),
    iv: pool.filter((word) => !used.includes(word)).slice(0, 3),
    dv: pool.filter((word) => !used.includes(word)).slice(0, 3),
    mechanism: pool.filter((word) => !used.includes(word)).slice(0, 3),
  };
}

/** 改题下拉里每一格的可选项：当前值、模型给的备选、关键词。 */
export function slotOptions(topic: Candidate, subject: SubjectParts, keywords: string[], key: keyof TopicParts) {
  const words = keywords.map((word) => word.trim()).filter((word) => word.length >= 2);
  const where = subject.where.trim();
  if (key === "object") return unique([topic.parts.object, ...topic.alt.object, titleObject(subject), shortObject(subject)].filter(Boolean));
  if (key === "method") {
    const tool = topic.paradigm === "定量" ? "问卷调查" : "深度访谈";
    return unique([topic.parts.method, where ? `基于${where}的${tool}` : "", `基于${tool}的${topic.paradigm === "定量" ? "实证分析" : "质性研究"}`, ""]);
  }
  const alt = key === "iv" ? topic.alt.iv : key === "dv" ? topic.alt.dv : topic.alt.mechanism;
  return unique([topic.parts[key], ...alt, ...words, ...(key === "mechanism" ? [""] : [])]);
}

/** 模型没拆要素时，从题目里把关键词认回来，保证改题对话框能用。 */
export function inferParts(title: string, seed: TopicSeed): TopicParts {
  const main = title.split("——")[0] ?? title;
  const method = title.includes("——") ? (title.split("——")[1] ?? "").trim() : "";
  const objects = [titleObject(seed.subject), shortObject(seed.subject), `${seed.subject.where.trim()}${seed.subject.who.trim()}`, seed.subject.who.trim()]
    .filter(Boolean)
    .sort((x, y) => y.length - x.length);
  const object = objects.find((item) => main.includes(item)) ?? titleObject(seed.subject);
  const found = seed.keywords
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && main.includes(word) && !object.includes(word))
    .sort((x, y) => main.indexOf(x) - main.indexOf(y));
  const dv = found.find((word) => OUTCOME.test(word)) ?? found[found.length - 1] ?? "";
  const rest = found.filter((word) => word !== dv);
  return { object, iv: rest[0] ?? "", dv, mechanism: rest[1] ?? "", method };
}

export type Suggestion = { id: string; label: string; detail: string; parts: TopicParts; pattern: string };

/** 改题对话框里给的建议。每条都是一键套用，套用后仍可在下拉里调整。 */
export function editSuggestions(topic: ChosenTopic, subject: SubjectParts): Suggestion[] {
  const parts = topic.parts;
  const list: Suggestion[] = [];
  const current = effectivePattern(topic.pattern, topic.title);
  const fullObject = titleObject(subject);
  if (fullObject && parts.object !== fullObject) {
    list.push({
      id: "object",
      label: "研究对象换成你写的限定写法",
      detail: `「${parts.object || "（空）"}」→「${fullObject}」`,
      parts: { ...parts, object: fullObject },
      pattern: topic.pattern,
    });
  }
  if (topic.paradigm === "定量" && parts.mechanism) {
    if (current !== "effect-med")
      list.push({ id: "med", label: "改问中介作用", detail: `问「${parts.iv}」是不是通过「${parts.mechanism}」影响「${parts.dv}」`, parts, pattern: "effect-med" });
    if (current !== "effect-mod")
      list.push({ id: "mod", label: "改问调节作用", detail: `问「${parts.mechanism}」高低不同时，「${parts.iv}」的作用是否不同`, parts, pattern: "effect-mod" });
  }
  if (topic.paradigm === "定量" && !parts.mechanism && topic.alt.mechanism[0]) {
    list.push({
      id: "add-mech",
      label: `加一个中介变量「${topic.alt.mechanism[0]}」`,
      detail: "题目从直接影响变成影响路径，切口更清楚",
      parts: { ...parts, mechanism: topic.alt.mechanism[0] },
      pattern: "effect-med",
    });
  }
  if (topic.paradigm === "定性" && current !== "q-shape" && parts.iv) {
    list.push({ id: "q-shape", label: "改成过程问法", detail: `问「${parts.iv}」怎样一步步影响「${parts.dv}」`, parts, pattern: "q-shape" });
  }
  if (!parts.method && subject.where.trim()) {
    const method = topic.paradigm === "定量" ? `基于${subject.where.trim()}的问卷调查` : `基于${subject.where.trim()}的深度访谈`;
    list.push({ id: "method", label: "加副标题，写明数据从哪来", detail: `——${method}`, parts: { ...parts, method }, pattern: topic.pattern });
  }
  if (parts.method) {
    list.push({ id: "short", label: "去掉副标题，题目更短", detail: `删去「——${parts.method}」`, parts: { ...parts, method: "" }, pattern: topic.pattern });
  }
  const altDv = topic.alt.dv.find((word) => word !== parts.dv && word !== parts.iv && word !== parts.mechanism);
  if (altDv) {
    list.push({ id: "dv", label: `因变量换成「${altDv}」`, detail: `「${parts.dv}」→「${altDv}」`, parts: { ...parts, dv: altDv }, pattern: topic.pattern });
  }
  return list.slice(0, 5);
}

/** 只替换改动过的词，保留原题措辞。替换不了就返回 null，由调用方改用句式重组。 */
export function replaceParts(title: string, from: TopicParts, to: TopicParts) {
  let next = title;
  for (const key of ["object", "iv", "dv", "mechanism"] as const) {
    if (from[key] === to[key]) continue;
    if (!from[key] || !to[key] || !next.includes(from[key])) return null;
    next = next.replace(from[key], to[key]);
  }
  if (from.method !== to.method) {
    const [main] = next.split("——");
    next = to.method ? `${main}——${to.method}` : main!;
  }
  return next;
}

export function editDistance(a: string, b: string) {
  const x = [...a];
  const y = [...b];
  let prev = Array.from({ length: y.length + 1 }, (_, index) => index);
  for (let i = 1; i <= x.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= y.length; j += 1) {
      row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[y.length]!;
}

export function checkTitle(final: string, base: string, parts: TopicParts) {
  const problems: string[] = [];
  const title = final.trim();
  const main = title.split("——")[0] ?? title;
  const distance = editDistance(title, base);
  if (title.length < 8) problems.push("题目太短。");
  if (main.length > MAIN_MAX) problems.push(`主标题 ${main.length} 字，超过 ${MAIN_MAX} 字。`);
  if (title.length > TITLE_MAX) problems.push(`连副标题 ${title.length} 字，超过 ${TITLE_MAX} 字。`);
  if (BANNED.test(title)) problems.push("不要用「浅析、现状、对策、探析」一类字眼。");
  if (distance > TWEAK_LIMIT) problems.push(`小改动了 ${distance} 个字，只能动 ${TWEAK_LIMIT} 个字以内。要大改，请用上面的建议和下拉选项。`);
  if (parts.dv && !title.includes(parts.dv.trim())) problems.push(`题目里要保留「${parts.dv.trim()}」。`);
  const filled = [parts.iv, parts.dv, parts.mechanism].map((word) => word.trim()).filter(Boolean);
  if (new Set(filled).size < filled.length) problems.push("自变量、因变量和中介（调节）变量不能用同一个词。");
  return { ok: problems.length === 0, problems, distance };
}

export function unique<T>(items: T[]) {
  return [...new Set(items)];
}
