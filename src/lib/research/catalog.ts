import type { PlanId } from "./types";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  eyebrow: string;
  summary: string;
  points: string[];
  revisions: string;
  recommended?: boolean;
  kind: "scan" | "addon" | "human";
};

export const PLANS: Plan[] = [
  {
    id: "topic",
    name: "开题包",
    price: 199,
    eyebrow: "单独付 · 付完弹出三个题",
    summary: "检索近五年论文与国社科、国自然立项，出 3 个具体题目。付完马上弹出，选一个按建议修改。",
    points: ["中文标注 CSSCI来源、CSSCI扩展版、北大核心、AMI 各级和 CSCD", "外文分别标注 SSCI、SCIE、SCI 和 ESCI", "3 个具体论文题目", "按建议修改所选题目", "检查研究对象的写法"],
    revisions: "改题不限次数，只能按建议改和小改；题目弹出后不退",
    kind: "scan",
  },
  {
    id: "survey",
    name: "分析包",
    price: 599,
    eyebrow: "含 1 轮题项修订",
    summary: "一份能发出去的问卷或访谈提纲，样本量按公式算出并写明出处。",
    points: ["问卷或访谈提纲（含筛选题、计分、质量控制）", "样本量计算书", "Stata / R 可复现代码", "变量编码表"],
    revisions: "仅 1 轮题项修订，不含成稿",
    kind: "scan",
  },
  {
    id: "upgrade-buyout",
    name: "成稿包 · 补差价",
    price: 600,
    eyebrow: "已付开题包 ¥199",
    summary: "补齐成稿包 ¥799。出问卷或访谈提纲、样本量计算书，传上数据后出初稿。",
    points: ["问卷或访谈提纲", "样本量计算书", "成稿初稿", "全档 1 轮修订"],
    revisions: "全档 1 轮。用完后 ¥230/轮",
    kind: "scan",
  },
  {
    id: "upgrade-revise",
    name: "三包合买 · 补差价",
    price: 1000,
    eyebrow: "已付开题包 ¥199",
    summary: "补齐三包合买 ¥1,199。交付与成稿包相同，含 3 轮人工协助结构性修订。",
    points: ["问卷或访谈提纲", "样本量计算书", "成稿初稿", "3 轮人工协助结构性修订"],
    revisions: "3 轮。第 4 轮 ¥140",
    recommended: true,
    kind: "scan",
  },
  {
    id: "buyout",
    name: "成稿包",
    price: 799,
    eyebrow: "买断，含 1 轮修订",
    summary: "从开题写到初稿，可以改一轮。",
    points: ["开题包全部内容", "问卷或访谈提纲、样本量计算书", "成稿初稿（文献与结果留待核验）", "含 1 轮结构性修订，不含 Stata / R 代码"],
    revisions: "1 轮。用完后 ¥230/轮",
    kind: "scan",
  },
  {
    id: "revise3",
    name: "三包合买",
    price: 1199,
    eyebrow: "含 3 轮人工协助结构性修订",
    summary: "同样的初稿。三轮结构性修订由人工协助，改的是问题、变量、结果表述和讨论。",
    points: ["一修档的全部交付", "3 轮人工协助结构性修订", "第 4 轮起 ¥140/轮", "仍不核对文献、不保证发表"],
    revisions: "3 轮人工协助结构性修订",
    kind: "scan",
  },
  {
    id: "deposit-revise",
    name: "三包合买 · 定金",
    price: 330,
    eyebrow: "先付这一笔才开工",
    summary: "定金锁定课题，并自动生成问卷、同意书和最低样本量。不成稿。",
    points: ["课题锁定", "问卷自动生成", "之后单独上传数据"],
    revisions: "尾款 ¥869 后才交付成稿，并含 3 轮人工协助结构性修订",
    recommended: true,
    kind: "scan",
  },
  {
    id: "balance-revise",
    name: "三包合买 · 尾款",
    price: 869,
    eyebrow: "数据解析之后",
    summary: "尾款换初稿。含 3 轮人工协助结构性修订。",
    points: ["成稿初稿", "写入你已解析的汇总", "3 轮人工协助结构性修订"],
    revisions: "3 轮。第 4 轮 ¥140",
    kind: "scan",
  },
  {
    id: "deposit-buyout",
    name: "成稿包 · 定金",
    price: 240,
    eyebrow: "先付这一笔才开工",
    summary: "定金同样自动出问卷。成稿在尾款之后，整档只含 1 轮修订。",
    points: ["课题锁定", "问卷自动生成", "尾款前不成稿"],
    revisions: "尾款 ¥559，全档共 1 轮修订",
    kind: "scan",
  },
  {
    id: "balance-buyout",
    name: "成稿包 · 尾款",
    price: 559,
    eyebrow: "数据解析之后",
    summary: "交付初稿。这一档一共只有 1 轮修订，用在问卷或成稿上都算。",
    points: ["成稿初稿", "与定金合计 1 轮修订", "再改按 ¥230/轮", "不含统计代码"],
    revisions: "全档 1 轮",
    kind: "scan",
  },
  {
    id: "year",
    name: "教研室年匣",
    price: 6120,
    eyebrow: "8 个项目 · 每个含 3 轮",
    summary: "导师带学生时用。按项目计额，不是无限生成。",
    points: ["8 个完整项目额度", "每个项目 3 轮 AI 结构性修订", "轻量错字格式不占轮次（条款约定）", "不含人工逐段审稿"],
    revisions: "每项目 3 轮",
    kind: "scan",
  },
  {
    id: "code",
    name: "统计代码",
    price: 2520,
    eyebrow: "另付 · 不含在成稿里",
    summary: "做问卷，给 Stata 和 R。做访谈，给一张空的编码表。初稿里没有这些。",
    points: ["Stata 与 R 各一份", "访谈编码表一份，主题留空", "不含软件许可", "不成稿价的一部分"],
    revisions: "脚本一次交付，不按数据返工",
    kind: "scan",
  },
  {
    id: "addon-buyout",
    name: "一修后再追加一轮",
    price: 230,
    eyebrow: "加购",
    summary: "已经买断、临时需要改一处结构。",
    points: ["消耗 1 轮结构性修订", "不把买断升级成无限改"],
    revisions: "+1 轮",
    kind: "addon",
  },
  {
    id: "addon-revise",
    name: "三修后再追加一轮",
    price: 140,
    eyebrow: "加购",
    summary: "三修或年匣用完之后的边际一轮。",
    points: ["仅限已购买三修或年匣", "改的是结构，不是重做整个课题"],
    revisions: "+1 轮",
    kind: "addon",
  },
];

export const HUMAN_REVIEW = {
  name: "人工方法顾问审阅",
  price: 810,
  note: "找人看研究问题和变量，预约，不在扫码里。这一页不能下这个单。",
};

/** 选题单独付；之后要成稿包或三包合买，只补差价。 */
export const TOPIC_FEE = 199;

export const CONTRACTS = {
  revise3: {
    name: "三包合买",
    total: 1199,
    upgrade: 1199 - TOPIC_FEE,
    upgradeId: "upgrade-revise" as const,
    revisions: 3,
    points: ["问卷或访谈提纲", "样本量计算书", "传数据后出初稿", "3 轮人工协助结构性修订，第 4 轮 ¥140"],
  },
  buyout: {
    name: "成稿包",
    total: 799,
    upgrade: 799 - TOPIC_FEE,
    upgradeId: "upgrade-buyout" as const,
    revisions: 1,
    points: ["问卷或访谈提纲", "样本量计算书", "传数据后出初稿", "全档 1 轮修订，再改 ¥230/轮"],
  },
};

export function planById(id: PlanId) {
  const plan = PLANS.find((item) => item.id === id);
  if (!plan) throw new Error("未知方案");
  return plan;
}

export function yuan(amount: number) {
  return "¥" + amount.toLocaleString("zh-CN");
}
