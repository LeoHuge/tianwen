import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { Button, Field, controlClass } from "@/components/primitives";
import { judgeBroughtTopic, type BroughtVerdict } from "@/lib/research/brought-topic";
import type { Paradigm } from "@/lib/research/types";

export const Route = createFileRoute("/brought")({ component: BroughtPage });

const PARADIGMS: { id: "" | Paradigm; label: string }[] = [
  { id: "", label: "按题目判断" },
  { id: "定量", label: "定量" },
  { id: "定性", label: "定性" },
  { id: "文本分析", label: "文本分析" },
  { id: "元分析", label: "元分析" },
];

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function BroughtPage() {
  const [title, setTitle] = useState("");
  const [paradigm, setParadigm] = useState<"" | Paradigm>("");
  const [object, setObject] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [verdict, setVerdict] = useState<BroughtVerdict | null>(null);
  const [empty, setEmpty] = useState(false);

  function judge() {
    if (!title.trim()) {
      setEmpty(true);
      setVerdict(null);
      return;
    }
    setEmpty(false);
    setVerdict(judgeBroughtTopic({ title, paradigm, object, discipline }));
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] md:px-6">
        <div>
          <p className="kicker">自带题目</p>
          <h1 className="mt-3 font-serif text-4xl leading-snug">先看这道题目能不能做</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-soft">
            把已经写好的题目贴在这里。合格后给出研究方案和研究计划。不合格时只说明要改哪里。文献出处和结果数字仍在核对、核算或摘录之后写入。
          </p>

          <div className="mt-8 space-y-5">
            <Field label="题目" hint="8 到 60 字。写明条件和结果，或一份文本里的一个现象。">
              <textarea
                className={`${controlClass} min-h-28 resize-y`}
                value={title}
                maxLength={80}
                placeholder="例如：契约环境对企业研发投入的影响：融资约束的中介作用"
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
            <div>
              <p className="mb-2 text-sm text-ink">做法</p>
              <div className="flex flex-wrap gap-2">
                {PARADIGMS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    aria-pressed={paradigm === item.id}
                    className={`min-h-11 border px-3 text-sm ${paradigm === item.id ? "border-ink bg-ink text-on-cinnabar" : "border-line bg-sheet text-ink"}`}
                    onClick={() => setParadigm(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <Field label="对象或文本" hint="一类人、企业、场所，或书名号里的那一份文本。题目里已经写明可以留空。">
              <input className={controlClass} value={object} onChange={(event) => setObject(event.target.value)} />
            </Field>
            <Field label="学科" hint="选填。写入方案时按这个学科安排文献。">
              <input className={controlClass} value={discipline} onChange={(event) => setDiscipline(event.target.value)} />
            </Field>
            <Button type="button" onClick={judge}>
              评判这道题目
            </Button>
            {empty ? <p className="text-sm text-warn">请先贴上题目。</p> : null}
          </div>

          {verdict ? <VerdictView verdict={verdict} onDownload={() => downloadText("研究方案与计划.md", verdict.plan)} /> : null}
        </div>

        <aside className="sheet relative h-fit overflow-hidden p-7 text-ink md:sticky md:top-24">
          <span className="absolute inset-y-0 left-0 w-1 bg-brass" aria-hidden="true" />
          <p className="kicker">Cursor 技能</p>
          <h2 className="mt-4 font-serif text-2xl leading-snug">同一套标准，放进 Cursor</h2>
          <p className="mt-3 text-sm leading-7 text-ink-soft">
            下载后放到 `.cursor/skills/brought-topic/SKILL.md`。之后把题目交给 Cursor，合格就写研究方案和研究计划，不合格就说明怎么改。
          </p>
          <a
            className="mt-6 inline-flex min-h-11 items-center justify-center border border-ink px-4 text-sm text-ink transition hover:bg-ink hover:text-on-cinnabar"
            href="/skills/brought-topic/SKILL.md"
            download="SKILL.md"
          >
            下载技能
          </a>
          <p className="mt-6 text-sm leading-7 text-muted">这张表只评判您贴上的题目，不改动开题页里已有的题目。</p>
        </aside>
      </div>
    </Shell>
  );
}

function VerdictView({ verdict, onDownload }: { verdict: BroughtVerdict; onDownload: () => void }) {
  return (
    <section className="mt-10 border-t border-line pt-8" aria-live="polite">
      <p className="kicker">{verdict.paradigm ? `${verdict.paradigm} · ` : ""}{verdict.ok ? "合格" : "需要修改"}</p>
      <h2 className="mt-3 font-serif text-3xl">{verdict.title}</h2>
      {verdict.paradigmNote ? <p className="mt-3 text-sm text-ink-soft">{verdict.paradigmNote}</p> : null}
      {verdict.ok ? (
        <>
          <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-7 text-ink">{verdict.plan}</pre>
          <Button type="button" tone="ghost" className="mt-4" onClick={onDownload}>
            下载研究方案和计划
          </Button>
        </>
      ) : (
        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-lg">现在的问题</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-ink">
              {verdict.problems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          {verdict.revisions.length > 0 ? (
            <div>
              <h3 className="text-lg">可以这样改</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-ink">
                {verdict.revisions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
