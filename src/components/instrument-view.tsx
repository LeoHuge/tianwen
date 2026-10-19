import { LIKERT, type Instrument, type InstrumentItem, type InstrumentSection } from "@/lib/research/instrument";

function Options({ item }: { item: InstrumentItem }) {
  if (item.kind === "likert") {
    return (
      <div className="mt-2 flex flex-wrap gap-1" aria-hidden="true">
        {LIKERT.map((label, index) => (
          <span key={label} className="border border-line px-2 text-xs leading-6 text-muted">
            {index + 1} {label}
          </span>
        ))}
      </div>
    );
  }
  if (item.kind === "single" && item.options) {
    return (
      <div className="mt-2 flex flex-wrap gap-1" aria-hidden="true">
        {item.options.map((option) => (
          <span key={option} className="border border-line px-2 text-xs leading-6 text-muted">
            □ {option}
          </span>
        ))}
      </div>
    );
  }
  if (item.kind === "fill") return <p className="mt-1 text-xs text-muted">{item.note ?? "____"}</p>;
  if (item.kind === "open") return <div className="mt-2 h-10 border border-dashed border-line" aria-hidden="true" />;
  return null;
}

function Section({ section }: { section: InstrumentSection }) {
  return (
    <section className="border border-line bg-paper p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-lg text-ink">{section.title}</h3>
        {section.varRole ? (
          <span className="bg-ink px-1.5 text-xs leading-6 text-on-cinnabar">
            {section.variable} · {section.varRole}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm leading-7 text-muted">{section.purpose}</p>
      {section.definition ? (
        <p className="mt-2 text-sm leading-7 text-ink-soft">
          <span className="text-ink">操作化定义：</span>
          {section.definition}
        </p>
      ) : null}
      {section.reference ? (
        <p className="mt-1 text-sm leading-7 text-ink-soft">
          <span className="text-ink">可参考：</span>
          {section.reference}
        </p>
      ) : null}
      {section.scale ? <p className="mt-1 text-xs leading-6 text-muted">计分：{section.scale}</p> : null}
      <ol className="mt-3 space-y-3">
        {section.items.map((item, index) =>
          item.kind === "note" ? (
            <li key={`${section.id}-${index}`} className="text-sm leading-7 text-ink-soft">
              {item.text}
            </li>
          ) : (
            <li key={`${section.id}-${index}`} className="text-sm leading-7">
              <p>
                {item.code ? <span className="mr-1 tabular-nums text-muted">{item.code}</span> : null}
                {item.text}
                {item.reverse ? <span className="ml-2 border border-note px-1 text-xs text-note">反向计分</span> : null}
                {item.check ? <span className="ml-2 border border-warn px-1 text-xs text-warn">注意力检测</span> : null}
                {item.kind === "single" && item.note ? <span className="ml-2 text-xs text-muted">（{item.note}）</span> : null}
              </p>
              <Options item={item} />
              {item.probes?.length ? (
                <ul className="mt-1 space-y-1 border-l border-line pl-3 text-ink-soft">
                  {item.probes.map((probe) => (
                    <li key={probe}>追问：{probe}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border-t border-line pt-4">
      <h3 className="text-lg">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-7 text-ink-soft">
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export function InstrumentView({ doc }: { doc: Instrument }) {
  const counts = doc.sections.reduce((sum, section) => sum + section.items.filter((item) => item.kind !== "note").length, 0);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {doc.kind === "scale" ? "问卷" : "访谈提纲"}共 {doc.sections.length} 部分、{counts} {doc.kind === "scale" ? "题" : "条"}，预计 {doc.minutes} 分钟。
      </p>
      <div className="border border-ink bg-paper p-4">
        <p className="text-xs text-muted">{doc.kind === "scale" ? "卷首语" : "开场白（照读）"}</p>
        {doc.intro.split("\n").map((line) => (
          <p key={line} className="mt-1 text-sm leading-7">
            {line}
          </p>
        ))}
      </div>
      {doc.sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
      <section className="border-t border-line pt-4">
        <h3 className="text-lg">{doc.kind === "scale" ? "变量与题项对照表" : "初始编码框架"}</h3>
        <div className="mt-2 overflow-x-auto border border-line">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-paper-2 text-ink">
              <tr>
                <th className="px-3 py-2 font-medium">变量</th>
                <th className="px-3 py-2 font-medium">名称</th>
                <th className="px-3 py-2 font-medium">题项</th>
                <th className="px-3 py-2 font-medium">编码</th>
              </tr>
            </thead>
            <tbody>
              {doc.codebook.map((row) => (
                <tr key={`${row.variable}-${row.name}`} className="border-t border-line align-top">
                  <td className="px-3 py-2">{row.variable}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2 tabular-nums">{row.items}</td>
                  <td className="px-3 py-2 text-ink-soft">{row.coding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Block title={doc.kind === "scale" ? "质量控制：哪些问卷算无效" : "质量控制"} items={doc.quality} />
      <Block title={doc.kind === "scale" ? "预调查" : "预访谈"} items={doc.pilot} />
      <Block title="分析计划" items={doc.analysis} />
    </div>
  );
}
