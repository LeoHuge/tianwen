import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { subjectSentence } from "@/lib/research/subject";
import {
  checkTitle,
  composeTitle,
  editSuggestions,
  effectivePattern,
  makeQuestion,
  patternFits,
  patternsFor,
  replaceParts,
  slotOptions,
  TWEAK_LIMIT,
} from "@/lib/research/topic-parts";
import type { Candidate, ChosenTopic, Paradigm, SubjectParts, TopicParts } from "@/lib/research/types";
import { Button, controlClass } from "./primitives";

function slotLabels(paradigm: Paradigm, pattern: string): Record<keyof TopicParts, string> {
  return paradigm === "定性"
    ? { object: "研究对象", iv: "情境 / 实践", dv: "要理解的现象", mechanism: "关联 / 过程", method: "副标题（数据从哪来）" }
    : {
        object: "研究对象",
        iv: "自变量 X",
        dv: "因变量 Y",
        mechanism: pattern === "effect-mod" ? "调节变量 W" : "中介变量 M",
        method: "副标题（数据从哪来）",
      };
}

export function PartsChips({ parts, paradigm, pattern, title }: { parts: TopicParts; paradigm: Paradigm; pattern: string; title: string }) {
  const labels = slotLabels(paradigm, effectivePattern(pattern, title));
  const keys: (keyof TopicParts)[] = ["object", "iv", "mechanism", "dv"];
  return (
    <dl className="mt-3 flex flex-wrap gap-2 text-xs">
      {keys
        .filter((key) => parts[key].trim())
        .map((key) => (
          <div key={key} className="flex border border-line">
            <dt className="bg-paper-2 px-1.5 leading-6 text-muted">{labels[key]}</dt>
            <dd className="px-1.5 leading-6 text-ink">{parts[key]}</dd>
          </div>
        ))}
    </dl>
  );
}

export function TopicCard({
  item,
  index,
  active,
  onChoose,
}: {
  item: Candidate;
  index: number;
  active: boolean;
  onChoose?: () => void;
}) {
  return (
    <article className={active ? "sheet p-5 ring-1 ring-ink" : "sheet p-5"}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>选题 {index + 1}</span>
        <span>· {item.paradigm}</span>
        <span>· {item.source === "model" ? "模型按检索结果生成" : "按规则组合"}</span>
      </div>
      <h3 className="mt-2 text-lg leading-8">{item.title}</h3>
      <p className="mt-2 text-sm leading-7 text-ink-soft">{item.question}</p>
      <PartsChips parts={item.parts} paradigm={item.paradigm} pattern={item.pattern} title={item.title} />
      <p className="mt-2 text-xs leading-6 text-muted">{item.basis}</p>
      {onChoose ? (
        <Button className="mt-3" tone={active ? "ink" : "primary"} onClick={onChoose}>
          {active ? "已选这一题" : "选这一题"}
        </Button>
      ) : null}
    </article>
  );
}

export function LockedTopics({ count }: { count: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="sheet relative overflow-hidden p-5" aria-label={`选题 ${index + 1}，付费后显示`}>
          <p className="text-xs text-muted">选题 {index + 1}</p>
          <div className="mt-3 space-y-2" aria-hidden="true">
            <div className="h-4 w-11/12 bg-line" />
            <div className="h-4 w-8/12 bg-line" />
            <div className="h-3 w-full bg-paper-2" />
            <div className="h-3 w-10/12 bg-paper-2" />
          </div>
          <p className="mt-3 text-xs text-ink">已生成 · 付费后弹出</p>
        </div>
      ))}
    </div>
  );
}

export function TopicsReveal({
  open,
  onOpenChange,
  candidates,
  chosenTitle,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Candidate[];
  chosenTitle: string;
  onChoose: (index: number) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-[2px]" />
        <Dialog.Content className="sheet fixed top-1/2 left-1/2 z-50 max-h-[92vh] w-[min(100%-2rem,46rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6">
          <Dialog.Title className="text-2xl text-ink">你的三个选题</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm leading-7 text-muted">
            选一个，下一步可以按建议修改。没选的也会留在页面上，之后还能换。
          </Dialog.Description>
          <div className="mt-4 grid gap-3">
            {candidates.map((item, index) => (
              <TopicCard key={item.title} item={item} index={index} active={chosenTitle === item.title} onChoose={() => onChoose(index)} />
            ))}
          </div>
          <Dialog.Close asChild>
            <Button tone="ghost" className="mt-4 w-full sm:w-auto">
              先关掉，稍后再选
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * 改题对话框：不让随意重写。先给几条建议一键套用，再用下拉换某一格的词，
 * 最后只允许在 6 个字以内微调措辞。
 */
export function TopicEditDialog({
  open,
  onOpenChange,
  topic,
  original,
  subject,
  keywords,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: ChosenTopic;
  original: Candidate | null;
  subject: SubjectParts;
  keywords: string[];
  onSave: (next: ChosenTopic) => void;
}) {
  const [parts, setParts] = useState<TopicParts>(topic.parts);
  const [pattern, setPattern] = useState(topic.pattern);
  const [tweak, setTweak] = useState(topic.title);

  useEffect(() => {
    if (!open) return;
    setParts(topic.parts);
    setPattern(topic.pattern);
    setTweak(topic.title);
  }, [open, topic]);

  const fallbackPattern = useMemo(
    () => patternsFor(topic.paradigm).find((item) => patternFits(item.id, parts))?.id ?? patternsFor(topic.paradigm)[0]!.id,
    [parts, topic.paradigm],
  );
  const { base, rebuilt } = useMemo(() => {
    if (pattern === "keep") {
      const replaced = replaceParts(topic.title, topic.parts, parts);
      if (replaced) return { base: replaced, rebuilt: false };
      return { base: composeTitle(parts, fallbackPattern, topic.paradigm), rebuilt: true };
    }
    return { base: composeTitle(parts, pattern, topic.paradigm), rebuilt: false };
  }, [pattern, parts, topic, fallbackPattern]);

  useEffect(() => {
    setTweak(base);
  }, [base]);

  const labels = slotLabels(topic.paradigm, effectivePattern(pattern, base));
  const check = checkTitle(tweak, base, parts);
  const suggestions = editSuggestions({ ...topic, parts, pattern }, subject);
  const unchanged = tweak.trim() === topic.title;

  function save() {
    const finalPattern = pattern === "keep" && rebuilt ? fallbackPattern : pattern;
    const partsChanged = JSON.stringify(parts) !== JSON.stringify(topic.parts);
    onSave({
      ...topic,
      title: tweak.trim(),
      parts,
      pattern: finalPattern,
      question: partsChanged || finalPattern !== topic.pattern ? makeQuestion(parts, topic.paradigm, subjectSentence(subject, false)) : topic.question,
      edits: topic.edits + 1,
    });
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[92vh] w-[min(100%-2rem,44rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-line bg-paper-2 p-5">
          <Dialog.Title className="text-2xl text-ink">按建议修改选题</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm leading-7 text-muted">
            现在的题目：{topic.title}
          </Dialog.Description>

          {suggestions.length ? (
            <div className="mt-4">
              <p className="text-sm text-ink">修改建议（点一下套用）</p>
              <div className="mt-2 grid gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="border border-line bg-paper px-3 py-2 text-left hover:border-ink"
                    onClick={() => {
                      setParts(item.parts);
                      setPattern(item.pattern);
                    }}
                  >
                    <span className="block text-sm text-ink">{item.label}</span>
                    <span className="block text-xs leading-6 text-muted">{item.detail}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm text-ink">题目句式</span>
              <select className={controlClass} value={pattern} onChange={(event) => setPattern(event.target.value)}>
                <option value="keep">保留原题措辞，只换改动的词</option>
                {patternsFor(topic.paradigm).map((item) => (
                  <option key={item.id} value={item.id} disabled={!patternFits(item.id, parts)}>
                    {item.label}
                    {patternFits(item.id, parts) ? "" : "（要先填中介/调节变量）"}
                  </option>
                ))}
              </select>
            </label>
            {(["object", "iv", "dv", "mechanism", "method"] as const).map((key) => {
              const options = slotOptions({ ...topic, parts }, subject, keywords, key);
              return (
                <label key={key} className={key === "object" || key === "method" ? "block sm:col-span-2" : "block"}>
                  <span className="mb-1 block text-sm text-ink">{labels[key]}</span>
                  <select className={controlClass} value={parts[key]} onChange={(event) => setParts({ ...parts, [key]: event.target.value })}>
                    {options.map((option) => (
                      <option key={option || "none"} value={option}>
                        {option || (key === "method" ? "（不加副标题）" : "（不写）")}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs text-muted">改后的题目</p>
            <p className="mt-1 text-lg leading-8 text-ink">{base}</p>
            {rebuilt ? <p className="mt-1 text-xs text-note">原题里找不到要换的词，已按句式重新组合。</p> : null}
            <label className="mt-3 block">
              <span className="mb-1 block text-sm text-ink">
                小改措辞（最多改 {TWEAK_LIMIT} 个字，已改 {check.distance} 个）
              </span>
              <textarea className={`${controlClass} min-h-20`} value={tweak} maxLength={64} onChange={(event) => setTweak(event.target.value)} />
            </label>
            {check.problems.map((line) => (
              <p key={line} className="mt-1 text-sm text-warn">
                {line}
              </p>
            ))}
            <p className="mt-2 text-xs leading-6 text-muted">
              为什么不能随便改：问卷的变量、筛选题和样本量都从这一题来。大改请用上面的建议和下拉选项，系统会同时检查变量是否还对得上。
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" disabled={!check.ok || unchanged} onClick={save}>
              确认修改
            </Button>
            {original && original.title !== topic.title ? (
              <Button
                tone="ghost"
                className="flex-1"
                onClick={() => {
                  onSave({ ...original, index: topic.index, originalTitle: original.title, edits: topic.edits + 1 });
                  onOpenChange(false);
                }}
              >
                恢复成原来的选题
              </Button>
            ) : null}
            <Dialog.Close asChild>
              <Button tone="ghost" className="flex-1">
                不改了
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
