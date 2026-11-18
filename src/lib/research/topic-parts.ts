import { shortObject, subjectSentence, textObject, titleObject } from "./subject";
import { TEXT_PARADIGMS, textParadigm, textPatternIds } from "./text-paradigms";
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
  {
    id: "meta",
    label: "X 与 Y 关系的元分析",
    paradigm: "元分析",
    needs: ["iv", "dv"],
    make: (p) => `${p.iv}与${p.dv}关系的元分析${p.mechanism ? `：${p.mechanism}的作用` : ""}`,
  },
  ...TEXT_PARADIGMS.map(
    (item): Pattern => ({
      id: item.id,
      label: item.label,
      paradigm: "文本分析",
      needs: ["object", "dv"],
      make: item.make,
    }),
  ),
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
  if (paradigm === "文本分析") {
    return `从${parts.object || who || "这份文本"}抽出${parts.dv || "要分析的现象"}，按${parts.iv || "所选范式"}的类目归类，每个判断都要能回到原文位置。`;
  }
  if (paradigm === "元分析") {
    return `已发表研究里，${parts.iv || "这一条件"}与${parts.dv || "这一结果"}的效应是否同方向？${parts.mechanism ? `${parts.mechanism}是否改变这一关系？` : ""}合并效应在摘录完成之后计算。`;
  }
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
  hits: { name: string; source: string; theme?: string; method?: string; variables?: string; population?: string }[];
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

function phraseList(value: string | undefined) {
  return (value ?? "")
    .split(/[、，,；;/]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && item.length <= 12);
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

function corpusBrief(hits: TopicSeed["hits"]) {
  return hits
    .slice(0, 3)
    .map((hit) => {
      const name = clip(hit.name, 18);
      const did = hit.method && hit.theme ? `用${clip(hit.method, 8)}看${clip(hit.theme, 12)}` : clip(hit.theme || hit.method || hit.variables || "", 16);
      return `「${name}」${did ? did : ""}`;
    })
    .join("；");
}

function fitQuestion(brief: string, gap: string) {
  const tail = gap.trim();
  const room = Math.max(24, 180 - tail.length - 1);
  return `${brief.slice(0, room)}。${tail}`.slice(0, 180);
}

/** 三个题分别从方法、变量、研究对象上对照整组检索结果，不把四个关键词重新搭配。 */
function literaturePlans(seed: TopicSeed, object: string, short: string, dv: string, method: string, variant: number) {
  const hits = seed.hits.filter((hit) => hit.name && (hit.theme || hit.method || hit.variables || hit.population));
  if (!hits.length) return null;
  const keywords = new Set(seed.keywords);
  const variables = [...new Set(hits.flatMap((hit) => phraseList(hit.variables)))].filter((item) => !keywords.has(item));
  const methods = [...new Set(hits.map((hit) => hit.method).filter((item): item is string => Boolean(item)))];
  const populations = [...new Set(hits.map((hit) => hit.population).filter((item): item is string => Boolean(item)))];
  const pool = variables.length ? variables : hits.map((hit) => clip(hit.theme || hit.name, 10)).filter(Boolean);
  const at = (index: number) => (pool.length ? pool[(variant + index) % pool.length] : "") || dv;
  const iv = clip(at(0), 10);
  const second = clip(at(1), 10);
  const third = clip(at(2), 10);
  const who = short || object;
  const covered = corpusBrief(hits);
  const sentence = subjectSentence(seed.subject, false) || who;
  const ownMethod = method || (seed.paradigm === "定量" ? "问卷调查" : "深度访谈");
  const plans = [
    {
      parts: { object: method ? who : object, iv, dv, mechanism: second === iv ? "" : second, method },
      pattern: seed.paradigm === "定量" ? (second !== iv ? "effect-med" : "effect") : "q-shape",
      question: fitQuestion(covered, `方法集中在${methods.join("、") || "既有做法"}，还没有用${ownMethod}看${sentence}里的${dv}。`),
      hit: hits[0]!,
    },
    {
      parts: { object, iv: second, dv, mechanism: third !== second ? third : "", method: "" },
      pattern: seed.paradigm === "定量" ? "relation" : "q-view",
      question: fitQuestion(covered, `${second}已经出现在这些研究里，还没有放在${sentence}上，和${dv}一起看。`),
      hit: hits[Math.min(1, hits.length - 1)]!,
    },
    {
      parts: { object: method ? who : object, iv: third, dv, mechanism: "", method },
      pattern: seed.paradigm === "定量" ? "relation" : "q-view",
      question: fitQuestion(covered, `对象写的是${populations.join("、") || "其他人群"}，还没有落到${sentence}。`),
      hit: hits[Math.min(2, hits.length - 1)]!,
    },
  ];
  return plans;
}

function defaultMethod(seed: TopicSeed) {
  const where = seed.subject.where.trim();
  if (!where) return "";
  return seed.paradigm === "定量" ? `基于${where}的问卷调查` : `基于${where}的深度访谈`;
}

function textCandidates(seed: TopicSeed, variant: number): Candidate[] {
  const object = clip(textObject(seed.subject) || "这份文本", 18);
  const words = seed.keywords.map((word) => word.trim()).filter((word) => word.length >= 2 && !object.includes(word));
  const theory = /目的论|归化|异化|生态|话语分析|符号学|细读|语料|框架分析|内容分析|互文/;
  const dv =
    words.find((word) => /文化负载|隐喻|意象|叙事/.test(word)) ||
    words.find((word) => /词$/.test(word) && !theory.test(word)) ||
    words.find((word) => !theory.test(word)) ||
    words[words.length - 1] ||
    "文本现象";
  const blob = `${seed.keywords.join("")}${object}${seed.subject.who}${seed.discipline}${seed.field}`;
  const names = seed.hits
    .slice(0, 3)
    .map((item) => item.name)
    .filter(Boolean);
  return textPatternIds(blob, variant).map((id, index) => {
    const guide = textParadigm(id);
    const parts: TopicParts = { object, iv: guide.lens, dv, mechanism: "", method: "" };
    const title = composeTitle(parts, id, "文本分析");
    const lead = names.length ? `已检索到${names.map((name) => `「${clip(name, 16)}」`).join("、")}。` : "";
    return {
      title,
      question: `${lead}从${object}抽出${dv}。${guide.work}`.slice(0, 180),
      basis: names.length
        ? `用${guide.label}。对照${names.map((name) => `「${name}」`).join("、")}，看这些研究处理过什么文本，再落到你这份文本上。`
        : `用${guide.label}。按你写的文本和关键词整理。`,
      hitName: seed.hits[index]?.name ?? seed.hits[0]?.name ?? "",
      paradigm: "文本分析" as const,
      parts,
      alt: {
        object: unique([object, seed.subject.who.trim()].filter(Boolean)),
        iv: TEXT_PARADIGMS.map((item) => item.lens).filter((item) => item && item !== guide.lens).slice(0, 3),
        dv: words.filter((word) => word !== dv).slice(0, 3),
        mechanism: guide.cats.slice(0, 3),
      },
      pattern: id,
      source: "rules" as const,
    };
  });
}

function metaPlans(pool: string[], variant: number) {
  const words = pool.filter((word) => word.length >= 2);
  const outcomes = words.filter((word) => OUTCOME.test(word));
  const predictors = words.filter((word) => !OUTCOME.test(word));
  const cycle = [...outcomes, ...predictors];
  const blank = { object: "已发表研究", iv: "", dv: "", mechanism: "", method: "" };
  if (cycle.length < 2) {
    return [{ parts: { ...blank, iv: cycle[0] ?? "" }, pattern: "meta" }];
  }
  const dv = cycle[variant % cycle.length]!;
  const rest = cycle.filter((word) => word !== dv);
  const shift = Math.floor(variant / cycle.length) % rest.length;
  const others = [...rest.slice(shift), ...rest.slice(0, shift)];
  const a = others[0] ?? "";
  const b = others[1] ?? "";
  const c = others[2] ?? "";
  const plans: { parts: TopicParts; pattern: string }[] = [];
  if (a) plans.push({ parts: { ...blank, iv: a, dv, mechanism: b }, pattern: "meta" });
  if (c) plans.push({ parts: { ...blank, iv: c, dv }, pattern: "meta" });
  else if (b) plans.push({ parts: { ...blank, iv: b, dv }, pattern: "meta" });
  if (a && b) plans.push({ parts: { ...blank, iv: a, dv: b, mechanism: dv }, pattern: "meta" });
  return plans;
}

/** 模型出不来时用规则出 3 个题。三个题的变量组合和问法彼此不同；variant 换一种组合，用于「换一批」。 */
export function rulesCandidates(seed: TopicSeed, variant = 0): Candidate[] {
  if (seed.paradigm === "文本分析") return textCandidates(seed, variant);
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
  const fromLiterature = literaturePlans(seed, object, short, dv, method, variant);
  const plans: { parts: TopicParts; pattern: string; question?: string; hit?: TopicSeed["hits"][number] }[] =
    seed.paradigm === "元分析"
      ? metaPlans(pool, variant)
      : fromLiterature ??
    (seed.paradigm === "定量"
      ? [
          { parts: { object: method ? short : object, iv: a, dv, mechanism: b, method }, pattern: b ? "effect-med" : "effect" },
          { parts: { object, iv: b || a, dv, mechanism: c || (b ? a : ""), method: "" }, pattern: c || b ? "effect-mod" : "relation" },
          { parts: { object: method ? short : object, iv: c || a, dv, mechanism: c ? a : b, method }, pattern: "relation" },
        ]
      : [
          { parts: { object: method ? short : object, iv: a, dv, mechanism: b, method }, pattern: "q-shape" },
          { parts: { object, iv: b || a, dv, mechanism: "", method: "" }, pattern: "q-in" },
          { parts: { object: method ? short : object, iv: c || a, dv, mechanism: "", method }, pattern: "q-view" },
        ]);
  const seen = new Set<string>();
  const items: Candidate[] = [];
  plans.forEach((plan, index) => {
    let title = composeTitle(plan.parts, plan.pattern, seed.paradigm);
    if (seen.has(title)) {
      if (seed.paradigm === "元分析") return;
      plan.parts = { ...plan.parts, method: plan.parts.method ? "" : method };
      title = composeTitle(plan.parts, plan.pattern, seed.paradigm);
    }
    seen.add(title);
    const hit = plan.hit ?? seed.hits[index] ?? seed.hits[0];
    const names = seed.hits
      .slice(0, 3)
      .map((item) => item.name)
      .filter(Boolean);
    items.push({
      title,
      question: plan.question ?? makeQuestion(plan.parts, seed.paradigm, sentence),
      basis: names.length
        ? `对照检索结果${names.map((name) => `「${name}」`).join("、")}，从${index === 0 ? "方法" : index === 1 ? "变量" : "研究对象"}上找还没落到你这组对象上的缺口。`
        : "本轮没有可核对的检索条目，按你的关键词与研究对象组合。",
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
    if (topic.paradigm === "文本分析") return unique([topic.parts.method, ""]);
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
  const fullObject = topic.paradigm === "文本分析" ? textObject(subject) : titleObject(subject);
  if (fullObject && parts.object !== fullObject) {
    list.push({
      id: "object",
      label: topic.paradigm === "文本分析" ? "文本名称换成你写的" : "研究对象换成你写的限定写法",
      detail: `「${parts.object || "（空）"}」→「${fullObject}」`,
      parts: { ...parts, object: fullObject },
      pattern: topic.pattern,
    });
  }
  if (topic.paradigm === "文本分析") {
    for (const item of patternsFor("文本分析")) {
      if (item.id === current) continue;
      const guide = textParadigm(item.id);
      list.push({
        id: item.id,
        label: `改用${item.label}`,
        detail: guide.work,
        parts: { ...parts, iv: guide.lens, mechanism: "" },
        pattern: item.id,
      });
    }
    if (parts.method) list.push({ id: "short", label: "去掉副标题", detail: `删去「——${parts.method}」`, parts: { ...parts, method: "" }, pattern: topic.pattern });
    return list.slice(0, 5);
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
  if (new Set(filled).size < filled.length) problems.push("题目里的几项不能写成同一个词。");
  return { ok: problems.length === 0, problems, distance };
}

export function unique<T>(items: T[]) {
  return [...new Set(items)];
}
