import { HOME_EXAMPLE_BANK } from "./home-example-bank";
import type { Paradigm } from "./types";

export type HomeExample = {
  field: string;
  unit: "个人" | "家庭" | "社区／村" | "组织" | "地区" | "文本";
  keywords: [string, string, string, string];
  where: string;
  who: string;
  stage: string;
  condition: string;
  title: string;
  text?: boolean;
};

export const HOME_EXAMPLES: Record<string, HomeExample> = {
  社会学: {
    field: "城市社会学",
    unit: "社区／村",
    keywords: ["数字技能", "独居", "孤独感", "代际支持"],
    where: "杭州市城区社区",
    who: "老年人",
    stage: "60 岁及以上",
    condition: "独居半年以上",
    title: "数字技能对城市独居老年人孤独感的影响：代际支持的中介作用",
  },
  社会工作: {
    field: "老年社会工作",
    unit: "个人",
    keywords: ["个案工作", "居家养老", "社会支持", "生活满意"],
    where: "南京市鼓楼区社区",
    who: "高龄老人",
    stage: "80 岁及以上",
    condition: "正在接受居家养老服务",
    title: "个案工作介人对城市高龄独居老人社会支持的影响",
  },
  公共管理学: {
    field: "基层治理",
    unit: "社区／村",
    keywords: ["网格员", "基层治理", "回应性", "居民参与"],
    where: "成都市主城区社区",
    who: "居民",
    stage: "在本社区居住 1 年以上",
    condition: "近一年联系过网格员",
    title: "网格化管理对城市社区居民政府回应性评价的影响：居民参与的中介作用",
  },
  新闻传播学: {
    field: "健康传播",
    unit: "个人",
    keywords: ["健康短视频", "信息甄别", "风险感知", "接种意愿"],
    where: "武汉市城区",
    who: "中青年",
    stage: "18–45 岁",
    condition: "每周观看健康短视频",
    title: "健康短视频接触对城市中青年风险感知的影响：信息甄别的中介作用",
  },
  教育学: {
    field: "高等教育",
    unit: "个人",
    keywords: ["导师支持", "学业压力", "科研效能", "退学意向"],
    where: "某双一流高校",
    who: "硕士研究生",
    stage: "研一、研二",
    condition: "参加导师组会",
    title: "导师支持对硕士研究生退学意向的影响：科研效能感的中介作用",
  },
  心理学: {
    field: "应用心理",
    unit: "个人",
    keywords: ["手机依赖", "睡眠质量", "焦虑", "自我控制"],
    where: "某省属本科高校",
    who: "本科生",
    stage: "大一至大三",
    condition: "在校住宿",
    title: "手机依赖对大学生睡眠质量的影响：焦虑的中介作用",
  },
  政治学: {
    field: "政治社会学",
    unit: "社区／村",
    keywords: ["村务公开", "政治信任", "程序公平", "投票参与"],
    where: "中部某县农村",
    who: "村民",
    stage: "18 岁及以上",
    condition: "户籍在本村",
    title: "村务公开对村民政治信任的影响：程序公平感知的中介作用",
  },
  应用经济学: {
    field: "劳动经济",
    unit: "个人",
    keywords: ["灵活就业", "收入波动", "社会保障", "消费"],
    where: "深圳市",
    who: "外卖骑手",
    stage: "从业半年以上",
    condition: "以平台接单为主要工作",
    title: "收入波动对灵活就业者消费的影响：社会保障参与的调节作用",
  },
  人类学: {
    field: "都市人类学",
    unit: "社区／村",
    keywords: ["城中村", "租住", "邻里信任", "地方感"],
    where: "广州市城中村",
    who: "租户",
    stage: "租住半年以上",
    condition: "非本地户籍",
    title: "租住稳定性对城中村租户地方感的影响：邻里信任的中介作用",
  },
  法学: {
    field: "劳动与社会保障法",
    unit: "个人",
    keywords: ["劳动争议", "仲裁", "程序正义", "维权意愿"],
    where: "某市劳动仲裁院",
    who: "劳动者",
    stage: "争议发生 1 年内",
    condition: "已申请劳动仲裁",
    title: "程序正义感知对劳动者仲裁满意度的影响",
  },
  马克思主义理论: {
    field: "思想政治教育",
    unit: "个人",
    keywords: ["思政课", "获得感", "理论认同", "日常实践"],
    where: "某普通本科高校",
    who: "本科生",
    stage: "大一、大二",
    condition: "本学期修读思政课",
    title: "思政课获得感对大学生理论认同的影响：日常实践的中介作用",
  },
  信息资源管理: {
    field: "情报学",
    unit: "个人",
    keywords: ["信息素养", "数据库", "检索焦虑", "写作效能"],
    where: "某高校图书馆",
    who: "研究生",
    stage: "硕士在读",
    condition: "近三个月使用过学术数据库",
    title: "信息素养对研究生论文写作效能的影响：检索焦虑的中介作用",
  },
  人口学: {
    field: "人口与社会",
    unit: "个人",
    keywords: ["生育意愿", "托育", "养育成本", "性别角色"],
    where: "杭州市",
    who: "育龄女性",
    stage: "25–35 岁",
    condition: "已婚且已育一孩",
    title: "托育可及性对育龄女性再生育意愿的影响：养育成本感知的中介作用",
  },
  民族学: {
    field: "民族社会学",
    unit: "个人",
    keywords: ["双语教育", "文化认同", "学业适应", "民族身份"],
    where: "新疆某地州县城中学",
    who: "中学生",
    stage: "初二、初三",
    condition: "少数民族学生",
    title: "双语教育经历对少数民族中学生文化认同的影响",
  },
  工商管理学: {
    field: "组织行为",
    unit: "组织",
    keywords: ["远程办公", "工作自主", "情绪耗竭", "离职倾向"],
    where: "互联网企业",
    who: "知识员工",
    stage: "入职 1 年以上",
    condition: "每周远程办公 2 天以上",
    title: "工作自主性对知识员工离职倾向的影响：情绪耗竭的中介作用",
  },
  地理学: {
    field: "城市地理",
    unit: "个人",
    keywords: ["职住分离", "通勤时间", "生活满意", "社区依恋"],
    where: "北京市五环内",
    who: "就业者",
    stage: "25–45 岁",
    condition: "单程通勤 60 分钟以上",
    title: "职住分离对城市就业者生活满意度的影响：社区依恋的中介作用",
  },
  体育学: {
    field: "运动心理",
    unit: "个人",
    keywords: ["体育锻炼", "身体意象", "自尊", "运动坚持"],
    where: "某高校",
    who: "大学生",
    stage: "本科在读",
    condition: "近一月每周运动不足 1 次",
    title: "体育锻炼对大学生自尊的影响：身体意象的中介作用",
  },
  哲学: {
    field: "科技哲学",
    unit: "个人",
    keywords: ["算法决策", "责任归因", "接受度", "科技伦理"],
    where: "某综合性大学",
    who: "本科生",
    stage: "大三、大四",
    condition: "修过伦理学课程",
    title: "责任归因对大学生算法决策接受度的影响",
  },
  中国语言文学: {
    field: "文化研究",
    unit: "个人",
    keywords: ["网络文学", "阅读动机", "身份认同", "写作实践"],
    where: "某省属高校",
    who: "中文系学生",
    stage: "本科二三年级",
    condition: "每周阅读网络小说",
    title: "网络文学阅读对中文系学生身份认同的影响：写作实践的中介作用",
  },
  外国语言文学: {
    field: "翻译学",
    unit: "文本",
    text: true,
    keywords: ["目的论", "字幕翻译", "文化负载词", "归化"],
    where: "《青春变形记》中文字幕",
    who: "电影字幕",
    stage: "大陆公映版",
    condition: "全片对白字幕",
    title: "目的论视角下《青春变形记》中文字幕中文化负载词的研究",
  },
  中国史: {
    field: "口述史",
    unit: "社区／村",
    keywords: ["口述史", "集体记忆", "地方认同", "代际传承"],
    where: "西南某古镇",
    who: "居民",
    stage: "40 岁及以上",
    condition: "家族在本地居住两代以上",
    title: "口述史实践对古镇居民地方认同的影响：代际记忆的中介作用",
  },
};

const EXAMPLE_ALIAS: Record<string, string> = {
  新闻传播: "新闻传播学",
  公共管理: "公共管理学",
  经济学: "应用经济学",
  图书情报与档案: "信息资源管理",
  管理学: "工商管理学",
  历史学: "中国史",
};

export function homeExample(discipline: string): HomeExample | null {
  return HOME_EXAMPLES[discipline] ?? HOME_EXAMPLE_BANK[discipline] ?? HOME_EXAMPLES[EXAMPLE_ALIAS[discipline] ?? ""] ?? null;
}

/** 同一条虚构材料：定量用影响句，定性用「如何形塑」，文本分析用一份文本，元分析用一批已发表研究。 */
export function paradigmExampleTitle(example: HomeExample, paradigm: "" | Paradigm): string {
  if (paradigm === "定性" && !example.text) return qualitativeTitle(example);
  if (paradigm === "文本分析") return textMaterial(example).title;
  if (paradigm === "元分析") return metaMaterial(example).title;
  return example.title;
}

export type MetaMaterial = {
  title: string;
  relation: string;
  studies: string;
  scope: string;
  extract: string;
};

/** 元分析的对象是已经发表、并报告了效应量的研究。合并效应不在示例里写。 */
export function metaMaterial(example: HomeExample): MetaMaterial {
  const { iv, dv, mechanism } = effectParts(example);
  const left = iv || example.keywords[0] || "这一条件";
  const right = dv || example.keywords[1] || "这一结果";
  const relation = `${left}与${right}`;
  return {
    title: mechanism ? `${relation}关系的元分析：${mechanism}的作用` : `${relation}关系的元分析`,
    relation,
    studies: "报告了效应量的实证研究",
    scope: "2021 年以来的中英文期刊",
    extract: mechanism ? `效应量、样本量，以及${mechanism}的测法` : "效应量、样本量与测法",
  };
}

export type TextMaterial = {
  title: string;
  name: string;
  kind: string;
  scope: string;
  part: string;
};

/** 文本分析要一份可以逐条摘录的文本。已是文本题的沿用原文；其余改成记录、年报或公开文本。 */
export function textMaterial(example: HomeExample): TextMaterial {
  if (example.text) {
    return { title: example.title, name: example.where, kind: example.who, scope: example.stage, part: example.condition };
  }
  const { dv, mechanism } = effectParts(example);
  const phenomenon = clip(mechanism || dv || example.keywords[1] || "这一现象", 12);
  const blob = `${example.where}${example.who}${example.keywords.join("")}${example.condition}${example.title}`;
  const material = pickText(example, blob);
  const part = clip(mechanism && dv ? `${dv}与${mechanism}的相关部分` : material.part, 30);
  return {
    title: `${material.name}中${phenomenon}的内容分析`,
    name: material.name,
    kind: material.kind,
    scope: material.scope,
    part,
  };
}

function qualitativeTitle(example: HomeExample): string {
  const who = example.who || "当事人";
  const { iv, dv, mechanism } = effectParts(example);
  if (iv && dv) return `${iv}如何形塑${who}的${dv}${mechanism ? `：${mechanism}的视角` : ""}`;
  return `${who}如何经历和理解这件事`;
}

function effectParts(example: HomeExample): { iv: string; dv: string; mechanism: string } {
  const stripped = example.title.replace(/^[^：]{1,20}：(?=.+的影响)/, "");
  const matched = stripped.match(/^(.+?)对(.+?)的影响(?:：(.+?)的(?:中介|调节)作用)?$/);
  if (!matched) {
    const [first, second, third] = example.keywords;
    return { iv: first || "", dv: second || "", mechanism: third || "" };
  }
  const iv = matched[1] ?? "";
  const middle = matched[2] ?? "";
  const mechanism = matched[3] ?? "";
  const dv = example.keywords.find((word) => word && word !== iv && middle.includes(word)) || middle;
  return { iv, dv, mechanism };
}

function pickText(example: HomeExample, blob: string): { name: string; kind: string; scope: string; part: string } {
  if (/实验记录|实验|实验室|规程|台架|辐射/.test(blob)) {
    return { name: book(`${clip(example.where, 12)}实验记录`), kind: "实验记录", scope: "一次课程实验", part: "规程与记录页" };
  }
  if (/病历|医师|医院|护理|门诊|药/.test(blob)) {
    return { name: "《一份教学病历》", kind: "病历文本", scope: "教学用脱敏病历", part: "病程记录" };
  }
  if (/新闻|报道|短视频|报纸|媒体/.test(blob)) {
    return { name: book(`${clip(example.where, 10)}相关报道`), kind: "新闻报道", scope: "一个栏目的样本", part: "正文" };
  }
  if (/政策|条例|办法|财政|预算|政务|法院|街道|社区/.test(blob)) {
    return { name: book(`${clip(example.where, 10)}相关办法`), kind: "政策文本", scope: "现行有效版本", part: "正文" };
  }
  if (/企业|公司|车间|研发|融资|年报/.test(blob)) {
    const place = example.where.replace(/企业$/, "") || example.where;
    return { name: book(`${clip(place, 12)}企业年报`), kind: "企业年报", scope: "最近一个会计年度", part: "相关附注" };
  }
  if (/学生|高校|课程|本科|学员|课堂|大学/.test(blob)) {
    return { name: book(`${clip(example.keywords[0] || "课程", 8)}课程材料`), kind: "课程文本", scope: "一个学期", part: "正文" };
  }
  return { name: book(`${clip(example.keywords[0] || example.where, 10)}相关文本`), kind: "公开文本", scope: "一个可核对的版本", part: "正文" };
}

function book(inner: string) {
  return `《${clip(inner, 26)}》`;
}

function clip(value: string, max: number) {
  return [...value].slice(0, max).join("");
}
