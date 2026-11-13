/** 期刊收录标签。扩展版一律单独成签，不与正式版混写。 */
export type IndexInfo = {
  key: string;
  label: string;
  db: "CSSCI" | "北核" | "AMI" | "CSCD" | "SSCI" | "SCIE" | "SCI" | "ESCI" | "EI";
  tier: string;
  extended: boolean;
  unknown: boolean;
  title: string;
};

export const INDEX_TABLE: IndexInfo[] = [
  { key: "CSSCI", label: "CSSCI来源（2025-2026）", db: "CSSCI", tier: "来源期刊", extended: false, unknown: false, title: "CSSCI（2025-2026）来源期刊，南京大学中国社会科学研究评价中心 2025 年 8 月审定。不是 2023-2024 年版。" },
  { key: "CSSCI扩展", label: "CSSCI扩展版（2025-2026）", db: "CSSCI", tier: "扩展版", extended: true, unknown: false, title: "CSSCI（2025-2026）扩展版来源期刊，与来源期刊分别标注。" },
  { key: "北核", label: "北大核心（2023年版）", db: "北核", tier: "核心", extended: false, unknown: false, title: "《中文核心期刊要目总览》2023年版，第十版，北京大学出版社 2024 年 3 月出版。目前采用这一版。" },
  { key: "AMI顶级", label: "AMI顶级（2022）", db: "AMI", tier: "顶级", extended: false, unknown: false, title: "《中国人文社会科学期刊 AMI 综合评价报告（2022）》顶级期刊。目前按 2022 年报告标注。" },
  { key: "AMI权威", label: "AMI权威（2022）", db: "AMI", tier: "权威", extended: false, unknown: false, title: "AMI 综合评价报告（2022）权威期刊。不是顶级。" },
  { key: "AMI核心", label: "AMI核心（2022）", db: "AMI", tier: "核心", extended: false, unknown: false, title: "AMI 综合评价报告（2022）核心期刊。不是顶级，也不是权威。" },
  { key: "AMI扩展", label: "AMI扩展（2022）", db: "AMI", tier: "扩展", extended: true, unknown: false, title: "AMI 综合评价报告（2022）扩展期刊。不是 AMI 核心期刊。" },
  { key: "AMI入库", label: "AMI入库（2022）", db: "AMI", tier: "入库", extended: true, unknown: false, title: "AMI 综合评价报告（2022）入库期刊，低于扩展期刊，也不是 AMI 核心期刊。" },
  { key: "AMI", label: "AMI（2022，请核对级别）", db: "AMI", tier: "请核对级别", extended: false, unknown: true, title: "页面写了 AMI，未写明 2022 年报告中的顶级、权威、核心、扩展或入库。请按该报告核对后再引用。" },
  { key: "CSCD核心", label: "CSCD核心库（2025-2026）", db: "CSCD", tier: "核心库", extended: false, unknown: false, title: "中国科学引文数据库 2025-2026 年度来源期刊核心库。不是扩展库，也不是 2023-2024 年度。" },
  { key: "CSCD扩展", label: "CSCD扩展库（2025-2026）", db: "CSCD", tier: "扩展库", extended: true, unknown: false, title: "中国科学引文数据库 2025-2026 年度来源期刊扩展库，不是核心库。" },
  { key: "CSCD", label: "CSCD（2025-2026，请核对库别）", db: "CSCD", tier: "请核对库别", extended: false, unknown: true, title: "页面写了 CSCD，未写明 2025-2026 年度是核心库还是扩展库。请核对后再引用。" },
  { key: "SSCI", label: "SSCI", db: "SSCI", tier: "社会科学", extended: false, unknown: false, title: "Social Sciences Citation Index，Web of Science 社会科学引文索引" },
  { key: "SCIE", label: "SCIE", db: "SCIE", tier: "科学扩展", extended: false, unknown: false, title: "Science Citation Index Expanded，Web of Science 科学引文索引扩展版。与 SCI 分别标注。" },
  { key: "SCI", label: "SCI", db: "SCI", tier: "科学", extended: false, unknown: false, title: "页面写的是 SCI。科学引文索引扩展版为 SCIE，二者分别标注。" },
  { key: "ESCI", label: "ESCI", db: "ESCI", tier: "新兴来源", extended: false, unknown: false, title: "Emerging Sources Citation Index，Web of Science 新兴来源引文索引。不是 SSCI，也不是 SCIE。" },
  { key: "EI", label: "EI", db: "EI", tier: "工程索引", extended: false, unknown: false, title: "Engineering Index / Compendex，Elsevier 工程索引。与 SCI、SCIE 分别标注。此处标注期刊收录。" },
];

const ORDER = INDEX_TABLE.map((item) => item.key);

export function indexInfo(key: string): IndexInfo {
  return (
    INDEX_TABLE.find((item) => item.key === key) ?? {
      key,
      label: key,
      db: "CSSCI",
      tier: "",
      extended: false,
      unknown: true,
      title: key,
    }
  );
}

/** 把模型或网页上的各种写法归到固定标签上；对不上的丢掉，不猜。 */
export function normalizeIndex(raw: unknown): string | null {
  const text = String(raw ?? "")
    .replace(/[\s()（）【】[\]·•\-_/、,，.。:：]/g, "")
    .toUpperCase();
  if (!text) return null;
  if (/C扩|CSSCIE|南大核心扩展/.test(text) || (text.includes("CSSCI") && text.includes("扩展"))) return "CSSCI扩展";
  if (text.includes("CSSCI") || /^南大核心$|^C刊$/.test(text)) return "CSSCI";
  if (/北核|北大核心|中文核心|北京大学中文核心|核心期刊要目/.test(text)) return "北核";
  if (text.includes("AMI")) {
    if (text.includes("顶级")) return "AMI顶级";
    if (text.includes("权威")) return "AMI权威";
    if (text.includes("扩展")) return "AMI扩展";
    if (text.includes("入库")) return "AMI入库";
    if (text.includes("核心")) return "AMI核心";
    return "AMI";
  }
  if (text.includes("CSCD")) {
    if (text.includes("扩展")) return "CSCD扩展";
    if (text.includes("核心")) return "CSCD核心";
    return "CSCD";
  }
  if (text.includes("ESCI") || text.includes("EMERGINGSOURCESCITATION") || text.includes("新兴来源")) return "ESCI";
  if (text.includes("SCIE") || text.includes("SCIENCECITATIONINDEXEXPANDED") || text.includes("科学引文索引扩展")) return "SCIE";
  if (text.includes("SSCI") || text.includes("SOCIALSCIENCESCITATION") || text.includes("社会科学引文索引")) return "SSCI";
  if (!text.includes("CSSCI") && !text.includes("ESCI") && !text.includes("SCIE") && !text.includes("SSCI") && (text === "SCI" || text.includes("SCIENCECITATIONINDEX") || text.includes("科学引文索引"))) {
    return "SCI";
  }
  if (text.includes("会议")) return null;
  if (text.includes("COMPENDEX") || text.includes("ENGINEERINGINDEX") || text.includes("ENGINEERINGVILLAGE") || text.includes("工程索引") || /^EI(源刊|期刊|收录|检索)?$/.test(text)) return "EI";
  return null;
}

export function normalizeIndexes(list: unknown): string[] {
  const items = Array.isArray(list) ? list : typeof list === "string" ? list.split(/[,，、;；/]/) : [];
  const keys = new Set<string>();
  for (const item of items) {
    const key = normalizeIndex(item);
    if (key) keys.add(key);
  }
  // 同一个库已有具体级别时，去掉「级别待核」的那一枚。
  if ([...keys].some((key) => key.startsWith("AMI") && key !== "AMI")) keys.delete("AMI");
  if ([...keys].some((key) => key.startsWith("CSCD") && key !== "CSCD")) keys.delete("CSCD");
  return [...keys].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
}

/** 论文排序用：CSSCI 来源和 SSCI、SCIE、SCI 排最前，其次北大核心、AMI 核心以上、CSCD 核心，再其次扩展版。 */
export function indexRank(indexes: string[]) {
  if (indexes.some((key) => ["CSSCI", "SSCI", "SCIE", "SCI", "EI"].includes(key))) return 0;
  if (indexes.some((key) => ["北核", "AMI顶级", "AMI权威", "AMI核心", "CSCD核心"].includes(key))) return 1;
  if (indexes.includes("ESCI") || indexes.some((key) => indexInfo(key).extended)) return 2;
  if (indexes.length) return 3;
  return 4;
}
