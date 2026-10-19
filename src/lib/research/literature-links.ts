export type LiteratureLink = {
  id: string;
  name: string;
  note: string;
  href: string;
};

/** The four keywords, ready to paste into a literature database. Empty until all four are usable. */
export function literatureQuery(keywords: string[]): string {
  const words = keywords.map((word) => word.trim()).slice(0, 4);
  if (words.length < 4 || words.some((word) => word.length < 2)) return "";
  return words.join(" ");
}

export function literatureLinks(keywords: string[]): LiteratureLink[] {
  const query = literatureQuery(keywords);
  if (!query) return [];
  const q = encodeURIComponent(query);
  return [
    {
      id: "cnki",
      name: "中国知网",
      note: "中文期刊，按主题",
      href: `https://kns.cnki.net/kns8s/defaultresult/index?kw=${q}`,
    },
    {
      id: "wanfang",
      name: "万方数据",
      note: "中文论文",
      href: `https://s.wanfangdata.com.cn/paper?q=${q}`,
    },
    {
      id: "vip",
      name: "维普",
      note: "中文期刊",
      href: `https://www.cqvip.com/search?k=${q}`,
    },
    {
      id: "scholar",
      name: "Google Scholar",
      note: "外文，2021 年起",
      href: `https://scholar.google.com/scholar?as_ylo=2021&q=${q}`,
    },
    {
      id: "nsfc",
      name: "国家自然科学基金",
      note: "结题项目",
      href: `https://kd.nsfc.cn/finalSearchList?s=${q}`,
    },
    {
      id: "nssfc",
      name: "国家社科基金",
      note: "打开后按项目名称检索",
      href: "https://fz.people.com.cn/skygb/sk/index.php/Index/seach",
    },
  ];
}
