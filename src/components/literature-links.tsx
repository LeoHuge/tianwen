import { literatureLinks } from "@/lib/research/literature-links";

export function LiteratureDesk({ keywords }: { keywords: string[] }) {
  const links = literatureLinks(keywords);
  if (!links.length) return null;
  return (
    <div className="mt-3 border border-line bg-paper-2 px-3 py-3">
      <p className="text-sm leading-7 text-ink-soft">
        公开预览不代查文献。用这四个词打开文献库检索，时间请收到 2021 年以后。外文收录以 Web of Science 或期刊官网为准，不要把 Google Scholar 当成 SSCI、SCIE、SCI 或 ESCI。题目仍按关键词和研究对象生成。
      </p>
      <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
        {links.map((item) => (
          <li key={item.id}>
            <a className="inline-flex min-h-11 items-baseline gap-2 text-sm" href={item.href} target="_blank" rel="noreferrer">
              <span className="text-cinnabar underline underline-offset-4">{item.name}</span>
              <span className="text-muted">{item.note}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
