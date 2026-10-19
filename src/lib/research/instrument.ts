import { interviewCriteria, screeningQuestions } from "./subject";
import { effectivePattern } from "./topic-parts";
import type { SubjectParts, TopicParts } from "./types";

export type ItemKind = "likert" | "single" | "fill" | "open" | "main" | "note";

export type InstrumentItem = {
  code: string;
  text: string;
  kind: ItemKind;
  options?: string[];
  reverse?: boolean;
  probes?: string[];
  note?: string;
  check?: boolean;
};

export type SectionRole = "screen" | "basic" | "construct" | "closing" | "criteria" | "record" | "warmup" | "module";

export type InstrumentSection = {
  id: string;
  title: string;
  role: SectionRole;
  purpose: string;
  name?: string;
  variable?: string;
  varRole?: string;
  definition?: string;
  reference?: string;
  scale?: string;
  items: InstrumentItem[];
};

export type CodebookRow = { variable: string; name: string; items: string; coding: string };

export type Instrument = {
  kind: "scale" | "interview";
  title: string;
  intro: string;
  sections: InstrumentSection[];
  codebook: CodebookRow[];
  quality: string[];
  pilot: string[];
  analysis: string[];
  minutes: number;
  source: "rules" | "model";
  notes: string[];
};

export type InstrumentSeed = {
  kind: "scale" | "interview";
  title: string;
  question: string;
  parts: TopicParts;
  pattern: string;
  subject: SubjectParts;
  unit: string;
  discipline: string;
  keywords: string[];
};

export type AiConstruct = {
  name: string;
  role: string;
  definition: string;
  reference: string;
  items: { text: string; reverse: boolean }[];
};

export type AiModule = { name: string; purpose: string; questions: { text: string; probes: string[] }[] };

export type AiInstrumentPart = { kind: "scale"; constructs: AiConstruct[] } | { kind: "interview"; modules: AiModule[] };

export const LIKERT = ["非常不同意", "比较不同意", "一般", "比较同意", "非常同意"];
const LETTERS = "BCDEFGHIJK";
const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

type Entry = { match: RegExp; definition: string; reference: string; items: [string, boolean?][] };

// 题干均为自编，不抄录成熟量表原题；reference 只写可参考的量表方向，使用前须核对版本与授权。
const LIBRARY: Entry[] = [
  {
    match: /孤独|寂寞|社会隔离/,
    definition: "{who}主观上感到与他人联系不足、缺少陪伴和倾诉对象的程度。",
    reference: "UCLA 孤独感量表第 3 版（Russell, 1996）中文版【待核验版本与授权】",
    items: [
      ["最近一个月，我常常觉得心里的话没处可说。"],
      ["我觉得自己和周围人的来往越来越少。"],
      ["一个人待着的时候，我常常觉得冷清、空落。"],
      ["晚上或节假日，我常因为没人陪伴而难受。"],
      ["需要的时候，我身边有随时可以联系、愿意陪我的人。", true],
    ],
  },
  {
    match: /代际|子女支持|家庭支持|亲子/,
    definition: "子女或其他家庭成员在经济、照料和情感上给予{who}的支持。",
    reference: "代际支持常按经济、照料、情感三方面测量【待核验】",
    items: [
      ["子女（家人）经常和我联系、问我的情况。"],
      ["需要时，家人会在经济上帮我。"],
      ["我生病或行动不便时，家人能照顾我。"],
      ["家里做决定时，家人会听我的意见。"],
      ["我和家人之间很少交流。", true],
    ],
  },
  {
    match: /社会支持|社会网络|支持网络|邻里互助|互助/,
    definition: "{who}遇到困难时能从家人、朋友、邻里和组织那里得到的实际帮助与情感支持。",
    reference: "领悟社会支持量表（Zimet et al., 1988）或社会支持评定量表（肖水源, 1994）【待核验】",
    items: [
      ["遇到困难时，家人会主动帮我想办法。"],
      ["我生病或不方便时，有朋友或邻居能搭把手。"],
      ["我能从社区、单位或学校这类组织得到实际帮助。"],
      ["心里有事时，我能找到愿意听我说的人。"],
      ["碰到麻烦时，我基本只能靠自己。", true],
    ],
  },
  {
    match: /生活满意|满意度|幸福|主观福祉|获得感/,
    definition: "{who}对自己目前生活状况的总体评价和感受。",
    reference: "生活满意度量表 SWLS（Diener et al., 1985）中文版【待核验】",
    items: [
      ["总的来说，我对现在的生活感到满意。"],
      ["我目前的生活条件和我期望的差不多。"],
      ["回想过去一年，我觉得日子过得还不错。"],
      ["我对今后的生活有信心。"],
      ["我常常觉得自己的生活不如意。", true],
    ],
  },
  {
    match: /焦虑|紧张|担忧/,
    definition: "{who}最近一段时间感到紧张、担心、难以放松的频率和程度。",
    reference: "广泛性焦虑量表 GAD-7（Spitzer et al., 2006）中文版【待核验】",
    items: [
      ["最近两周，我经常感到紧张、放松不下来。"],
      ["我常为一些小事反复担心。"],
      ["我经常因为心里有事而睡不好。"],
      ["我常常觉得坐立不安。"],
      ["大多数时候，我的心情是平静的。", true],
    ],
  },
  {
    match: /抑郁|情绪低落|心理健康|心理状况/,
    definition: "{who}最近一段时间情绪低落、兴趣减退等心理状况的程度。",
    reference: "抑郁筛查建议直接使用 PHQ-9（Kroenke et al., 2001）中文版，不要用自编题替代【待核验】",
    items: [
      ["最近两周，我常常提不起兴致做事。"],
      ["我经常感到心情低落、闷闷不乐。"],
      ["我觉得做什么都没意思。"],
      ["我对以前喜欢的事情也不太感兴趣了。"],
      ["最近我的心情总体是愉快的。", true],
    ],
  },
  {
    match: /压力|负担|疲惫/,
    definition: "{who}感到要应付的事情超出自己能力、难以掌控的程度。",
    reference: "知觉压力量表 PSS（Cohen et al., 1983）中文版【待核验】",
    items: [
      ["最近一个月，我常觉得要做的事多得应付不过来。"],
      ["我常因为意料之外的事情而心烦。"],
      ["我觉得生活里重要的事情不在我的掌控之中。"],
      ["我常常感到紧绷、累。"],
      ["我觉得自己能处理好眼前的事情。", true],
    ],
  },
  {
    match: /信任/,
    definition: "{who}对周围的人和机构是否可靠、是否会善意对待自己的判断。",
    reference: "可参考一般信任与特殊信任的划分【待核验】",
    items: [
      ["我相信周围大多数人是可以信赖的。"],
      ["把东西托付给邻居或同事，我会放心。"],
      ["我遇到困难时，周围的人会愿意帮忙。"],
      ["我相信本地的公共服务机构会公平对待我。"],
      ["和人打交道时，我总担心被占便宜。", true],
    ],
  },
  {
    match: /参与|融入|志愿|公共事务/,
    definition: "{who}参加{place}集体活动、公共事务和互助活动的频率与主动程度。",
    reference: "社会参与常分为活动参与和决策参与两方面【待核验】",
    items: [
      ["我经常参加{place}组织的集体活动。"],
      ["我会主动对{place}的公共事务提意见。"],
      ["我愿意花时间参加志愿或互助活动。"],
      ["我和{place}里的其他人来往较多。"],
      ["{place}的公共活动我基本都不参加。", true],
    ],
  },
  {
    match: /归属|认同|身份/,
    definition: "{who}觉得自己属于{place}、愿意留在其中的程度。",
    reference: "可参考社区（组织）认同的情感与行为两方面【待核验】",
    items: [
      ["我觉得自己是{place}的一员。"],
      ["别人说{place}不好时，我会觉得像在说我。"],
      ["如果要离开{place}，我会感到不舍。"],
      ["我愿意长期留在{place}。"],
      ["在{place}里，我常常有局外人的感觉。", true],
    ],
  },
  {
    match: /手机依赖|成瘾|沉迷|短视频|刷手机|游戏/,
    definition: "{who}使用{x}超出自己预期、难以控制并影响日常生活的程度。",
    reference: "手机成瘾倾向量表 MPATS（熊婕等, 2012）【待核验】",
    items: [
      ["我每天花在{x}上的时间比计划的多。"],
      ["一段时间不碰{x}，我会感到不安。"],
      ["我曾因为{x}耽误了该做的事。"],
      ["我试过少用{x}，但没有做到。"],
      ["我能很好地控制自己用{x}的时间。", true],
    ],
  },
  {
    match: /数字|智能|信息素养|互联网|网络使用|数字鸿沟/,
    definition: "{who}使用手机和网络完成日常事务、获取和辨别信息的能力。",
    reference: "数字素养常按操作、信息、沟通、安全四方面测量【待核验】",
    items: [
      ["我能独立用手机完成挂号、缴费这类线上事务。"],
      ["遇到新的手机应用，我能自己摸索学会。"],
      ["我能分辨网上的信息是不是可靠。"],
      ["我能用手机和家人朋友视频或发消息。"],
      ["用手机办事时，我经常需要别人帮忙。", true],
    ],
  },
  {
    match: /学习投入|学业投入|学习动机|学习/,
    definition: "{who}在学习中的专注、坚持与投入程度。",
    reference: "UWES-S 学习投入量表（Schaufeli et al., 2002）中文版【待核验】",
    items: [
      ["学习时，我能长时间集中注意力。"],
      ["我会主动完成课程以外的拓展学习。"],
      ["遇到难题时，我会坚持钻研而不是放弃。"],
      ["学习让我感到充实、有劲头。"],
      ["我经常只是应付学习任务。", true],
    ],
  },
  {
    match: /倦怠|耗竭/,
    definition: "{who}因长期工作压力出现的精力耗竭、冷漠和成就感降低。",
    reference: "MBI-GS 职业倦怠量表（Schaufeli et al., 1996）中文版【待核验授权】",
    items: [
      ["下班时我常常觉得精疲力竭。"],
      ["想到第二天还要上班，我就提不起精神。"],
      ["我对工作越来越冷淡，不太在乎结果。"],
      ["我觉得自己的工作没有多大价值。"],
      ["我在工作中仍然很有干劲。", true],
    ],
  },
  {
    match: /工作满意|职业满意|就业质量/,
    definition: "{who}对目前工作的收入、时间、环境和发展的总体评价。",
    reference: "工作满意度常分内在满意与外在满意两方面【待核验】",
    items: [
      ["总体来说，我对现在的工作感到满意。"],
      ["我对目前的收入感到满意。"],
      ["我对工作时间的安排感到满意。"],
      ["我觉得这份工作有发展空间。"],
      ["如果有机会，我会马上换一份工作。", true],
    ],
  },
  {
    match: /自我效能|效能感|自信/,
    definition: "{who}相信自己能应付困难、完成目标的程度。",
    reference: "一般自我效能感量表 GSES（Schwarzer & Jerusalem, 1995）中文版【待核验】",
    items: [
      ["只要努力，我通常能解决碰到的难题。"],
      ["遇到突发情况，我相信自己能应付。"],
      ["我能按计划完成给自己定的目标。"],
      ["我相信自己有能力把事情做好。"],
      ["遇到挫折时，我很容易怀疑自己的能力。", true],
    ],
  },
  {
    match: /安全感|安全/,
    definition: "{who}在与「{x}」有关的情境中感到安全、不担心受到侵害的程度。",
    reference: "公共空间安全感常分感知与行为两方面【待核验】",
    items: [
      ["在与{x}有关的情境里，我觉得自己是安全的。"],
      ["我很少担心在这类情境里遇到危险。"],
      ["遇到危险时，我知道可以向谁求助。"],
      ["总体来说，我对这类情境的安全情况放心。"],
      ["我会因为担心安全而改变自己的安排。", true],
    ],
  },
  {
    match: /健康|身体|睡眠/,
    definition: "{who}对自身身体状况和日常精力的评价。",
    reference: "自评健康常用单题；多维测量可参考 SF-12（须授权）【待核验】",
    items: [
      ["我觉得自己目前的身体状况不错。"],
      ["我有足够的精力应付日常生活。"],
      ["我的睡眠质量较好。"],
      ["过去一个月，我很少因为身体不适而耽误事情。"],
      ["身体问题经常影响我的日常活动。", true],
    ],
  },
];

const USAGE = /使用|利用|接触|服务|食堂|驿站|公交|地铁|平台|应用|微信|直播|网课|课程|活动|政策|项目|补贴|医保|社保|助餐|养老/;

type ConstructSpec = {
  name: string;
  code: string;
  role: string;
  definition: string;
  reference: string;
  items: { text: string; reverse: boolean; kind?: ItemKind; options?: string[] }[];
  templated: boolean;
  fromModel: boolean;
};

function who(seed: InstrumentSeed) {
  return seed.subject.who.trim() || "受访者";
}

function placeOf(unit: string) {
  if (/学校|班级/.test(unit)) return "所在学校";
  if (/企业|组织/.test(unit)) return "所在单位";
  if (/家庭/.test(unit)) return "家里";
  if (/村/.test(unit)) return "本村";
  return "所在社区";
}

function fill(text: string, seed: InstrumentSeed, name: string) {
  return text.replaceAll("{who}", who(seed)).replaceAll("{place}", placeOf(seed.unit)).replaceAll("{x}", name);
}

function libraryConstruct(name: string, code: string, role: string, seed: InstrumentSeed): ConstructSpec {
  const entry = LIBRARY.find((item) => item.match.test(name));
  if (entry) {
    return {
      name,
      code,
      role,
      definition: fill(entry.definition, seed, name),
      reference: entry.reference,
      items: entry.items.map(([text, reverse]) => ({ text: fill(text, seed, name), reverse: Boolean(reverse) })),
      templated: false,
      fromModel: false,
    };
  }
  if (USAGE.test(name)) {
    return {
      name,
      code,
      role,
      definition: `${who(seed)}接触和使用「${name}」的频率、了解程度和使用体验。`,
      reference: "使用频率可用次数题直接测量；使用体验可参考服务质量或使用满意度量表【待核验】",
      items: [
        { text: `过去一个月，您大约用过几次「${name}」？`, reverse: false, kind: "single", options: ["0 次", "1–3 次", "4–8 次", "9 次及以上"] },
        { text: `我对「${name}」能提供什么比较了解。`, reverse: false },
        { text: `对我来说，用「${name}」很方便。`, reverse: false },
        { text: `我对「${name}」总体上感到满意。`, reverse: false },
        { text: `我会向身边的人推荐「${name}」。`, reverse: false },
        { text: `如果可以选，我会尽量不用「${name}」。`, reverse: true },
      ],
      templated: false,
      fromModel: false,
    };
  }
  return {
    name,
    code,
    role,
    definition: `「${name}」在本研究中指${who(seed)}在这方面的经历、感受和程度。正式发放前请写成能观察的具体行为或感受。`,
    reference: "建议到知网检索「" + name + " 量表」，优先用有信效度报告的成熟量表【待核验】",
    items: [
      { text: `过去一个月，我经常遇到和「${name}」有关的情况。`, reverse: false },
      { text: `「${name}」对我的日常生活有明显影响。`, reverse: false },
      { text: `和身边的人相比，我在「${name}」上的感受更强烈。`, reverse: false },
      { text: `我能清楚地说出自己在「${name}」方面的状况。`, reverse: false },
      { text: `我很少注意到「${name}」这件事。`, reverse: true },
    ],
    templated: true,
    fromModel: false,
  };
}

function scaleVariables(seed: InstrumentSeed) {
  const p = seed.parts;
  const list: { name: string; code: string; role: string }[] = [];
  const moderator = effectivePattern(seed.pattern, seed.title) === "effect-mod";
  if (p.iv.trim()) list.push({ name: p.iv.trim(), code: "X", role: "自变量" });
  if (p.mechanism.trim()) list.push({ name: p.mechanism.trim(), code: moderator ? "W" : "M", role: moderator ? "调节变量" : "中介变量" });
  if (p.dv.trim()) list.push({ name: p.dv.trim(), code: "Y", role: "因变量" });
  const subjectText = Object.values(seed.subject).join("");
  for (const word of seed.keywords.map((item) => item.trim())) {
    if (list.length >= 2) break;
    if (word.length < 2 || subjectText.includes(word) || list.some((item) => item.name === word)) continue;
    list.push({ name: word, code: list.some((item) => item.code === "X") ? "Z" : "X", role: list.some((item) => item.code === "X") ? "其他变量" : "自变量" });
  }
  return list.filter((item, index) => list.findIndex((other) => other.name === item.name) === index);
}

function bigramOverlap(a: string, b: string) {
  const grams = (text: string) => {
    const chars = [...text];
    return new Set(chars.slice(0, -1).map((ch, index) => ch + chars[index + 1]));
  };
  const x = grams(a);
  const y = grams(b);
  if (!x.size || !y.size) return 0;
  let hit = 0;
  for (const gram of x) if (y.has(gram)) hit += 1;
  return hit / Math.min(x.size, y.size);
}

/** 只按名称对上模型写的构念；名称对不上就用构念库，不按角色硬配，免得题项挂错变量。 */
function aiFor(variable: { name: string }, constructs: AiConstruct[]) {
  const name = variable.name.trim();
  return (
    constructs.find((item) => item.name.trim() === name) ??
    constructs.find((item) => item.name.includes(name) || name.includes(item.name.trim())) ??
    constructs.find((item) => bigramOverlap(item.name.trim(), name) >= 0.5)
  );
}

export function buildInstrument(seed: InstrumentSeed, ai?: AiInstrumentPart | null): Instrument {
  if (seed.kind === "interview") {
    const modules = ai && ai.kind === "interview" && ai.modules.length >= 2 ? ai.modules : ruleModules(seed);
    return assembleInterview(seed, modules, ai && ai.kind === "interview" && ai.modules.length >= 2 ? "model" : "rules");
  }
  const constructs = ai && ai.kind === "scale" ? ai.constructs : [];
  const specs = scaleVariables(seed).map((variable) => {
    const fromAi = constructs.length ? aiFor(variable, constructs) : undefined;
    const usable = fromAi ? fromAi.items.filter((item) => item.text.trim().length >= 6) : [];
    if (fromAi && usable.length >= 3) {
      const base = libraryConstruct(variable.name, variable.code, variable.role, seed);
      return {
        ...base,
        definition: fromAi.definition.trim() || base.definition,
        reference: fromAi.reference.trim() || base.reference,
        items: usable.slice(0, 8).map((item) => ({ text: item.text.trim(), reverse: item.reverse })),
        templated: false,
        fromModel: true,
      } satisfies ConstructSpec;
    }
    return libraryConstruct(variable.name, variable.code, variable.role, seed);
  });
  return assembleScale(seed, specs, specs.some((spec) => spec.fromModel) ? "model" : "rules");
}

function basicItems(seed: InstrumentSeed): InstrumentItem[] {
  const text = `${seed.subject.who}${seed.subject.stage}${seed.subject.condition}`;
  const elder = /老|退休|60\s*岁|65\s*岁|高龄/.test(text);
  const student = /学生|本科|研究生|高职|中职|中学|小学|初中|高中|年级|在读/.test(text);
  const worker = /工人|员工|职工|骑手|司机|教师|医生|护士|女工|农民工|劳动者|从业|职员|干部|社工|快递|外卖|保安|保洁/.test(text);
  const rows: Omit<InstrumentItem, "code">[] = [{ text: "您的性别", kind: "single", options: ["男", "女"] }];
  if (student) {
    rows.push(
      { text: "您目前就读的年级", kind: "single", options: ["一年级", "二年级", "三年级", "四年级及以上"] },
      { text: "您的专业类别", kind: "single", options: ["人文社科", "理工", "医学", "农林", "艺术体育", "其他"] },
      { text: "入学前，您的户籍所在地", kind: "single", options: ["城市", "县城或乡镇", "农村"] },
      { text: "您是否为独生子女", kind: "single", options: ["是", "否"] },
      { text: "您每月的生活费大约是", kind: "single", options: ["1000 元以下", "1000–1999 元", "2000–2999 元", "3000 元及以上", "不愿回答"] },
    );
  } else {
    rows.push(
      { text: "您的年龄", kind: "fill", note: "____ 周岁（填整数）" },
      { text: "您的最高学历", kind: "single", options: ["小学及以下", "初中", "高中、中专或技校", "大专", "本科", "研究生及以上"] },
      { text: "您目前的婚姻状况", kind: "single", options: ["未婚", "已婚（有配偶）", "离异", "丧偶"] },
    );
    if (elder) {
      rows.push(
        { text: "您目前和谁一起住", kind: "single", options: ["独居", "只和配偶同住", "和子女同住", "其他"] },
        { text: "您觉得自己目前的身体状况", kind: "single", options: ["很差", "比较差", "一般", "比较好", "很好"] },
        { text: "您每月的收入（含养老金）大约是", kind: "single", options: ["2000 元以下", "2000–3999 元", "4000–5999 元", "6000 元及以上", "不愿回答"] },
      );
    } else if (worker) {
      rows.push(
        { text: "您在目前这份工作上干了多久", kind: "fill", note: "____ 年（不满一年填 0）" },
        { text: "您平均每周工作多少小时", kind: "fill", note: "____ 小时" },
        { text: "您每月的税后收入大约是", kind: "single", options: ["3000 元以下", "3000–4999 元", "5000–7999 元", "8000 元及以上", "不愿回答"] },
      );
    } else {
      rows.push(
        { text: "您目前的就业状况", kind: "single", options: ["全职工作", "兼职或灵活就业", "离退休", "在校学习", "没有工作"] },
        { text: "您家人均月收入大约是", kind: "single", options: ["2000 元以下", "2000–4999 元", "5000–7999 元", "8000 元及以上", "不愿回答"] },
      );
    }
    rows.push({ text: "您的户口类型", kind: "single", options: ["本地城镇", "本地农业", "外地城镇", "外地农业"] });
  }
  return rows.map((row, index) => ({ ...row, code: `A${index + 1}` }));
}

function assembleScale(seed: InstrumentSeed, specs: ConstructSpec[], source: "rules" | "model"): Instrument {
  const sections: InstrumentSection[] = [];
  const screen = screeningQuestions(seed.subject, seed.unit);
  sections.push({
    id: "S",
    title: "第一部分 筛选题",
    role: "screen",
    purpose: "确认受访者属于研究对象。题目直接来自研究对象的限定词，任何一题不符合就结束作答，不计入有效问卷。",
    items: screen.map((item, index) => ({
      code: `S${index + 1}`,
      text: item.text,
      kind: "single",
      options: ["是", "否"],
      note: `选「${item.stop}」结束作答`,
    })),
  });
  const basic = basicItems(seed);
  sections.push({
    id: "A",
    title: "第二部分 基本信息",
    role: "basic",
    purpose: "作为控制变量和样本描述。收入等敏感题给「不愿回答」，录入时记为缺失。",
    items: basic,
  });
  specs.forEach((spec, index) => {
    const letter = LETTERS[index] ?? "Z";
    const items: InstrumentItem[] = spec.items.map((item) => ({
      code: "",
      text: item.text,
      kind: item.kind ?? "likert",
      options: item.kind === "single" ? item.options : undefined,
      reverse: item.reverse,
    }));
    if (index === Math.min(1, specs.length - 1)) {
      items.splice(Math.min(3, items.length), 0, {
        code: "",
        text: "本题用来确认您在认真作答，请直接选「比较同意」。",
        kind: "likert",
        check: true,
        note: "注意力检测题，不计分",
      });
    }
    items.forEach((item, itemIndex) => {
      item.code = `${letter}${itemIndex + 1}`;
    });
    sections.push({
      id: letter,
      title: `第${CN_NUM[index + 2] ?? index + 3}部分 ${spec.name}`,
      role: "construct",
      purpose: `${spec.role}（${spec.code}）。${spec.templated ? "这个构念不在常见构念库里，下面是通用模板题，正式发放前请按操作化定义改写，或换成成熟量表。" : ""}`,
      name: spec.name,
      variable: spec.code,
      varRole: spec.role,
      definition: spec.definition,
      reference: spec.reference,
      scale: "1 = 非常不同意，2 = 比较不同意，3 = 一般，4 = 比较同意，5 = 非常同意。标「反向」的题录入时换算为 6 − 原始分。",
      items,
    });
  });
  const closingLetter = LETTERS[specs.length] ?? "Z";
  sections.push({
    id: closingLetter,
    title: `第${CN_NUM[specs.length + 2] ?? specs.length + 3}部分 结束`,
    role: "closing",
    purpose: "开放题可以不答。",
    items: [
      { code: `${closingLetter}1`, text: "关于以上问题，您还有什么想补充的？（选填）", kind: "open" },
      { code: "", text: "问卷到此结束，再次感谢您的支持！", kind: "note" },
    ],
  });

  const likertCount = specs.reduce((sum, spec) => sum + spec.items.filter((item) => (item.kind ?? "likert") === "likert").length, 0);
  const otherCount = screen.length + basic.length + specs.reduce((sum, spec) => sum + spec.items.filter((item) => item.kind === "single").length, 0);
  const minutes = Math.max(5, Math.ceil((likertCount * 7 + otherCount * 9 + 60) / 60));
  const titleMain = seed.title.split("——")[0] ?? seed.title;
  const student = /学生|本科|年级|在读/.test(seed.subject.who + seed.subject.stage);
  const intro = [
    `${student ? "亲爱的同学" : "尊敬的受访者"}：`,
    `您好！我们是${seed.discipline || "社会科学"}方向的研究者，正在开展一项关于「${titleMain}」的调查，想了解${seed.subject.who.trim() || "大家"}在${
      seed.parts.dv.trim() || "相关方面"
    }等方面的真实情况。`,
    `问卷大约需要 ${minutes} 分钟。答案没有对错之分，请按您的实际情况作答。`,
    "本问卷匿名填写，不收集姓名、电话、身份证号和精确住址。所有回答只以汇总形式用于学术研究，不会单独呈现任何一个人的答案。您可以跳过任何一题，也可以随时退出。",
    "如有疑问，请联系：________（研究者姓名、单位、邮箱）。",
    "感谢您的支持！",
  ].join("\n");

  const constructSections = sections.filter((section) => section.role === "construct");
  const codebook: CodebookRow[] = [
    {
      variable: "S",
      name: "筛选",
      items: screen.length ? `S1–S${screen.length}` : "—",
      coding: "是 = 1，否 = 0。任何一题不符合即终止，不计入有效样本。",
    },
    {
      variable: "C",
      name: "控制变量（基本信息）",
      items: `A1–A${basic.length}`,
      coding: "单选题按选项顺序编 1、2、3…；填空题录原数；「不愿回答」记为缺失。",
    },
    ...constructSections.map((section) => {
      const scored = section.items.filter((item) => !item.check && item.kind === "likert");
      const reversed = scored.filter((item) => item.reverse).map((item) => item.code);
      const counts = section.items.filter((item) => item.kind === "single" && !item.check).map((item) => item.code);
      return {
        variable: section.variable ?? "",
        name: `${section.name}（${section.varRole}）`,
        items: section.items.length ? `${section.items[0]!.code}–${section.items[section.items.length - 1]!.code}` : "—",
        coding: `${scored.length} 道李克特题，1–5 分${reversed.length ? `；${reversed.join("、")} 反向计分（6 − 原始分）` : ""}；取均值作为该变量得分${
          counts.length ? `。${counts.join("、")} 是次数题，单独作为使用频率` : ""
        }。`,
      };
    }),
    {
      variable: "—",
      name: "注意力检测",
      items: constructSections.flatMap((section) => section.items.filter((item) => item.check).map((item) => item.code)).join("、") || "—",
      coding: "选「比较同意」= 通过；选其他 = 剔除。不计入任何变量。",
    },
  ];

  const hasMed = specs.some((spec) => spec.code === "M");
  const hasMod = specs.some((spec) => spec.code === "W");
  const x = specs.find((spec) => spec.code === "X");
  const y = specs.find((spec) => spec.code === "Y");
  const analysis = [
    "信度：每个量表报告 Cronbach's α，0.70 以上可以接受（Nunnally, 1978）。",
    "结构效度：探索性因子分析，KMO 不低于 0.60、Bartlett 球形检验 p < 0.05 才适合做（Kaiser, 1974）；如再做验证性因子分析，报告 χ²/df、CFI、TLI、RMSEA、SRMR。",
    "共同方法偏差：全部题项做 Harman 单因素检验，第一个因子解释的方差不宜超过 40%。",
    "描述统计和相关分析：各变量的均值、标准差和两两相关。",
    `主分析：以 Y（${y?.name ?? "因变量"}）为因变量、X（${x?.name ?? "自变量"}）为自变量，控制第二部分的基本信息，做多元线性回归。`,
    ...(hasMed ? ["中介：用 Bootstrap 法检验 X → M → Y 的间接效应（重复抽样 5000 次，看 95% 置信区间是否包含 0），可用 SPSS 的 PROCESS 插件 Model 4。"] : []),
    ...(hasMod ? ["调节：变量先中心化，再放入 X × W 交互项，可用 PROCESS 插件 Model 1；交互项显著时做简单斜率分析。"] : []),
    "横截面问卷只能说明变量之间的关联，写结论时不要写成确定的因果。",
  ];

  const quality = [
    "筛选题任何一题不符合的，不计入有效问卷。",
    "注意力检测题没选「比较同意」的，剔除。",
    "作答时间过短的剔除：先用预调查算出中位作答时长，短于中位时长三分之一的视为无效（网络问卷后台可直接看到作答时长）。",
    "连续 10 题以上选同一个选项（直线作答）的，剔除。",
    "反向题和同一量表的正向题明显矛盾（例如都选「非常同意」）的，标记后复核。",
    "网络问卷限制同一设备、同一账号只能作答一次。",
    "剔除之后的有效问卷数，要达到下方样本量计算书里的「有效样本」。",
  ];

  const pilot = [
    "正式发放前先做预调查，约 30 人（Johanson & Brooks, 2010），预调查的问卷不计入正式样本。",
    "看三件事：每个量表的 Cronbach's α 是否达到 0.70；校正的题项—总分相关是否达到 0.30，低于的题考虑删改；受访者有没有看不懂的题，看不懂就改措辞。",
    "记下预调查的作答时长和剔除比例，用来替换样本量计算书里的「预计无效率」。",
  ];

  const notes: string[] = [];
  if (!screen.length) notes.push("研究对象没写限定词，筛选题为空。回到第一步把「在哪」「是谁」和至少一个限定写上。");
  if (specs.some((spec) => spec.templated)) notes.push("带「通用模板题」说明的部分，正式发放前必须改写。");
  if (specs.some((spec) => spec.reference.includes("授权"))) notes.push("参考了商业或有版权的量表时，先取得授权再发放。");

  return {
    kind: "scale",
    title: seed.title,
    intro,
    sections,
    codebook,
    quality,
    pilot,
    analysis,
    minutes,
    source,
    notes,
  };
}

function ruleModules(seed: InstrumentSeed): AiModule[] {
  const p = seed.parts;
  const subjectText = Object.values(seed.subject).join("");
  const extra = seed.keywords.map((word) => word.trim()).filter((word) => word.length >= 2 && !subjectText.includes(word));
  const iv = p.iv.trim() || extra[0] || "这件事";
  const dv = p.dv.trim() || extra[1] || extra[0] || "这方面的感受";
  const mech = p.mechanism.trim();
  const place = placeOf(seed.unit);
  return [
    {
      name: `「${iv}」的具体经历`,
      purpose: `弄清${who(seed)}在「${iv}」上实际遇到过什么、怎么做的。`,
      questions: [
        {
          text: `请回想最近一次和「${iv}」有关的经历，当时是什么情况？`,
          probes: ["那是什么时候、在什么地方？还有谁在场？", "您当时是怎么做的？为什么这么做？", "后来怎么样了？"],
        },
        {
          text: `在「${iv}」这件事上，您遇到过最麻烦的一次是什么？`,
          probes: ["您是怎么应对的？有谁帮过您？", "这件事之后，您的做法有没有变化？"],
        },
        {
          text: `和刚开始相比，您在「${iv}」上有什么变化？`,
          probes: ["是从什么时候开始变的？", "是什么带来了这个变化？"],
        },
      ],
    },
    {
      name: `「${dv}」的感受和理解`,
      purpose: `弄清「${dv}」在受访者那里具体是什么样子，用他们自己的话怎么说。`,
      questions: [
        {
          text: `说到「${dv}」，您最先想到的是哪一件具体的事？`,
          probes: ["当时您是什么感受？现在回头看呢？", "这种情况多不多？一般在什么时候出现？"],
        },
        {
          text: `在「${dv}」上，您身边的人（家人、同事、邻居）和您一样吗？`,
          probes: ["他们是怎么说、怎么做的？", "您怎么看这种差别？"],
        },
        {
          text: `有没有哪段时间，您在「${dv}」上的感受明显变好或变差？`,
          probes: ["那段时间发生了什么？", "您做了什么，或者别人做了什么？"],
        },
      ],
    },
    {
      name: `「${iv}」和「${dv}」怎样连在一起`,
      purpose: `找出两者之间经过了哪些人、事和环节${mech ? `，以及「${mech}」的作用` : ""}。`,
      questions: [
        {
          text: `在您的经历里，「${iv}」和「${dv}」之间有没有联系？能举个例子吗？`,
          probes: ["这个联系是怎么发生的？中间经过了哪些人或事？", mech ? `「${mech}」在里面起了什么作用？` : "有没有例外的时候？"],
        },
        {
          text: `有没有哪一次，「${iv}」的情况和平时不一样？那次您在「${dv}」上有什么不同？`,
          probes: ["那次具体是怎么回事？", "您是怎么察觉到这种不同的？"],
        },
        ...(mech
          ? [
              {
                text: `请讲一次「${mech}」实际发生的经过。`,
                probes: ["当时有谁、在哪里、做了什么？", "这之后，您在「" + dv + "」上有没有变化？"],
              },
            ]
          : []),
      ],
    },
    {
      name: `${place}里的人和规则`,
      purpose: "找出环境里帮忙或添堵的人、机构和规定。",
      questions: [
        {
          text: `在${place}，哪些人或机构在这件事上帮过您，或者给您添过麻烦？`,
          probes: ["具体是怎么帮的、怎么添麻烦的？", "您是怎么找到他们的？"],
        },
        {
          text: `${place}有没有一些规定或惯例，影响了您在这件事上的做法？`,
          probes: ["能举一个例子吗？", "您是怎么应对这些规定的？"],
        },
      ],
    },
  ];
}

function assembleInterview(seed: InstrumentSeed, modules: AiModule[], source: "rules" | "model"): Instrument {
  const criteria = interviewCriteria(seed.subject, seed.unit);
  const place = placeOf(seed.unit);
  const titleMain = seed.title.split("——")[0] ?? seed.title;
  const condition = seed.subject.condition.trim();
  const sections: InstrumentSection[] = [
    {
      id: "R",
      title: "一、受访者筛选与抽样",
      role: "criteria",
      purpose: "纳入和排除标准直接来自研究对象的限定词。",
      items: [
        { code: "", kind: "note", text: `纳入标准：${criteria.include.join("；")}。` },
        { code: "", kind: "note", text: `排除标准：${criteria.exclude.join("；")}。` },
        {
          code: "",
          kind: "note",
          text: `抽样方式：目的抽样。在符合纳入标准的人里，尽量在年龄、性别${
            condition ? `以及「${condition}」的具体情况（持续多久、多频繁）` : "以及相关经历的长短"
          }上拉开差异（最大差异抽样），不要只访谈最容易约到的人。`,
        },
        {
          code: "",
          kind: "note",
          text: `进入途径：通过${place}的工作人员、社工、老师或熟人介绍；必要时请受访者再介绍合适的人（滚雪球），在记录里注明每位受访者从哪条线进来。`,
        },
        { code: "", kind: "note", text: "访谈人数：见下方样本量计算书（每个亚群体按 10+3 饱和停止规则）。" },
      ],
    },
    {
      id: "D",
      title: "二、受访者信息登记（访谈前填写，和录音、转写稿分开保存）",
      role: "record",
      purpose: "只登记分析要用的信息，不写真名。",
      items: [
        { code: "D1", kind: "fill", text: "受访者编号", note: "____（如 F01，不写真名）" },
        { code: "D2", kind: "single", text: "性别", options: ["男", "女"] },
        { code: "D3", kind: "fill", text: "年龄", note: "____ 岁" },
        { code: "D4", kind: "fill", text: "受教育程度", note: "____" },
        ...(condition ? [{ code: "D5", kind: "fill" as const, text: `与「${condition}」有关的情况`, note: "____（如持续多久）" }] : []),
        { code: condition ? "D6" : "D5", kind: "fill", text: "访谈日期、地点、时长", note: "____" },
        { code: condition ? "D7" : "D6", kind: "single", text: "是否同意录音", options: ["同意", "不同意（只做笔记）"] },
      ],
    },
    {
      id: "W",
      title: "三、开场（约 5 分钟）",
      role: "warmup",
      purpose: "让受访者放松，先说熟悉的日常。",
      items: [
        {
          code: "W1",
          kind: "main",
          text: "请先简单介绍一下您自己，平时一天大概是怎么过的？",
          probes: ["一般几点起床、几点休息？", "一天里最忙和最空的是什么时候？"],
        },
        {
          code: "W2",
          kind: "main",
          text: seed.subject.where.trim() ? `您在${seed.subject.where.trim()}多久了？当初是怎么来的？` : "您在现在的地方多久了？当初是怎么来的？",
          probes: ["来之前和来之后，生活有什么不一样？"],
        },
      ],
    },
    ...modules.map((module, index) => ({
      id: `M${index + 1}`,
      title: `${CN_NUM[index + 3] ?? index + 4}、模块${CN_NUM[index] ?? index + 1}：${module.name}`,
      role: "module" as const,
      purpose: module.purpose,
      items: module.questions.map((question, qIndex) => ({
        code: `M${index + 1}-${qIndex + 1}`,
        kind: "main" as const,
        text: question.text,
        probes: question.probes,
      })),
    })),
    {
      id: "E",
      title: `${CN_NUM[modules.length + 3] ?? modules.length + 4}、收尾`,
      role: "closing",
      purpose: "补漏，并约定能否回访。",
      items: [
        { code: "E1", kind: "main", text: "关于今天聊的这些，还有什么我没问到、但您觉得很重要的吗？" },
        { code: "E2", kind: "single", text: "之后整理时如果需要补充核实，可以再联系您吗？", options: ["可以", "不可以"] },
        { code: "", kind: "note", text: "谢谢您的时间。访谈到此结束。" },
      ],
    },
  ];

  const intro = [
    `您好！我是${seed.discipline || "社会科学"}方向的研究者，正在做一项关于「${titleMain}」的研究，想听听您在这方面的真实经历。`,
    "访谈大约 45–60 分钟。您说的内容只用于研究，文中会用编号代替您的名字，不会写出您的单位和住址。",
    "您可以不回答任何一个问题，也可以随时停下来。为了记得准确，我想录音，可以吗？（同意 / 不同意；不同意就只做笔记）",
  ].join("\n");

  const codebook: CodebookRow[] = [
    ...modules.map((module, index) => ({
      variable: `模块${CN_NUM[index] ?? index + 1}`,
      name: module.name,
      items: `M${index + 1}-1～M${index + 1}-${module.questions.length}`,
      coding: "开放编码：标出具体事件、当时的做法、感受和转折点；同一意思的片段归到同一个码。",
    })),
    {
      variable: "主题",
      name: "归并与命名",
      items: "全部转写稿",
      coding: "按主题分析（Braun & Clarke, 2006）把码归并成主题；或按扎根理论做开放、主轴、选择性编码。两条路径选一条，在方法部分写清。",
    },
  ];

  return {
    kind: "interview",
    title: seed.title,
    intro,
    sections,
    codebook,
    quality: [
      "访谈前取得知情同意；录音必须征得同意，不同意就只做笔记。",
      "每次访谈后 24 小时内写访谈记录：时间、地点、在场的人、非语言信息、初步印象、需要追问的线索。",
      "录音逐字转写；转写稿删去姓名、单位、地址等能认出人的信息，名册和转写稿分开保存。",
      "至少 20% 的转写稿由两个人分别编码，比较差异、讨论统一，并记下编码规则的修改。",
      "访谈者不评价、不暗示「正确答案」；追问只问具体事实：什么时候、在哪里、有谁、怎么做的。",
      "边访谈边分析，按样本量计算书里的 10+3 规则判断什么时候停。",
    ],
    pilot: [
      "正式访谈前先做 1–2 个预访谈，看问题听不听得懂、顺序自然不自然、时长合不合适，然后改提纲。",
      "预访谈质量足够、提纲改动不大的，可以说明后计入正式样本；改动大的不计入。",
    ],
    analysis: [
      "转写 → 反复读材料 → 开放编码 → 归并成主题 → 回到原始材料核对主题 → 定义和命名主题 → 写作（Braun & Clarke, 2006 的六个步骤）。",
      "用 NVivo 或 MAXQDA 管理编码，软件只负责存放和检索，不产生结论。",
      "写作时用化名或编号引用原话，每个主题至少有 2–3 位受访者的材料支撑，并写出反例。",
    ],
    minutes: 60,
    source,
    notes: [],
  };
}

// ---------- 导出 ----------

function optionsText(item: InstrumentItem) {
  if (item.kind === "likert") return LIKERT.map((label, index) => `□${index + 1} ${label}`).join("  ");
  if (item.kind === "single" && item.options) return item.options.map((option) => `□${option}`).join("  ");
  if (item.kind === "fill") return item.note ?? "____";
  if (item.kind === "open") return "________________";
  return "";
}

export function instrumentMarkdown(doc: Instrument) {
  const lines: string[] = [`# ${doc.title}`, "", `${doc.kind === "scale" ? "调查问卷" : "半结构访谈提纲"} · 预计 ${doc.minutes} 分钟`, ""];
  lines.push(doc.kind === "scale" ? "## 卷首语" : "## 开场白（照读）", "", ...doc.intro.split("\n").map((line) => `${line}  `), "");
  for (const section of doc.sections) {
    lines.push(`## ${section.title}`, "", `*${section.purpose}*`, "");
    if (section.definition) lines.push(`**操作化定义**：${section.definition}`, "");
    if (section.reference) lines.push(`**可参考**：${section.reference}`, "");
    if (section.scale) lines.push(`**计分**：${section.scale}`, "");
    for (const item of section.items) {
      if (item.kind === "note") {
        lines.push(`- ${item.text}`);
        continue;
      }
      const tags = [item.reverse ? "反向" : "", item.check ? "注意力检测" : "", item.note && item.kind === "single" ? item.note : ""].filter(Boolean);
      lines.push(`${item.code ? `${item.code}. ` : ""}${item.text}${tags.length ? `（${tags.join("，")}）` : ""}`);
      const options = optionsText(item);
      if (options) lines.push(`   ${options}`);
      for (const probe of item.probes ?? []) lines.push(`   - 追问：${probe}`);
      lines.push("");
    }
    lines.push("");
  }
  lines.push(doc.kind === "scale" ? "## 变量与题项对照表" : "## 初始编码框架", "", "| 变量 | 名称 | 题项 | 编码 |", "| --- | --- | --- | --- |");
  for (const row of doc.codebook) lines.push(`| ${row.variable} | ${row.name} | ${row.items} | ${row.coding} |`);
  lines.push("", "## 质量控制", "", ...doc.quality.map((line) => `- ${line}`), "");
  lines.push(doc.kind === "scale" ? "## 预调查" : "## 预访谈", "", ...doc.pilot.map((line) => `- ${line}`), "");
  lines.push("## 分析计划", "", ...doc.analysis.map((line) => `- ${line}`), "");
  return lines.join("\n");
}

function escapeHtml(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Word 能直接打开的 HTML，另存为 .doc 即可编辑。 */
export function instrumentWordHtml(doc: Instrument, extra = "") {
  const body: string[] = [`<h1>${escapeHtml(doc.title)}</h1>`, `<p class="meta">${doc.kind === "scale" ? "调查问卷" : "半结构访谈提纲"} · 预计 ${doc.minutes} 分钟</p>`];
  body.push(`<div class="intro">${doc.intro.split("\n").map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>`);
  for (const section of doc.sections) {
    body.push(`<h2>${escapeHtml(section.title)}</h2>`, `<p class="purpose">${escapeHtml(section.purpose)}</p>`);
    if (section.definition) body.push(`<p><b>操作化定义：</b>${escapeHtml(section.definition)}</p>`);
    if (section.reference) body.push(`<p><b>可参考：</b>${escapeHtml(section.reference)}</p>`);
    if (section.scale) body.push(`<p><b>计分：</b>${escapeHtml(section.scale)}</p>`);
    const likert = section.items.filter((item) => item.kind === "likert");
    if (likert.length === section.items.length && likert.length) {
      body.push(
        `<table><tr><th style="width:6%">题号</th><th style="width:49%">题目</th>${LIKERT.map((label, index) => `<th style="width:9%">${index + 1}<br/>${label}</th>`).join("")}</tr>${likert
          .map(
            (item) =>
              `<tr><td>${item.code}</td><td>${escapeHtml(item.text)}${item.reverse ? "（反向）" : ""}${item.check ? "（注意力检测）" : ""}</td>${LIKERT.map(() => "<td>□</td>").join("")}</tr>`,
          )
          .join("")}</table>`,
      );
      continue;
    }
    for (const item of section.items) {
      if (item.kind === "note") {
        body.push(`<p>${escapeHtml(item.text)}</p>`);
        continue;
      }
      const tag = [item.reverse ? "反向" : "", item.check ? "注意力检测" : "", item.kind === "single" && item.note ? item.note : ""].filter(Boolean).join("，");
      body.push(`<p class="q">${item.code ? `${item.code}. ` : ""}${escapeHtml(item.text)}${tag ? `（${escapeHtml(tag)}）` : ""}</p>`);
      const options = optionsText(item);
      if (options) body.push(`<p class="opt">${escapeHtml(options)}</p>`);
      if (item.probes?.length) body.push(`<ul>${item.probes.map((probe) => `<li>追问：${escapeHtml(probe)}</li>`).join("")}</ul>`);
    }
  }
  body.push(`<h2>${doc.kind === "scale" ? "变量与题项对照表" : "初始编码框架"}</h2>`);
  body.push(
    `<table><tr><th>变量</th><th>名称</th><th>题项</th><th>编码</th></tr>${doc.codebook
      .map((row) => `<tr><td>${escapeHtml(row.variable)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.items)}</td><td>${escapeHtml(row.coding)}</td></tr>`)
      .join("")}</table>`,
  );
  for (const [heading, list] of [
    ["质量控制", doc.quality],
    [doc.kind === "scale" ? "预调查" : "预访谈", doc.pilot],
    ["分析计划", doc.analysis],
  ] as const) {
    body.push(`<h2>${heading}</h2><ul>${list.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`);
  }
  if (extra) body.push(extra);
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"/><title>${escapeHtml(
    doc.title,
  )}</title><style>body{font-family:"宋体",SimSun,serif;font-size:12pt;line-height:1.6}h1{font-size:16pt;text-align:center}h2{font-size:13pt;margin-top:18pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #666;padding:3pt 5pt;font-size:10.5pt;vertical-align:top}.meta,.purpose{color:#555}.intro{border:1px solid #999;padding:6pt 10pt}.opt{margin-left:18pt}</style></head><body>${body.join(
    "",
  )}</body></html>`;
}

export function constructSummary(doc: Instrument | null) {
  if (!doc) return "";
  if (doc.kind === "interview") {
    return doc.sections
      .filter((section) => section.role === "module")
      .map((section) => `${section.title.replace(/^.*?：/, "")}（${section.items.length} 个主问题）`)
      .join("；");
  }
  return doc.sections
    .filter((section) => section.role === "construct")
    .map((section) => `${section.variable} ${section.name}（${section.varRole}，${section.items.filter((item) => item.kind === "likert" && !item.check).length} 题）`)
    .join("；");
}

/** 量表题数、因子数和预测变量数，交给样本量计算书。 */
export function designFromInstrument(doc: Instrument | null) {
  if (!doc || doc.kind !== "scale") return null;
  const constructs = doc.sections.filter((section) => section.role === "construct");
  const items = constructs.reduce((sum, section) => sum + section.items.filter((item) => item.kind === "likert" && !item.check).length, 0);
  const controls = doc.sections.find((section) => section.role === "basic")?.items.length ?? 0;
  const predictors = constructs.filter((section) => section.variable !== "Y").length + (constructs.some((section) => section.variable === "W") ? 1 : 0) + controls;
  return { items, factors: constructs.length, predictors: Math.max(1, predictors) };
}
