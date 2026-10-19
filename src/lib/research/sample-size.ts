// 样本量计算书：每一步都给公式、代入过程和出处，结果由算法算出，不写死。
// 统计功效部分用非中心 F 分布精确计算，与 G*Power 3.1 的同名检验是同一算法。

export type Analysis = "estimate" | "regression" | "ttest" | "anova" | "efa" | "cfa";

export type SamplePlan = {
  analyses: Analysis[];
  confidence: "90" | "95" | "99";
  margin: number;
  proportion: number;
  population: number;
  effect: "small" | "medium" | "large";
  predictors: number;
  groups: number;
  power: number;
  alpha: number;
  items: number;
  factors: number;
  invalidRate: number;
  cluster: boolean;
  clusterSize: number;
  icc: number;
  subgroups: number;
  perGroup: number;
  dropout: number;
};

export type SampleStep = {
  key: string;
  label: string;
  formula: string;
  work: string;
  result: number;
  unit: string;
  cite: string[];
  note?: string;
};

export type SampleResult = {
  kind: "scale" | "interview";
  steps: SampleStep[];
  adjust: SampleStep[];
  required: number;
  requiredBy: string;
  target: number;
  issue: number;
  unit: string;
  issueUnit: string;
  sentence: string;
  references: string[];
};

export const DEFAULT_PLAN: SamplePlan = {
  analyses: ["regression", "efa"],
  confidence: "95",
  margin: 0.05,
  proportion: 0.5,
  population: 0,
  effect: "medium",
  predictors: 8,
  groups: 3,
  power: 0.8,
  alpha: 0.05,
  items: 15,
  factors: 3,
  invalidRate: 0.15,
  cluster: false,
  clusterSize: 20,
  icc: 0.05,
  subgroups: 1,
  perGroup: 13,
  dropout: 0.2,
};

export const ANALYSES: { id: Analysis; label: string; hint: string }[] = [
  { id: "regression", label: "多元回归 / 中介 / 调节", hint: "看自变量能否解释因变量，含控制变量" },
  { id: "efa", label: "探索性因子分析（量表效度）", hint: "自编或改编量表要报告结构效度" },
  { id: "cfa", label: "验证性因子分析 / 结构方程", hint: "要报告 CFI、RMSEA 等拟合指标时选" },
  { id: "estimate", label: "估计比例或均值", hint: "要报告「某行为占多大比例」时选" },
  { id: "ttest", label: "两组比较（t 检验）", hint: "比较两类人，例如男女、城乡" },
  { id: "anova", label: "多组比较（方差分析）", hint: "比较三类及以上的人" },
];

const Z = { "90": 1.645, "95": 1.96, "99": 2.576 } as const;
const F2 = { small: 0.02, medium: 0.15, large: 0.35 } as const;
const D = { small: 0.2, medium: 0.5, large: 0.8 } as const;
const FF = { small: 0.1, medium: 0.25, large: 0.4 } as const;
const EFFECT_LABEL = { small: "小", medium: "中等", large: "大" } as const;

export const REFERENCES: Record<string, string> = {
  "Cochran, 1977": "Cochran, W. G. (1977). Sampling techniques (3rd ed.). New York: John Wiley & Sons.",
  "Krejcie & Morgan, 1970":
    "Krejcie, R. V., & Morgan, D. W. (1970). Determining sample size for research activities. Educational and Psychological Measurement, 30(3), 607–610.",
  "Cohen, 1988":
    "Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Hillsdale, NJ: Lawrence Erlbaum Associates.",
  "Faul et al., 2009":
    "Faul, F., Erdfelder, E., Buchner, A., & Lang, A.-G. (2009). Statistical power analyses using G*Power 3.1: Tests for correlation and regression analyses. Behavior Research Methods, 41(4), 1149–1160.",
  "Green, 1991":
    "Green, S. B. (1991). How many subjects does it take to do a regression analysis? Multivariate Behavioral Research, 26(3), 499–510.",
  "Hair et al., 2019":
    "Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2019). Multivariate data analysis (8th ed.). Andover: Cengage Learning.",
  "Comrey & Lee, 1992":
    "Comrey, A. L., & Lee, H. B. (1992). A first course in factor analysis (2nd ed.). Hillsdale, NJ: Lawrence Erlbaum Associates.",
  "Jackson, 2003":
    "Jackson, D. L. (2003). Revisiting sample size and number of parameter estimates: Some support for the N:q hypothesis. Structural Equation Modeling, 10(1), 128–141.",
  "Kline, 2016": "Kline, R. B. (2016). Principles and practice of structural equation modeling (4th ed.). New York: Guilford Press.",
  "Kish, 1965": "Kish, L. (1965). Survey sampling. New York: John Wiley & Sons.",
  "Guest et al., 2006":
    "Guest, G., Bunce, A., & Johnson, L. (2006). How many interviews are enough? An experiment with data saturation and variability. Field Methods, 18(1), 59–82.",
  "Hennink & Kaiser, 2022":
    "Hennink, M., & Kaiser, B. N. (2022). Sample sizes for saturation in qualitative research: A systematic review of empirical tests. Social Science & Medicine, 292, 114523.",
  "Francis et al., 2010":
    "Francis, J. J., Johnston, M., Robertson, C., Glidewell, L., Entwistle, V., Eccles, M. P., & Grimshaw, J. M. (2010). What is an adequate sample size? Operationalising data saturation for theory-based interview studies. Psychology & Health, 25(10), 1229–1245.",
  "Malterud et al., 2016":
    "Malterud, K., Siersma, V. D., & Guassora, A. D. (2016). Sample size in qualitative interview studies: Guided by information power. Qualitative Health Research, 26(13), 1753–1760.",
  "Johanson & Brooks, 2010":
    "Johanson, G. A., & Brooks, G. P. (2010). Initial scale development: Sample size for pilot studies. Educational and Psychological Measurement, 70(3), 394–400.",
  "Nunnally, 1978": "Nunnally, J. C. (1978). Psychometric theory (2nd ed.). New York: McGraw-Hill.",
  "Kaiser, 1974": "Kaiser, H. F. (1974). An index of factorial simplicity. Psychometrika, 39(1), 31–36.",
  "Braun & Clarke, 2006":
    "Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. Qualitative Research in Psychology, 3(2), 77–101.",
};

// ---------- 分布函数 ----------

function logGamma(x: number): number {
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  const z = x - 1;
  let a = c[0]!;
  const t = z + 7.5;
  for (let i = 1; i < 9; i += 1) a += c[i]! / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

function betaFraction(a: number, b: number, x: number) {
  const tiny = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 500; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const step = d * c;
    h *= step;
    if (Math.abs(step - 1) < 3e-14) break;
  }
  return h;
}

/** 正则化不完全 Beta 函数 I_x(a, b) */
export function incompleteBeta(x: number, a: number, b: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (front * betaFraction(a, b, x)) / a;
  return 1 - (front * betaFraction(b, a, 1 - x)) / b;
}

function fCdf(x: number, d1: number, d2: number) {
  if (x <= 0) return 0;
  return incompleteBeta((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2);
}

function fCritical(alpha: number, d1: number, d2: number) {
  let lo = 0;
  let hi = 1;
  while (fCdf(hi, d1, d2) < 1 - alpha && hi < 1e6) hi *= 2;
  for (let i = 0; i < 80; i += 1) {
    const mid = (lo + hi) / 2;
    if (fCdf(mid, d1, d2) < 1 - alpha) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function noncentralFCdf(x: number, d1: number, d2: number, lambda: number) {
  if (x <= 0) return 0;
  const y = (d1 * x) / (d1 * x + d2);
  const half = lambda / 2;
  if (half <= 0) return incompleteBeta(y, d1 / 2, d2 / 2);
  const last = Math.ceil(half + 12 * Math.sqrt(half + 1) + 30);
  let logWeight = -half;
  let sum = 0;
  for (let j = 0; j <= last; j += 1) {
    if (j > 0) logWeight += Math.log(half) - Math.log(j);
    sum += Math.exp(logWeight) * incompleteBeta(y, d1 / 2 + j, d2 / 2);
  }
  return Math.min(1, sum);
}

/** F 检验的统计功效：非中心参数 λ、自由度 d1 与 d2、显著性水平 α */
export function fPower(lambda: number, d1: number, d2: number, alpha: number) {
  if (d2 < 1) return 0;
  return 1 - noncentralFCdf(fCritical(alpha, d1, d2), d1, d2, lambda);
}

function smallestN(start: number, powerAt: (n: number) => number, target: number, cap = 200000) {
  let lo = start - 1;
  let hi = Math.max(start, 4);
  while (powerAt(hi) < target) {
    lo = hi;
    hi *= 2;
    if (hi > cap) return cap;
  }
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (powerAt(mid) >= target) hi = mid;
    else lo = mid;
  }
  return hi;
}

export function regressionN(f2: number, k: number, alpha = 0.05, power = 0.8) {
  const powerAt = (n: number) => (n - k - 1 < 1 ? 0 : fPower(f2 * n, k, n - k - 1, alpha));
  const n = smallestN(k + 2, powerAt, power);
  return { n, power: powerAt(n), before: powerAt(n - 1) };
}

export function twoGroupN(d: number, alpha = 0.05, power = 0.8) {
  const powerAt = (n: number) => (n < 2 ? 0 : fPower((d * d * n) / 2, 1, 2 * n - 2, alpha));
  const n = smallestN(2, powerAt, power);
  return { perGroup: n, total: 2 * n, power: powerAt(n) };
}

export function anovaN(f: number, groups: number, alpha = 0.05, power = 0.8) {
  const g = Math.max(2, Math.round(groups));
  const powerAt = (n: number) => (n < 2 ? 0 : fPower(f * f * g * n, g - 1, g * n - g, alpha));
  const n = smallestN(2, powerAt, power);
  return { perGroup: n, total: g * n, power: powerAt(n) };
}

// ---------- 计算书 ----------

export function computeSample(plan: SamplePlan, kind: "scale" | "interview"): SampleResult {
  return kind === "interview" ? interviewSheet(plan) : scaleSheet(plan);
}

function scaleSheet(input: SamplePlan): SampleResult {
  const plan = sanitize(input);
  const steps: SampleStep[] = [];
  const picked = plan.analyses.length ? plan.analyses : (["regression"] as Analysis[]);

  if (picked.includes("estimate")) {
    const z = Z[plan.confidence];
    const p = plan.proportion;
    const e = plan.margin;
    const n0 = (z * z * p * (1 - p)) / (e * e);
    const N = plan.population;
    const n = N > 0 ? n0 / (1 + (n0 - 1) / N) : n0;
    steps.push({
      key: "estimate",
      label: "估计比例的精度要求",
      formula: N > 0 ? "n₀ = Z² · p(1 − p) / e²；有限总体校正 n = n₀ / [1 + (n₀ − 1) / N]" : "n₀ = Z² · p(1 − p) / e²",
      work:
        `置信度 ${plan.confidence}%（Z = ${z}），p = ${p}，允许误差 e = ${e}：n₀ = ${z}² × ${p} × ${round(1 - p, 2)} ÷ ${e}² = ${n0.toFixed(1)}` +
        (N > 0 ? `；总体 N = ${N}，n = ${n0.toFixed(1)} ÷ [1 + (${n0.toFixed(1)} − 1) ÷ ${N}] = ${n.toFixed(1)}` : "") +
        `，向上取整为 ${Math.ceil(n)}。`,
      result: Math.ceil(n),
      unit: "份有效问卷",
      cite: N > 0 ? ["Cochran, 1977", "Krejcie & Morgan, 1970"] : ["Cochran, 1977"],
      note: "p 不知道时取 0.5，此时样本量最大，最保守。",
    });
  }

  if (picked.includes("regression")) {
    const f2 = F2[plan.effect];
    const k = plan.predictors;
    const result = regressionN(f2, k, plan.alpha, plan.power);
    const green = 50 + 8 * k;
    steps.push({
      key: "regression",
      label: "多元回归的统计功效",
      formula: "F 检验（R² 是否为 0）：λ = f² × N，df₁ = k，df₂ = N − k − 1；取功效 1 − β ≥ " + plan.power + " 的最小 N",
      work: `f² = ${f2}（${EFFECT_LABEL[plan.effect]}效应），α = ${plan.alpha}，预测变量 k = ${k}：N = ${result.n} 时功效为 ${result.power.toFixed(3)}，N = ${result.n - 1} 时为 ${result.before.toFixed(3)}，所以至少 ${result.n}。`,
      result: result.n,
      unit: "份有效问卷",
      cite: ["Cohen, 1988", "Faul et al., 2009"],
      note: `k 要把控制变量、虚拟变量和交互项都算进去。经验法则交叉核对：N ≥ 50 + 8k = ${green}（Green, 1991）。`,
    });
  }

  if (picked.includes("ttest")) {
    const d = D[plan.effect];
    const result = twoGroupN(d, plan.alpha, plan.power);
    steps.push({
      key: "ttest",
      label: "两组比较的统计功效",
      formula: "两独立样本 t 检验（双侧）：λ = d² × n / 2，df = 2n − 2；取功效 ≥ " + plan.power + " 的每组最小 n",
      work: `d = ${d}（${EFFECT_LABEL[plan.effect]}效应），α = ${plan.alpha}：每组 ${result.perGroup} 人时功效为 ${result.power.toFixed(3)}，两组合计 ${result.total}。`,
      result: result.total,
      unit: "份有效问卷（两组各一半）",
      cite: ["Cohen, 1988", "Faul et al., 2009"],
      note: "两组人数不等时，小的那组也要达到每组人数。",
    });
  }

  if (picked.includes("anova")) {
    const f = FF[plan.effect];
    const result = anovaN(f, plan.groups, plan.alpha, plan.power);
    steps.push({
      key: "anova",
      label: "多组比较的统计功效",
      formula: "单因素方差分析：λ = f² × N，df₁ = g − 1，df₂ = N − g；取功效 ≥ " + plan.power + " 的最小 N",
      work: `f = ${f}（${EFFECT_LABEL[plan.effect]}效应），组数 g = ${plan.groups}，α = ${plan.alpha}：每组 ${result.perGroup} 人时功效为 ${result.power.toFixed(3)}，合计 ${result.total}。`,
      result: result.total,
      unit: "份有效问卷",
      cite: ["Cohen, 1988", "Faul et al., 2009"],
    });
  }

  if (picked.includes("efa")) {
    const p = plan.items;
    const ratio = 10 * p;
    const n = Math.max(ratio, 100);
    steps.push({
      key: "efa",
      label: "探索性因子分析的样本要求",
      formula: "N ≥ 10 × p（p 为参与因子分析的题项数），且 N ≥ 100",
      work: `量表题 p = ${p}：10 × ${p} = ${ratio}，与 100 取大者，为 ${n}。`,
      result: n,
      unit: "份有效问卷",
      cite: ["Hair et al., 2019", "Comrey & Lee, 1992"],
      note: "Comrey 与 Lee（1992）的分级：100 为差，200 为一般，300 为好，500 为很好。只做描述的题不计入 p。",
    });
  }

  if (picked.includes("cfa")) {
    const p = plan.items;
    const m = plan.factors;
    const covariances = (m * (m - 1)) / 2;
    const q = 2 * p + covariances;
    const n = Math.max(10 * q, 200);
    steps.push({
      key: "cfa",
      label: "验证性因子分析 / 结构方程的样本要求",
      formula: "自由参数 q = p（载荷）+ p（残差）+ m(m − 1)/2（因子间协方差）；N ≥ 10q，且 N ≥ 200",
      work: `题项 p = ${p}，因子 m = ${m}：q = ${p} + ${p} + ${covariances} = ${q}；10 × ${q} = ${10 * q}，与 200 取大者，为 ${n}。`,
      result: n,
      unit: "份有效问卷",
      cite: ["Jackson, 2003", "Kline, 2016"],
      note: `N:q 为 20:1 更理想（${20 * q}）。数据明显偏态、模型更复杂时还要更多。`,
    });
  }

  const top = steps.reduce((best, step) => (step.result > best.result ? step : best), steps[0]!);
  const required = top.result;
  const adjust: SampleStep[] = [];
  let target = required;
  if (plan.cluster && plan.clusterSize > 1) {
    const deff = 1 + (plan.clusterSize - 1) * plan.icc;
    target = Math.ceil(required * deff);
    adjust.push({
      key: "deff",
      label: "整群抽样的设计效应",
      formula: "deff = 1 + (m − 1) × ρ；有效样本 × deff",
      work: `每群约 m = ${plan.clusterSize} 人，组内相关 ρ = ${plan.icc}：deff = 1 + ${plan.clusterSize - 1} × ${plan.icc} = ${round(deff, 2)}；${required} × ${round(deff, 2)} = ${target}。`,
      result: target,
      unit: "份有效问卷",
      cite: ["Kish, 1965"],
      note: "ρ 不知道时，社区、学校层面的态度题常在 0.01–0.10 之间，取 0.05 较稳妥；最好用预调查或同类研究的值。",
    });
  }
  const issue = Math.ceil(target / (1 - plan.invalidRate));
  adjust.push({
    key: "invalid",
    label: "按预计无效率放大发放量",
    formula: "发放量 = 有效样本 ÷ (1 − 无效率)",
    work: `预计无效 ${percent(plan.invalidRate)}：${target} ÷ (1 − ${plan.invalidRate}) = ${(target / (1 - plan.invalidRate)).toFixed(1)}，向上取整为 ${issue}。`,
    result: issue,
    unit: "份（发放）",
    cite: [],
    note: "无效率最好用预调查实际剔除的比例替换。剔除规则见问卷的「质量控制」。",
  });

  const cites = unique([...steps, ...adjust].flatMap((step) => step.cite));
  const sentence =
    `本研究计划进行${steps.map((step) => step.label.replace(/的.*$/, "")).join("、")}。按${top.label}（${top.cite.join("；")}）计算，至少需要 ${required} 份有效问卷` +
    (target > required ? `，考虑整群抽样的设计效应后为 ${target} 份` : "") +
    `；预计无效问卷约 ${percent(plan.invalidRate)}，计划发放 ${issue} 份。`;
  return {
    kind: "scale",
    steps,
    adjust,
    required,
    requiredBy: top.label,
    target,
    issue,
    unit: "份有效问卷",
    issueUnit: "份（发放）",
    sentence,
    references: cites.map((key) => REFERENCES[key]).filter((item): item is string => Boolean(item)),
  };
}

function interviewSheet(input: SamplePlan): SampleResult {
  const plan = sanitize(input);
  const g = plan.subgroups;
  const per = plan.perGroup;
  const required = g * per;
  const steps: SampleStep[] = [
    {
      key: "saturation",
      label: "按亚群体计算饱和所需访谈数",
      formula: "n = 亚群体数 g × 每个亚群体的访谈数（初始 10 个 + 停止标准 3 个）",
      work: `g = ${g}，每组 ${per} 个：${g} × ${per} = ${required}。`,
      result: required,
      unit: "人（完成访谈）",
      cite: ["Francis et al., 2010", "Guest et al., 2006", "Hennink & Kaiser, 2022"],
      note: "10+3 停止规则：先完成 10 个访谈，之后连续 3 个访谈不再出现新的编码才停。Guest 等（2006）发现同质群体约 12 个访谈后新编码已很少出现；Hennink 与 Kaiser（2022）的综述给出 9–17 个的区间。",
    },
  ];
  const issue = Math.ceil(required * (1 + plan.dropout));
  const adjust: SampleStep[] = [
    {
      key: "backup",
      label: "按预计爽约与拒访多约人",
      formula: "邀约量 = 完成访谈数 × (1 + 爽约率)",
      work: `预计爽约 ${percent(plan.dropout)}：${required} × (1 + ${plan.dropout}) = ${(required * (1 + plan.dropout)).toFixed(1)}，向上取整为 ${issue}。`,
      result: issue,
      unit: "人（邀约）",
      cite: [],
    },
  ];
  const sentence =
    `本研究按${g > 1 ? ` ${g} 个亚群体分别` : "一个相对同质的群体"}进行半结构访谈，每个亚群体采用「10+3」饱和停止规则（Francis et al., 2010），计划完成 ${required} 个访谈，按 ${percent(plan.dropout)} 的爽约率邀约 ${issue} 人；最终人数以饱和判断为准。`;
  return {
    kind: "interview",
    steps,
    adjust,
    required,
    requiredBy: steps[0]!.label,
    target: required,
    issue,
    unit: "人（完成访谈）",
    issueUnit: "人（邀约）",
    sentence,
    references: ["Francis et al., 2010", "Guest et al., 2006", "Hennink & Kaiser, 2022", "Malterud et al., 2016"].map((key) => REFERENCES[key]!),
  };
}

/** 「计划发放 389 份」「计划邀约 32 人」 */
export function issueLabel(result: SampleResult) {
  return `计划${result.kind === "scale" ? "发放" : "邀约"} ${result.issue} ${result.issueUnit.replace(/[（）]|发放|邀约/g, "")}`;
}

export function sampleMarkdown(result: SampleResult) {
  const lines = ["## 样本量计算书", "", `**结论**：至少 ${result.target} ${result.unit}，${issueLabel(result)}。`, ""];
  for (const step of [...result.steps, ...result.adjust]) {
    lines.push(`### ${step.label}：${step.result} ${step.unit}`, "", `公式：${step.formula}`, "", `计算：${step.work}`, "");
    if (step.cite.length) lines.push(`依据：${step.cite.join("；")}`, "");
    if (step.note) lines.push(`说明：${step.note}`, "");
  }
  lines.push("**写进论文的一句话**", "", result.sentence, "", "**参考文献**", "", ...result.references.map((item) => `- ${item}`), "");
  return lines.join("\n");
}

export function sampleHtml(result: SampleResult) {
  const esc = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const steps = [...result.steps, ...result.adjust]
    .map(
      (step) =>
        `<h3>${esc(step.label)}：${step.result} ${esc(step.unit)}</h3><p>公式：${esc(step.formula)}</p><p>计算：${esc(step.work)}</p>${
          step.cite.length ? `<p>依据：${esc(step.cite.join("；"))}</p>` : ""
        }${step.note ? `<p>说明：${esc(step.note)}</p>` : ""}`,
    )
    .join("");
  return `<h2>样本量计算书</h2><p><b>结论：</b>至少 ${result.target} ${esc(result.unit)}，${esc(issueLabel(result))}。</p>${steps}<p><b>写进论文的一句话：</b>${esc(result.sentence)}</p><p><b>参考文献</b></p><ul>${result.references.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

export function sanitize(plan: Partial<SamplePlan>): SamplePlan {
  const base = { ...DEFAULT_PLAN, ...plan };
  const analyses = Array.isArray(base.analyses)
    ? (base.analyses.filter((item) => ANALYSES.some((option) => option.id === item)) as Analysis[])
    : DEFAULT_PLAN.analyses;
  return {
    analyses,
    confidence: base.confidence === "90" || base.confidence === "99" ? base.confidence : "95",
    margin: clamp(base.margin, 0.01, 0.2, 0.05),
    proportion: clamp(base.proportion, 0.01, 0.99, 0.5),
    population: Math.max(0, Math.round(num(base.population, 0))),
    effect: base.effect === "small" || base.effect === "large" ? base.effect : "medium",
    predictors: Math.round(clamp(base.predictors, 1, 40, 8)),
    groups: Math.round(clamp(base.groups, 2, 12, 3)),
    power: clamp(base.power, 0.5, 0.99, 0.8),
    alpha: clamp(base.alpha, 0.001, 0.2, 0.05),
    items: Math.round(clamp(base.items, 2, 150, 15)),
    factors: Math.round(clamp(base.factors, 1, 15, 3)),
    invalidRate: clamp(base.invalidRate, 0, 0.6, 0.15),
    cluster: Boolean(base.cluster),
    clusterSize: Math.round(clamp(base.clusterSize, 2, 500, 20)),
    icc: clamp(base.icc, 0, 0.5, 0.05),
    subgroups: Math.round(clamp(base.subgroups, 1, 12, 1)),
    perGroup: Math.round(clamp(base.perGroup, 6, 40, 13)),
    dropout: clamp(base.dropout, 0, 1, 0.2),
  };
}

function num(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const n = num(value, fallback);
  return Math.min(max, Math.max(min, n));
}

function round(n: number, digits: number) {
  const scale = 10 ** digits;
  return Math.round(n * scale) / scale;
}

function percent(rate: number) {
  return `${Math.round(rate * 1000) / 10}%`;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}
