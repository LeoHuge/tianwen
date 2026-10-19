import { useState } from "react";
import { checkSubject, SUBJECT_EXAMPLES, SUBJECT_MISTAKES, SUBJECT_SLOTS } from "@/lib/research/subject";
import type { SubjectParts } from "@/lib/research/types";
import { controlClass } from "./primitives";

const QUALIFIERS: { name: string; examples: string }[] = [
  { name: "在哪", examples: "省、市、县区；某类学校、园区、医院；城市社区或农村社区" },
  { name: "年龄 / 年级 / 身份", examples: "60 岁及以上、18–35 岁、本科二三年级、入职 1 年以上、一线护士" },
  { name: "状态 / 经历", examples: "独居半年以上、近一年用过线上问诊、每周夜班 3 次以上、随迁 2 年以上" },
  { name: "调查时间", examples: "2025 年 3–6 月" },
  { name: "不包括", examples: "失能卧床者、未满 18 周岁者、研究者本人的学生" },
];

export function SubjectBuilder({
  value,
  onChange,
  disabled = false,
  legacy = "",
}: {
  value: SubjectParts;
  onChange: (next: SubjectParts) => void;
  disabled?: boolean;
  legacy?: string;
}) {
  const [guide, setGuide] = useState(false);
  const check = checkSubject(value);
  return (
    <div className="sheet p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-base text-ink">研究对象</p>
        <button type="button" className="min-h-11 text-sm text-cinnabar underline underline-offset-4" onClick={() => setGuide((open) => !open)}>
          {guide ? "收起写法" : "怎么写、要哪些限定词"}
        </button>
      </div>
      <p className="mt-1 text-sm leading-7 text-ink-soft">
        研究对象 = <b>在哪</b> + <b>年龄/年级/身份</b> + <b>状态/经历</b> + <b>是谁</b>。「在哪」「是谁」必填，中间两格至少写一个。每一格都会变成问卷的一道筛选题，写不清就筛不出人。
      </p>
      {guide ? (
        <div className="mt-3 space-y-3 border-t border-line pt-3 text-sm leading-7">
          <p className="text-ink">常见的限定词</p>
          <ul className="space-y-1 text-ink-soft">
            {QUALIFIERS.map((item) => (
              <li key={item.name}>
                <span className="text-ink">{item.name}：</span>
                {item.examples}
              </li>
            ))}
          </ul>
          <p className="text-ink">三种常见写错</p>
          <ul className="space-y-2">
            {SUBJECT_MISTAKES.map((item) => (
              <li key={item.bad} className="text-ink-soft">
                <span className="mr-2 text-warn line-through">{item.bad}</span>
                {item.why}
                <br />
                改成：<span className="text-ink">{item.good}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {legacy && !check.sentence ? <p className="mt-3 text-sm text-note">你之前写的是「{legacy}」。请把它拆进下面几格。</p> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {SUBJECT_SLOTS.map((slot) => (
          <label key={slot.key} className="block">
            <span className="mb-1 flex flex-wrap items-center gap-2 text-sm text-ink">
              {slot.label}
              {slot.need === "must" ? <span className="text-xs text-warn">必填</span> : null}
              {slot.need === "one" ? <span className="text-xs text-muted">与下一格至少写一个</span> : null}
              {check.filled[slot.key] ? <span className="text-xs text-ok">已写</span> : null}
            </span>
            <input
              className={controlClass}
              value={value[slot.key]}
              placeholder={`例：${slot.placeholder}`}
              maxLength={slot.key === "who" ? 16 : 30}
              disabled={disabled}
              onChange={(event) => onChange({ ...value, [slot.key]: event.target.value })}
            />
            {slot.hint ? <span className="mt-1 block text-xs text-muted">{slot.hint}</span> : null}
          </label>
        ))}
      </div>
      <div className="mt-4 border-t border-line pt-3">
        <p className="text-xs text-muted">合起来是</p>
        <p className="mt-1 text-base leading-8 text-ink">{check.sentence || "（还没写）"}</p>
        {check.missing.length ? <p className="mt-2 text-sm text-warn">还缺：{check.missing.join("；")}</p> : null}
        {check.problems.map((line) => (
          <p key={line} className="mt-1 text-sm text-warn">
            {line}
          </p>
        ))}
        {check.warnings.map((line) => (
          <p key={line} className="mt-1 text-sm text-note">
            {line}
          </p>
        ))}
      </div>
      {disabled ? null : (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">套一个例子再改：</span>
          {SUBJECT_EXAMPLES.map((example) => (
            <button key={example.label} type="button" className="min-h-9 border border-line bg-paper px-2 text-xs" onClick={() => onChange(example.parts)}>
              {example.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
