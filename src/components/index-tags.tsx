import { useState } from "react";
import { indexInfo, indexRank } from "@/lib/research/indexes";
import type { HotHit } from "@/lib/research/types";

const BASE = "inline-flex items-center gap-1 px-1.5 text-xs leading-6 whitespace-nowrap";

export function IndexTag({ id }: { id: string }) {
  const info = indexInfo(id);
  if (info.key === "CSSCI扩展") {
    return (
      <span title={info.title} className={`${BASE} border border-dashed border-warn bg-paper text-warn`}>
        {info.label}
      </span>
    );
  }
  if (info.extended) {
    return (
      <span title={info.title} className={`${BASE} border border-dashed border-note text-note`}>
        {info.label}
      </span>
    );
  }
  if (info.unknown) {
    return (
      <span title={info.title} className={`${BASE} border border-line text-muted`}>
        {info.label} · {info.tier}
      </span>
    );
  }
  return (
    <span title={info.title} className={`${BASE} bg-ink text-on-cinnabar`}>
      {info.label}
    </span>
  );
}

export function IndexTags({ indexes }: { indexes: string[] }) {
  if (!indexes.length) {
    return <span className={`${BASE} border border-line text-muted`} title="检索页面上没看到收录信息，投稿前到期刊官网或知网核对">收录未标注</span>;
  }
  return (
    <>
      {indexes.map((key) => (
        <IndexTag key={key} id={key} />
      ))}
    </>
  );
}

export function IndexLegend() {
  return (
    <div className="mt-3 border-t border-line pt-3 text-xs leading-6 text-muted">
      <p>
        实心标签是正式收录，虚线是扩展版或入库期刊。CSSCI 来源期刊和扩展版来源期刊采用南京大学 CSSCI（2025-2026），扩展版单独标注，不写成来源期刊。北大核心采用《中文核心期刊要目总览》2023年版（第十版）。
        AMI 采用《中国人文社会科学期刊 AMI 综合评价报告（2022）》，分顶级、权威、核心、扩展和入库。CSCD 采用 2025-2026 年度来源期刊，分核心库和扩展库。
      </p>
      <p>
        SSCI、SCIE、SCI、ESCI 是 Web of Science 中的不同索引。SSCI 为社会科学引文索引，SCIE 为科学引文索引扩展版，ESCI 为新兴来源引文索引。页面写 SCI、未写 SCIE 时，标为 SCI。EI 是 Elsevier 的工程索引（Compendex），与 SCI、SCIE 分别标注。只标注期刊收录。
      </p>
        <p>收录以所打开的页面为准。页面没有写明的，标「收录未标注」。投稿前请再核对期刊官网或数据库。</p>
    </div>
  );
}

const FILTERS = [
  { id: "all", label: "全部" },
  { id: "CSSCI", label: "CSSCI" },
  { id: "CSSCI扩展", label: "CSSCI扩展" },
  { id: "北核", label: "北大核心" },
  { id: "AMI", label: "AMI" },
  { id: "CSCD", label: "CSCD" },
  { id: "SSCI", label: "SSCI" },
  { id: "SCIE", label: "SCIE" },
  { id: "SCI", label: "SCI" },
  { id: "ESCI", label: "ESCI" },
  { id: "EI", label: "EI" },
] as const;

function matches(hit: HotHit, filter: string) {
  if (filter === "all") return true;
  if (filter === "AMI" || filter === "CSCD") return hit.indexes.some((key) => key.startsWith(filter));
  return hit.indexes.includes(filter);
}

const PROJECT_FILTERS = [
  { id: "all", label: "全部" },
  { id: "国社科", label: "国社科" },
  { id: "国自然", label: "国自然" },
  { id: "重大", label: "重大" },
  { id: "重点", label: "重点" },
  { id: "一般", label: "一般" },
  { id: "面上", label: "面上" },
  { id: "青年", label: "青年" },
  { id: "西部", label: "西部" },
] as const;

function projectMatches(hit: HotHit, filter: string) {
  if (filter === "all") return true;
  if (filter === "国社科" || filter === "国自然") return hit.source === filter;
  return hit.level === filter;
}

function readingLine(hit: HotHit) {
  return [
    hit.population ? `对象 ${hit.population}` : "",
    hit.method ? `方法 ${hit.method}` : "",
    hit.variables ? `变量 ${hit.variables}` : "",
    hit.theme ? `主题 ${hit.theme}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function FilterBar({
  items,
  active,
  onChange,
}: {
  items: { id: string; label: string; count: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={active === item.id ? "min-h-9 bg-ink px-2 text-xs text-on-cinnabar" : "min-h-9 border border-line px-2 text-xs text-ink"}
          onClick={() => onChange(item.id)}
        >
          {item.label} {item.count}
        </button>
      ))}
    </div>
  );
}

function levelRank(level: string) {
  const order = ["重大", "重点", "一般", "面上", "青年", "西部"];
  const index = order.indexOf(level);
  return index < 0 ? order.length : index;
}

export function HitList({ hits, keywords = [] }: { hits: HotHit[]; keywords?: string[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const papers = hits
    .filter((hit) => hit.source === "论文")
    .slice()
    .sort((a, b) => indexRank(a.indexes) - indexRank(b.indexes) || (b.cites || 0) - (a.cites || 0));
  const projects = hits
    .filter((hit) => hit.source !== "论文")
    .slice()
    .sort((a, b) => levelRank(a.level) - levelRank(b.level));
  const shown = papers.filter((hit) => matches(hit, filter));
  const shownProjects = projects.filter((hit) => projectMatches(hit, projectFilter));
  return (
    <div className="grid gap-6">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-ink">论文 · 按收录级别和被引排序（{papers.length} 篇）</p>
        </div>
        {papers.length ? (
          <FilterBar
            active={filter}
            onChange={setFilter}
            items={FILTERS.map((item) => ({
              id: item.id,
              label: item.label,
              count: item.id === "all" ? papers.length : papers.filter((hit) => matches(hit, item.id)).length,
            }))}
          />
        ) : null}
        {papers.length === 0 ? <p className="mt-2 text-sm text-muted">这一轮没有形成可核对的论文条目。</p> : null}
        <div className="mt-3 grid gap-3">
          {shown.map((hit) => {
            const reading = readingLine(hit);
            return (
              <article key={hit.id} className="sheet p-5">
                <p className="text-base leading-7">{hit.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <IndexTags indexes={hit.indexes} />
                </div>
                {reading ? <p className="mt-2 text-sm leading-6 text-ink">{reading}</p> : null}
                <p className="mt-2 text-sm text-muted">
                  {[hit.journal ? `《${hit.journal}》` : "", hit.year, hit.cites ? `${hit.metric === "下载" ? "下载" : "被引"} ${hit.cites}` : ""].filter(Boolean).join(" · ")}
                  {hit.journal || hit.year || hit.cites ? "。" : ""}
                  {hit.basis}
                </p>
                <a className="mt-1 inline-block min-h-9 text-sm leading-9 text-cinnabar underline underline-offset-4" href={hit.link} target="_blank" rel="noreferrer">
                  打开检索到的页面
                </a>
              </article>
            );
          })}
          {papers.length > 0 && shown.length === 0 ? <p className="text-sm text-muted">这一类没有。</p> : null}
        </div>
        {papers.length ? <IndexLegend /> : null}
      </div>
      <div>
        <p className="text-sm text-ink">课题立项 · 按基金和类别（{projects.length} 项）</p>
        <FilterBar
          active={projectFilter}
          onChange={setProjectFilter}
          items={PROJECT_FILTERS.map((item) => ({
            id: item.id,
            label: item.label,
            count: item.id === "all" ? projects.length : projects.filter((hit) => projectMatches(hit, item.id)).length,
          }))}
        />
        {projects.length === 0 ? (
          <div className="mt-2 text-sm leading-7 text-muted">
            <p>这一轮没有从国家社科基金项目数据库形成可核对的立项。</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {keywords
                .map((word) => word.trim())
                .filter((word) => word.length >= 2)
                .slice(0, 4)
                .map((word) => (
                  <a
                    key={word}
                    className="text-cinnabar underline underline-offset-4"
                    href={`https://fz.people.com.cn/skygb/sk/index.php/Index/seach?xmname=${encodeURIComponent(word)}&p=1`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    项目数据库 · {word}
                  </a>
                ))}
            </div>
          </div>
        ) : null}
        <div className="mt-3 grid gap-3">
          {shownProjects.map((hit) => {
            const reading = readingLine(hit);
            return (
              <article key={hit.id} className="sheet p-5">
                <p className="text-base leading-7">{hit.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`${BASE} border border-ink text-ink`}>{hit.source}</span>
                  {hit.level ? (
                    <span className={`${BASE} ${hit.level === "重大" || hit.level === "重点" ? "bg-ink text-on-cinnabar" : "border border-ink text-ink"}`}>{hit.level}项目</span>
                  ) : null}
                  {hit.year ? <span className={`${BASE} border border-line text-muted`}>{hit.year} 年立项</span> : null}
                </div>
                {reading ? <p className="mt-2 text-sm leading-6 text-ink">{reading}</p> : null}
                <p className="mt-2 text-sm text-muted">{hit.basis}</p>
                <a className="mt-1 inline-block min-h-9 text-sm leading-9 text-cinnabar underline underline-offset-4" href={hit.link} target="_blank" rel="noreferrer">
                  打开检索到的页面
                </a>
              </article>
            );
          })}
          {projects.length > 0 && shownProjects.length === 0 ? <p className="text-sm text-muted">这一类没有。</p> : null}
        </div>
        {projects.length ? (
          <p className="mt-3 border-t border-line pt-3 text-xs leading-6 text-muted">
            国社科来自国家社科基金项目数据库或年度立项公示。重大、重点、一般、青年、西部是国社科的项目类别；面上、青年也见于国家自然科学基金。页面没写类别的，不归进这些栏。
          </p>
        ) : null}
      </div>
    </div>
  );
}
