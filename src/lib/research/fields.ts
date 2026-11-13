import { GRADUATE, UNDERGRAD, type CatalogKind } from "./discipline-catalog";

export type Track = "本科" | "研究生";

/** 研究方向只覆盖已经写过示例的学科，不是国家二级学科目录。 */
const DIRECTIONS: Record<string, string[]> = {
  社会学: ["家庭社会学", "城市社会学", "农村社会学", "组织与劳动", "社会分层", "人口与流动", "越轨与犯罪", "医疗与健康", "环境社会学", "文化社会学", "网络社会学", "社会运动", "人口与社会", "人口与健康", "人口流动", "老龄化", "文化人类学", "社会人类学", "医学人类学", "都市人类学", "生态人类学", "民族志方法"],
  社会工作: ["老年社会工作", "家庭社会工作", "社区社会工作", "医务社会工作", "青少年社会工作", "学校社会工作", "残障社会工作", "司法社会工作", "灾害社会工作"],
  公共管理学: ["公共政策", "基层治理", "社会保障", "应急管理", "城市治理", "数字政府", "非营利组织", "绩效评估", "土地与住房"],
  公共管理: ["公共政策", "基层治理", "社会保障", "应急管理", "城市治理", "数字政府", "非营利组织", "绩效评估", "土地与住房"],
  新闻传播学: ["新闻学", "传播学", "网络与新媒体", "计算传播", "健康传播", "政治传播", "视觉传播", "国际传播", "媒介产业"],
  新闻传播: ["新闻学", "传播学", "网络与新媒体", "计算传播", "健康传播", "政治传播", "视觉传播", "国际传播", "媒介产业"],
  教育学: ["高等教育", "课程与教学", "教育社会学", "学前教育", "职业教育", "教育技术", "教育经济与管理", "比较教育", "特殊教育", "教师教育"],
  心理学: ["社会心理", "发展心理", "应用心理", "临床与咨询", "认知心理", "教育心理", "组织与管理心理", "健康心理"],
  政治学: ["政治社会学", "比较政治", "中国政府与政治", "国际关系", "公共政策过程", "政治思想", "地方政府"],
  应用经济学: ["劳动经济", "发展经济", "公共经济", "健康经济", "教育经济", "农业经济", "区域与城市经济", "行为经济", "人口经济"],
  经济学: ["劳动经济", "发展经济", "公共经济", "健康经济", "教育经济", "农业经济", "区域与城市经济", "行为经济", "人口经济"],
  法学: ["法社会学", "劳动与社会保障法", "民法", "行政法", "环境法", "网络与数据法", "刑法"],
  马克思主义理论: ["马克思主义基本原理", "思想政治教育", "中国近现代史基本问题", "马克思主义中国化"],
  信息资源管理: ["图书馆学", "情报学", "档案学", "数据治理", "科学计量"],
  图书情报与档案: ["图书馆学", "情报学", "档案学", "数据治理", "科学计量"],
  人口学: ["人口与社会", "人口与健康", "人口流动", "老龄化"],
  民族学: ["民族社会学", "民族经济", "民族文化", "跨境民族"],
  工商管理学: ["组织行为", "人力资源管理", "公共部门管理", "创新与创业", "战略管理"],
  管理学: ["组织行为", "人力资源管理", "公共部门管理", "创新与创业", "战略管理"],
  地理学: ["人文地理", "城市地理", "乡村地理", "社会地理"],
  体育学: ["体育社会学", "运动心理", "体育管理", "学校体育"],
  哲学: ["伦理学", "科技哲学", "政治哲学", "中国哲学"],
  中国语言文学: ["现当代文学", "语言学及应用", "比较文学", "文化研究"],
  外国语言文学: ["翻译学", "英语笔译", "英语口译", "外国文学", "比较文学", "国别与区域研究"],
  中国史: ["中国近现代史", "社会史", "口述史"],
  历史学: ["中国近现代史", "社会史", "口述史", "世界史"],
  人类学: ["文化人类学", "社会人类学", "医学人类学", "都市人类学", "生态人类学", "民族志方法"],
};

export type DisciplineChoice = {
  track: Track;
  category: string;
  branch: string;
  discipline: string;
  field: string;
};

export function categoriesOf(track: Track) {
  return (track === "本科" ? UNDERGRAD : GRADUATE).map((item) => item.name);
}

export function branchesOf(category: string) {
  return UNDERGRAD.find((item) => item.name === category)?.classes.map((item) => item.name) ?? [];
}

export function subjectsOf(track: Track, category: string, branch: string) {
  if (track === "本科") {
    const group = UNDERGRAD.find((item) => item.name === category)?.classes.find((item) => item.name === branch);
    return (group?.majors ?? []).map((name) => ({ name, kind: undefined as CatalogKind | undefined }));
  }
  return (GRADUATE.find((item) => item.name === category)?.disciplines ?? []).map((item) => ({ name: item.name, kind: item.kind }));
}

export function subjectTag(kind: CatalogKind | undefined) {
  if (kind === "专业") return "（专业学位）";
  if (kind === "专硕") return "（专业学位，仅硕士）";
  return "";
}

export function directionsOf(name: string) {
  return DIRECTIONS[name] ?? [];
}

export function fieldsOf(name: string) {
  return directionsOf(name);
}

export function locate(track: Track, discipline: string) {
  if (!discipline) return null;
  if (track === "研究生") {
    for (const category of GRADUATE) {
      if (category.disciplines.some((item) => item.name === discipline)) return { category: category.name, branch: "" };
    }
    return null;
  }
  for (const category of UNDERGRAD) {
    for (const group of category.classes) {
      if (group.majors.includes(discipline)) return { category: category.name, branch: group.name };
    }
  }
  return null;
}

export function choiceFrom(track: Track, category: string, branch: string, discipline: string, field: string): DisciplineChoice {
  const directions = directionsOf(discipline);
  return {
    track,
    category,
    branch: track === "本科" ? branch : "",
    discipline,
    field: directions.includes(field) ? field : (directions[0] ?? ""),
  };
}

export function chooseTrack(track: Track): DisciplineChoice {
  return track === "本科"
    ? { track, category: "法学", branch: "社会学类", discipline: "社会学", field: directionsOf("社会学")[0] ?? "" }
    : { track, category: "法学", branch: "", discipline: "社会学", field: directionsOf("社会学")[0] ?? "" };
}

export function chooseCategory(track: Track, category: string): DisciplineChoice {
  if (track === "本科") {
    const branch = branchesOf(category)[0] ?? "";
    const discipline = subjectsOf(track, category, branch)[0]?.name ?? "";
    return { track, category, branch, discipline, field: directionsOf(discipline)[0] ?? "" };
  }
  const discipline = subjectsOf(track, category, "")[0]?.name ?? "";
  return { track, category, branch: "", discipline, field: directionsOf(discipline)[0] ?? "" };
}

export function chooseBranch(category: string, branch: string): DisciplineChoice {
  const discipline = subjectsOf("本科", category, branch)[0]?.name ?? "";
  return { track: "本科", category, branch, discipline, field: directionsOf(discipline)[0] ?? "" };
}

export function chooseDiscipline(track: Track, category: string, branch: string, discipline: string): DisciplineChoice {
  return choiceFrom(track, category, branch, discipline, "");
}
