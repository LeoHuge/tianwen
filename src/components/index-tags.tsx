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
        实心标签是正式收录，虚线是扩展版或入库期刊。CSSCI来源指南京大学来源期刊；CSSCI扩展版不能写成 CSSCI来源。北大核心指《中文核心期刊要目总览》。
        AMI 分为顶级、权威、核心、扩展和入库，AMI扩展期刊、AMI入库期刊都不是 AMI核心期刊。CSCD 分为核心库和扩展库。
      </p>
      <p>
        SSCI、SCIE、SCI、ESCI 是 Web of Science 里的不同索引。SSCI 为社会科学引文索引，SCIE 为科学引文索引扩展版，ESCI 为新兴来源引文索引。页面只写 SCI、没有写 SCIE 时，才标 SCI。四者分别标注，不互相替代。
      </p>
      <p>收录以打开的页面为准。页面没有写明的，标「收录未标注」。目录会调整，投稿前请再核对期刊官网或数据库。</p>
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
] as const;

function matches(hit: HotHit, filter: string) {
  if (filter === "all") return true;
  if (filter === "AMI" || filter === "CSCD") return hit.indexes.some((key) => key.startsWith(filter));
  return hit.indexes.includes(filter);
}

function levelRank(level: string) {
  const order = ["重大", "重点", "一般", "面上", "青年", "西部"];
  const index = order.indexOf(level);
  return index < 0 ? order.length : index;
}

export function HitList({ hits }: { hits: HotHit[] }) {
  const [filter, setFilter] = useState<string>("all");
  const papers = hits
    .filter((hit) => hit.source === "论文")
    .slice()
    .sort((a, b) => indexRank(a.indexes) - indexRank(b.indexes) || (b.cites || 0) - (a.cites || 0));
  const projects = hits
    .filter((hit) => hit.source !== "论文")
    .slice()
    .sort((a, b) => levelRank(a.level) - levelRank(b.level));
  const shown = papers.filter((hit) => matches(hit, filter));
  return (
    <div className="grid gap-6">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-ink">论文 · 按收录级别和被引排序（{papers.length} 篇）</p>
        </div>
        {papers.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const count = item.id === "all" ? papers.length : papers.filter((hit) => matches(hit, item.id)).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={filter === item.id ? "min-h-9 bg-ink px-2 text-xs text-on-cinnabar" : "min-h-9 border border-line px-2 text-xs text-ink"}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label} {count}
                </button>
              );
            })}
          </div>
        ) : null}
        {papers.length === 0 ? <p className="mt-2 text-sm text-muted">这一轮没有形成可核对的论文条目。</p> : null}
        <div className="mt-3 grid gap-3">
          {shown.map((hit) => (
            <article key={hit.id} className="sheet p-5">
              <p className="text-base leading-7">{hit.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <IndexTags indexes={hit.indexes} />
              </div>
              <p className="mt-2 text-sm text-muted">
                {[hit.journal ? `《${hit.journal}》` : "", hit.year, hit.cites ? `${hit.metric === "下载" ? "下载" : "被引"} ${hit.cites}` : ""].filter(Boolean).join(" · ")}
                {hit.journal || hit.year || hit.cites ? "。" : ""}
                {hit.basis}
              </p>
              <a className="mt-1 inline-block min-h-9 text-sm leading-9 text-cinnabar underline underline-offset-4" href={hit.link} target="_blank" rel="noreferrer">
                打开检索到的页面
              </a>
            </article>
          ))}
          {papers.length > 0 && shown.length === 0 ? <p className="text-sm text-muted">这一类没有。</p> : null}
        </div>
        {papers.length ? <IndexLegend /> : null}
      </div>
      <div>
        <p className="text-sm text-ink">课题立项 · 重大、重点、一般、面上、青年（{projects.length} 项）</p>
        {projects.length === 0 ? <p className="mt-2 text-sm text-muted">这一轮没有形成可核对的立项条目。</p> : null}
        <div className="mt-3 grid gap-3">
          {projects.map((hit) => (
            <article key={hit.id} className="sheet p-5">
              <p className="text-base leading-7">{hit.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={`${BASE} border border-ink text-ink`}>{hit.source}</span>
                {hit.level ? (
                  <span className={`${BASE} ${hit.level === "重大" || hit.level === "重点" ? "bg-ink text-on-cinnabar" : "border border-ink text-ink"}`}>{hit.level}项目</span>
                ) : null}
                {hit.year ? <span className={`${BASE} border border-line text-muted`}>{hit.year} 年立项</span> : null}
              </div>
              <p className="mt-2 text-sm text-muted">{hit.basis}</p>
              <a className="mt-1 inline-block min-h-9 text-sm leading-9 text-cinnabar underline underline-offset-4" href={hit.link} target="_blank" rel="noreferrer">
                打开检索到的页面
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
