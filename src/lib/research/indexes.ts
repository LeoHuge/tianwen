/** 期刊收录标签。扩展版一律单独成签，不与正式版混写。 */
export type IndexInfo = {
  key: string;
  label: string;
  db: "CSSCI" | "北核" | "AMI" | "CSCD" | "SSCI" | "SCIE" | "SCI" | "ESCI";
  tier: string;
  extended: boolean;
  unknown: boolean;
  title: string;
};

export const INDEX_TABLE: IndexInfo[] = [
  { key: "CSSCI", label: "CSSCI来源", db: "CSSCI", tier: "来源期刊", extended: false, unknown: false, title: "CSSCI 来源期刊（南京大学中国社会科学研究评价中心）" },
  { key: "CSSCI扩展", label: "CSSCI扩展版", db: "CSSCI", tier: "扩展版", extended: true, unknown: false, title: "CSSCI 扩展版来源期刊。不是 CSSCI 来源期刊，不能写成 CSSCI 来源或 C 刊。" },
  { key: "北核", label: "北大核心", db: "北核", tier: "核心", extended: false, unknown: false, title: "北京大学《中文核心期刊要目总览》收录" },
  { key: "AMI顶级", label: "AMI顶级期刊", db: "AMI", tier: "顶级", extended: false, unknown: false, title: "中国社会科学评价研究院 AMI 综合评价顶级期刊" },
  { key: "AMI权威", label: "AMI权威期刊", db: "AMI", tier: "权威", extended: false, unknown: false, title: "AMI 综合评价权威期刊" },
  { key: "AMI核心", label: "AMI核心期刊", db: "AMI", tier: "核心", extended: false, unknown: false, title: "AMI 综合评价核心期刊" },
  { key: "AMI扩展", label: "AMI扩展期刊", db: "AMI", tier: "扩展", extended: true, unknown: false, title: "AMI 综合评价扩展期刊。不是 AMI 核心期刊，不能写成 AMI 核心。" },
  { key: "AMI入库", label: "AMI入库期刊", db: "AMI", tier: "入库", extended: true, unknown: false, title: "AMI 综合评价入库期刊，低于扩展期刊，也不是 AMI 核心期刊。" },
  { key: "AMI", label: "AMI", db: "AMI", tier: "级别待核", extended: false, unknown: true, title: "页面只写了 AMI，没写是核心还是扩展，用前核对" },
  { key: "CSCD核心", label: "CSCD核心库", db: "CSCD", tier: "核心库", extended: false, unknown: false, title: "中国科学引文数据库核心库" },
  { key: "CSCD扩展", label: "CSCD扩展库", db: "CSCD", tier: "扩展库", extended: true, unknown: false, title: "中国科学引文数据库扩展库，不是核心库" },
  { key: "CSCD", label: "CSCD", db: "CSCD", tier: "库别待核", extended: false, unknown: true, title: "页面只写了 CSCD，没写是核心库还是扩展库，用前核对" },
  { key: "SSCI", label: "SSCI", db: "SSCI", tier: "社会科学", extended: false, unknown: false, title: "Social Sciences Citation Index，Web of Science 社会科学引文索引" },
  { key: "SCIE", label: "SCIE", db: "SCIE", tier: "科学扩展", extended: false, unknown: false, title: "Science Citation Index Expanded，Web of Science 科学引文索引扩展版。不要写成 SCI。" },
  { key: "SCI", label: "SCI", db: "SCI", tier: "科学", extended: false, unknown: false, title: "页面只写了 SCI，没有写 SCIE。科学引文索引现在的正式库是 SCIE，这里不把 SCI 写成 SCIE。" },
  { key: "ESCI", label: "ESCI", db: "ESCI", tier: "新兴来源", extended: false, unknown: false, title: "Emerging Sources Citation Index，Web of Science 新兴来源引文索引。不是 SSCI，也不是 SCIE。" },
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
  if (indexes.some((key) => ["CSSCI", "SSCI", "SCIE", "SCI"].includes(key))) return 0;
  if (indexes.some((key) => ["北核", "AMI顶级", "AMI权威", "AMI核心", "CSCD核心"].includes(key))) return 1;
  if (indexes.includes("ESCI") || indexes.some((key) => indexInfo(key).extended)) return 2;
  if (indexes.length) return 3;
  return 4;
}
