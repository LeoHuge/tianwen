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
    eyebrow: "检索与三个题目",
    summary: "检索近五年论文与国家社科基金、国家自然科学基金立项，给出 3 个具体题目。付款后即可查看，并按建议修改。",
    points: ["中文标注 CSSCI来源、CSSCI扩展版、北大核心、AMI 各级和 CSCD", "外文分别标注 SSCI、SCIE、SCI、ESCI 和 EI", "3 个具体论文题目", "按建议修改所选题目", "检查研究对象的写法"],
    revisions: "题目可按建议修改。题目交付后，该笔费用按购买说明结算。",
    kind: "scan",
  },
  {
    id: "survey",
    name: "分析包",
    price: 599,
    eyebrow: "含 1 轮题项修订",
    summary: "一份可发放的问卷或访谈提纲。文本分析则提供分类框架和编码说明。样本量或文本范围写明公式和出处。",
    points: ["问卷或访谈提纲（含筛选题、计分、质量控制）", "样本量计算书", "Stata / R 可复现代码", "变量编码表"],
    revisions: "仅 1 轮题项修订，不含成稿",
    kind: "scan",
  },
  {
    id: "upgrade-buyout",
    name: "成稿包 · 补差价",
    price: 600,
    eyebrow: "已付开题包 ¥199",
    summary: "补齐成稿包 ¥799。出问卷、访谈提纲或文本分析框架，传上数据后出初稿。",
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
    eyebrow: "含 1 轮修订",
    summary: "从开题写到初稿，含一轮结构性修订。",
    points: ["开题包全部内容", "问卷或访谈提纲、样本量计算书", "成稿初稿，文献与结果留出核对位置", "含 1 轮结构性修订。Stata 与 R 脚本另行提供"],
    revisions: "1 轮。用完后 ¥230/轮",
    kind: "scan",
  },
  {
    id: "revise3",
    name: "三包合买",
    price: 1199,
    eyebrow: "含 3 轮人工协助结构性修订",
    summary: "与成稿包相同的初稿。三轮结构性修订由人工协助，用于调整问题、变量、结果表述和讨论。",
    points: ["成稿包的全部交付", "3 轮人工协助结构性修订", "第 4 轮起 ¥140/轮", "文献保持检索原文，由您核对出处"],
    revisions: "3 轮人工协助结构性修订",
    kind: "scan",
  },
  {
    id: "deposit-revise",
    name: "三包合买 · 定金",
    price: 330,
    eyebrow: "支付后开始",
    summary: "定金用于确定课题，并生成问卷、同意书和最低样本量。初稿在尾款之后交付。",
    points: ["确定课题", "生成问卷", "数据随后上传"],
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
    points: ["成稿初稿", "写入您已确认的汇总", "3 轮人工协助结构性修订"],
    revisions: "3 轮。第 4 轮 ¥140",
    kind: "scan",
  },
  {
    id: "deposit-buyout",
    name: "成稿包 · 定金",
    price: 240,
    eyebrow: "先付这一笔才开工",
    summary: "定金同样自动出问卷。成稿在尾款之后，整档只含 1 轮修订。",
    points: ["确定课题", "生成问卷", "尾款支付前交付研究工具"],
    revisions: "尾款 ¥559，全档共 1 轮修订",
    kind: "scan",
  },
  {
    id: "balance-buyout",
    name: "成稿包 · 尾款",
    price: 559,
    eyebrow: "数据解析之后",
    summary: "交付初稿。本档共 1 轮修订，用于问卷或成稿。",
    points: ["成稿初稿", "与定金合计 1 轮修订", "再改按 ¥230/轮", "不含统计代码"],
    revisions: "全档 1 轮",
    kind: "scan",
  },
  {
    id: "year",
    name: "教研室年匣",
    price: 6120,
    eyebrow: "8 个项目 · 每个含 3 轮",
    summary: "供带学生的教研室使用。共 8 个项目，每个项目含 3 轮修订。",
    points: ["8 个完整项目", "每个项目 3 轮结构性修订", "错字和格式调整不占轮次", "逐段人工审稿另行预约"],
    revisions: "每项目 3 轮",
    kind: "scan",
  },
  {
    id: "code",
    name: "统计代码",
    price: 2520,
    eyebrow: "另行购买",
    summary: "问卷研究提供 Stata 与 R 脚本。访谈研究提供编码表。成稿包不含这两项。",
    points: ["Stata 与 R 各一份", "访谈编码表一份，主题由您填写", "不含软件许可", "与成稿包分开购买"],
    revisions: "按当前数据表交付一次",
    kind: "scan",
  },
  {
    id: "addon-buyout",
    name: "成稿包再增加一轮",
    price: 230,
    eyebrow: "加购",
    summary: "成稿包的修订用完之后，可再增加一轮结构性修订。",
    points: ["增加 1 轮结构性修订", "用于调整结构与表述"],
    revisions: "+1 轮",
    kind: "addon",
  },
  {
    id: "addon-revise",
    name: "三包合买再增加一轮",
    price: 140,
    eyebrow: "加购",
    summary: "三包合买或年匣的修订用完之后，可再增加一轮。",
    points: ["仅限已购买三包合买或年匣", "用于调整结构与表述"],
    revisions: "+1 轮",
    kind: "addon",
  },
];

export const HUMAN_REVIEW = {
  name: "人工方法顾问审阅",
  price: 810,
  note: "预约审阅研究问题与变量，不包含在上述套餐中。",
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
    points: ["问卷或访谈提纲", "样本量计算书", "上传数据后交付初稿", "3 轮人工协助结构性修订，第 4 轮 ¥140"],
  },
  buyout: {
    name: "成稿包",
    total: 799,
    upgrade: 799 - TOPIC_FEE,
    upgradeId: "upgrade-buyout" as const,
    revisions: 1,
    points: ["问卷或访谈提纲", "样本量计算书", "上传数据后交付初稿", "全档 1 轮修订，此后 ¥230/轮"],
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
