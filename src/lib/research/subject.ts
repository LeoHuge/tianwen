import type { SubjectParts } from "./types";

export type SubjectSlot = {
  key: keyof SubjectParts;
  label: string;
  need: "must" | "one" | "optional";
  placeholder: string;
  hint: string;
};

/** 研究对象 = 在哪 + 年龄/年级/身份 + 状态/经历 + 是谁（+ 调查时间、不包括谁） */
export const SUBJECT_SLOTS: SubjectSlot[] = [
  {
    key: "where",
    label: "在哪",
    need: "must",
    placeholder: "杭州市城区社区",
    hint: "写到市、县区，或写清场所。不要写「中国」「全国」。",
  },
  {
    key: "who",
    label: "是谁",
    need: "must",
    placeholder: "老年人",
    hint: "只写人群名词。孤独感、满意度这类是要测的变量，放进关键词。",
  },
  {
    key: "stage",
    label: "年龄 / 年级 / 身份",
    need: "one",
    placeholder: "60 岁及以上",
    hint: "用能核对的界线：岁数、年级、工龄、职级。",
  },
  {
    key: "condition",
    label: "状态 / 经历",
    need: "one",
    placeholder: "独居半年以上",
    hint: "写成一道筛选题能判断的条件。",
  },
  {
    key: "time",
    label: "调查时间（选填）",
    need: "optional",
    placeholder: "2025 年 3–6 月",
    hint: "",
  },
  {
    key: "exclude",
    label: "不包括（选填）",
    need: "optional",
    placeholder: "失能卧床者",
    hint: "问卷会自动加一道排除题。",
  },
];

export const SUBJECT_EXAMPLES: { label: string; parts: SubjectParts }[] = [
  {
    label: "社区老人",
    parts: { where: "杭州市城区社区", who: "老年人", stage: "60 岁及以上", condition: "独居半年以上", time: "", exclude: "失能卧床者" },
  },
  {
    label: "大学生",
    parts: { where: "某省 3 所本科院校", who: "大学生", stage: "二、三年级", condition: "日均手机使用 4 小时以上", time: "", exclude: "" },
  },
  {
    label: "农民工",
    parts: { where: "珠三角制造业园区", who: "新生代农民工", stage: "1980 年后出生", condition: "外出务工 1 年以上", time: "", exclude: "" },
  },
];

export const SUBJECT_MISTAKES: { bad: string; why: string; good: string }[] = [
  { bad: "老年人", why: "没有地点和条件，没法判断谁该被调查。", good: "杭州市城区社区 60 岁及以上、独居半年以上的老年人" },
  {
    bad: "大学生的手机依赖",
    why: "手机依赖是要测的变量，不是对象。",
    good: "某省 3 所本科院校二、三年级的大学生（手机依赖放进关键词）",
  },
  { bad: "中国农民工", why: "范围大到无法抽样。", good: "珠三角制造业园区外出务工 1 年以上的新生代农民工" },
];

const VARIABLE_END = /(感|度|率|水平|意愿|行为|能力|素养|效能|满意|焦虑|抑郁|幸福|信任|认同|倦怠|影响|关系|状况|现状|依赖)$/;
const TOO_WIDE = /^(中国|全国|我国|国内|全球|世界|各地|各省|城乡)$/;
const BOUNDARY = /\d|年级|届|级|岁|以上|以下|之间|阶段|期|在职|在读|退休|新入职|一线|基层|初中|高中|本科|硕士|博士|专科/;

function t(value: string | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function isAscii(ch: string | undefined) {
  return Boolean(ch && /[0-9A-Za-z]/.test(ch));
}

/** 中文与数字、字母相接处加一个空格，和页面其它地方的写法一致。 */
function glue(left: string, right: string) {
  if (!left) return right;
  if (!right) return left;
  const a = left[left.length - 1];
  const b = right[0];
  return isAscii(a) !== isAscii(b) && a !== " " && b !== " " ? `${left} ${right}` : left + right;
}

export function subjectSentence(parts: SubjectParts, withTail = true) {
  const where = t(parts.where);
  const who = t(parts.who);
  const quals = [t(parts.stage), t(parts.condition)].filter(Boolean).join("、");
  if (!where && !who && !quals) return "";
  let sentence = where;
  if (quals) sentence = `${glue(sentence, quals)}的`;
  sentence = glue(sentence, who || "（是谁）");
  const tail = [t(parts.time) ? `调查时间 ${t(parts.time)}` : "", t(parts.exclude) ? `不包括${t(parts.exclude)}` : ""].filter(Boolean);
  return withTail && tail.length ? `${sentence}（${tail.join("；")}）` : sentence;
}

/** 人群加上一个短限定，例如「独居老年人」「独居半年以上的老年人」。太长的条件留给研究问题。 */
export function shortObject(parts: SubjectParts) {
  const who = t(parts.who);
  const condition = t(parts.condition);
  const stage = t(parts.stage);
  if (!who) return "";
  if (condition && condition.length <= 4 && !/\d/.test(condition)) return condition + who;
  if (condition && condition.length <= 8 && !/\d/.test(condition)) return `${condition}的${who}`;
  if (stage && stage.length <= 4 && !/\d|岁/.test(stage)) return stage + who;
  return who;
}

/** 放进题目的研究对象：地点加人群，短条件也带上。 */
export function titleObject(parts: SubjectParts) {
  const where = t(parts.where);
  const short = shortObject(parts);
  if (!short) return where;
  return glue(where, short);
}

export type SubjectCheck = {
  ok: boolean;
  sentence: string;
  missing: string[];
  problems: string[];
  warnings: string[];
  filled: Record<keyof SubjectParts, boolean>;
};

export function checkSubject(parts: SubjectParts): SubjectCheck {
  const where = t(parts.where);
  const who = t(parts.who);
  const stage = t(parts.stage);
  const condition = t(parts.condition);
  const missing: string[] = [];
  const problems: string[] = [];
  const warnings: string[] = [];
  if (!where) missing.push("在哪");
  if (!who) missing.push("是谁");
  if (!stage && !condition) missing.push("年龄/年级/身份，或状态/经历，至少写一个");
  if (where && TOO_WIDE.test(where)) problems.push(`「${where}」范围太大，抽不了样。写到省、市、县区，或写清场所。`);
  if (who && VARIABLE_END.test(who)) problems.push(`「${who}」像是要测的变量，不是人群。「是谁」只写人，例如「老年人」「外卖骑手」。`);
  if (who && (who.includes("的") || who.length > 10)) warnings.push("「是谁」只写人群名词，限定条件挪到「年龄/身份」和「状态/经历」两格。");
  if (stage && !BOUNDARY.test(stage)) warnings.push(`「${stage}」最好写成能核对的界线，例如「60 岁及以上」「二、三年级」「入职 1 年以上」。`);
  if (condition && condition.length < 2) warnings.push("「状态/经历」写得太短，筛选题判断不了。");
  return {
    ok: missing.length === 0 && problems.length === 0,
    sentence: subjectSentence(parts),
    missing,
    problems,
    warnings,
    filled: {
      where: Boolean(where),
      who: Boolean(who),
      stage: Boolean(stage),
      condition: Boolean(condition),
      time: Boolean(t(parts.time)),
      exclude: Boolean(t(parts.exclude)),
    },
  };
}

function placeVerb(unit: string) {
  if (/学校|班级/.test(unit)) return "就读";
  if (/企业|组织/.test(unit)) return "工作";
  if (/政策/.test(unit)) return "";
  return "居住";
}

/** 由研究对象的限定词直接生成问卷筛选题；任何一题不符合就结束作答。 */
export function screeningQuestions(parts: SubjectParts, unit: string) {
  const where = t(parts.where);
  const who = t(parts.who);
  const stage = t(parts.stage);
  const condition = t(parts.condition);
  const exclude = t(parts.exclude);
  const list: { text: string; stop: "否" | "是" }[] = [];
  const verb = placeVerb(unit);
  if (where) {
    list.push({
      text:
        verb === "居住"
          ? `${glue("您目前是否居住在", where)}？`
          : verb
            ? `${glue(glue("您目前是否在", where), verb)}？`
            : `${glue("您是否属于", where)}的${who || "研究对象"}？`,
      stop: "否",
    });
  }
  if (stage) {
    if (/岁|出生/.test(stage)) list.push({ text: `${glue(/出生/.test(stage) ? "您是否" : "您的年龄是否为", stage)}？`, stop: "否" });
    else if (/年级|本科|硕士|博士|专科|初中|高中/.test(stage))
      list.push({ text: `${glue("您目前是否为", stage)}${who && !stage.includes(who) ? `的${who}` : ""}？`, stop: "否" });
    else list.push({ text: `您是否符合「${stage}」这一条件？`, stop: "否" });
  }
  if (condition) list.push({ text: `${glue("您是否", condition)}？`, stop: "否" });
  if (exclude) list.push({ text: `您是否属于以下情况：${exclude}？`, stop: "是" });
  return list;
}

/** 访谈的纳入与排除标准，同样来自研究对象的几格。 */
export function interviewCriteria(parts: SubjectParts, unit: string) {
  const where = t(parts.where);
  const verb = placeVerb(unit);
  const include = [
    where ? (verb === "居住" ? `目前居住在${where}` : verb ? `目前在${where}${verb}` : `属于${where}`) : "",
    t(parts.stage),
    t(parts.condition),
    "能用普通话或当地方言完成约 1 小时的交谈",
    "了解研究目的后自愿参加",
  ].filter(Boolean);
  const exclude = [
    t(parts.exclude),
    "有认知或表达困难、无法完成访谈的人",
    "与访谈者有直接利害关系的人（例如访谈者自己的学生、下属、病人）",
  ].filter(Boolean);
  return { include, exclude };
}
