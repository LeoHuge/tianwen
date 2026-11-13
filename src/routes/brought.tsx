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
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <div>
          <p className="kicker">自带题目</p>
          <h1 className="mt-3 font-serif text-4xl leading-snug">先看这道题目能不能做</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-soft">
            把已经写好的题目贴在这里。评判先读出题目里已有的场所和现象，再指出要改的词。合格后给出研究方案和研究计划。不合格时给出用原词改写的题目。
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

          {verdict ? (
            <VerdictView
              verdict={verdict}
              onDownload={() => downloadText("研究方案与计划.md", verdict.plan)}
              onUse={(next) => {
                setTitle(next);
                setVerdict(judgeBroughtTopic({ title: next, paradigm, object, discipline }));
              }}
            />
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

function VerdictView({
  verdict,
  onDownload,
  onUse,
}: {
  verdict: BroughtVerdict;
  onDownload: () => void;
  onUse: (title: string) => void;
}) {
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
          {verdict.held.length > 0 ? (
            <div>
              <h3 className="text-lg">题目里已经有</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-ink">
                {verdict.held.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <h3 className="text-lg">判断</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-ink">
              {verdict.problems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          {verdict.rewrites.length > 0 ? (
            <div>
              <h3 className="text-lg">建议题目</h3>
              <div className="mt-3 space-y-4">
                {verdict.rewrites.map((item) => (
                  <div key={item.title} className="border border-line bg-sheet px-4 py-4">
                    <p className="text-xs tracking-widest text-brass">{item.label}</p>
                    <p className="mt-2 font-serif text-lg leading-8">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-ink-soft">{item.note}</p>
                    <Button type="button" tone="ghost" className="mt-3" onClick={() => onUse(item.title)}>
                      用这句再评判
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {verdict.revisions.length > 0 ? (
            <div>
              <h3 className="text-lg">修正</h3>
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
