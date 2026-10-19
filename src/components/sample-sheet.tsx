import { useMemo, useState } from "react";
import { ANALYSES, computeSample, issueLabel, sanitize, type Analysis, type SamplePlan, type SampleStep } from "@/lib/research/sample-size";
import { Button, controlClass } from "./primitives";

function NumberField({
  label,
  hint,
  value,
  step = 1,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ink">{label}</span>
      <input
        className={controlClass}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? <span className="mt-1 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

function Step({ step, emphasis }: { step: SampleStep; emphasis: boolean }) {
  return (
    <li className={emphasis ? "border-l-2 border-ink pl-3" : "border-l border-line pl-3"}>
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm text-ink">{step.label}</span>
        <span className="font-serif text-xl tabular-nums text-ink">
          {step.result} <span className="text-xs text-muted">{step.unit}</span>
        </span>
      </p>
      <p className="mt-1 font-mono text-xs leading-6 text-ink-soft">{step.formula}</p>
      <p className="mt-1 text-sm leading-7 text-ink-soft">{step.work}</p>
      {step.cite.length ? <p className="mt-1 text-xs text-brass">依据：{step.cite.join("；")}</p> : null}
      {step.note ? <p className="mt-1 text-xs leading-6 text-muted">{step.note}</p> : null}
    </li>
  );
}

export function SampleSheet({
  plan: rawPlan,
  kind,
  onChange,
}: {
  plan: SamplePlan;
  kind: "scale" | "interview";
  onChange: (next: SamplePlan) => void;
}) {
  const plan = sanitize(rawPlan);
  const result = useMemo(() => computeSample(rawPlan, kind), [rawPlan, kind]);
  const [copied, setCopied] = useState(false);
  const set = (patch: Partial<SamplePlan>) => onChange({ ...rawPlan, ...patch });
  const toggle = (id: Analysis) => {
    const next = plan.analyses.includes(id) ? plan.analyses.filter((item) => item !== id) : [...plan.analyses, id];
    set({ analyses: next.length ? next : [id] });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-4">
        {kind === "scale" ? (
          <>
            <fieldset>
              <legend className="mb-2 text-sm text-ink">要做哪些分析（每一项都要单独满足，取最大的那个）</legend>
              <div className="grid gap-2">
                {ANALYSES.map((item) => (
                  <label key={item.id} className="flex min-h-11 items-start gap-2 border border-line bg-paper px-3 py-2">
                    <input type="checkbox" className="mt-1.5" checked={plan.analyses.includes(item.id)} onChange={() => toggle(item.id)} />
                    <span>
                      <span className="block text-sm text-ink">{item.label}</span>
                      <span className="block text-xs text-muted">{item.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-1 block text-sm text-ink">预期效应量</span>
              <select className={controlClass} value={plan.effect} onChange={(event) => set({ effect: event.target.value as SamplePlan["effect"] })}>
                <option value="small">小（f² = 0.02，d = 0.2）</option>
                <option value="medium">中等（f² = 0.15，d = 0.5）</option>
                <option value="large">大（f² = 0.35，d = 0.8）</option>
              </select>
              <span className="mt-1 block text-xs leading-5 text-muted">
                不知道就选中等，这是 Cohen（1988）的通行约定；同类研究报告过效应量时，以它为准。α = 0.05、功效 0.80 为社科通行设定。
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {plan.analyses.includes("regression") ? (
                <NumberField
                  label="预测变量个数 k"
                  hint="已按问卷填好：自变量、中介/调节变量和基本信息题。虚拟变量、交互项要逐个算。"
                  value={rawPlan.predictors}
                  min={1}
                  max={40}
                  onChange={(value) => set({ predictors: value })}
                />
              ) : null}
              {plan.analyses.includes("efa") || plan.analyses.includes("cfa") ? (
                <NumberField label="量表题数 p" hint="已按问卷填好，只算李克特题，不含注意力题。" value={rawPlan.items} min={2} max={150} onChange={(value) => set({ items: value })} />
              ) : null}
              {plan.analyses.includes("cfa") ? (
                <NumberField label="因子（变量）个数 m" value={rawPlan.factors} min={1} max={15} onChange={(value) => set({ factors: value })} />
              ) : null}
              {plan.analyses.includes("anova") ? (
                <NumberField label="比较的组数 g" value={rawPlan.groups} min={2} max={12} onChange={(value) => set({ groups: value })} />
              ) : null}
              {plan.analyses.includes("estimate") ? (
                <>
                  <label className="block">
                    <span className="mb-1 block text-sm text-ink">置信度</span>
                    <select className={controlClass} value={plan.confidence} onChange={(event) => set({ confidence: event.target.value as SamplePlan["confidence"] })}>
                      <option value="90">90%</option>
                      <option value="95">95%</option>
                      <option value="99">99%</option>
                    </select>
                  </label>
                  <NumberField label="允许误差 e" hint="0.05 即上下约 5 个百分点" step={0.01} value={rawPlan.margin} min={0.01} max={0.2} onChange={(value) => set({ margin: value })} />
                  <NumberField label="预计比例 p" hint="不知道就填 0.5" step={0.05} value={rawPlan.proportion} min={0.01} max={0.99} onChange={(value) => set({ proportion: value })} />
                  <NumberField label="总体人数 N" hint="知道总人数（如社区登记的老人数）就填，不知道填 0" value={rawPlan.population} min={0} onChange={(value) => set({ population: value })} />
                </>
              ) : null}
              <NumberField
                label="预计无效问卷比例（%）"
                hint="有预调查就用预调查的剔除比例"
                value={Math.round(plan.invalidRate * 100)}
                min={0}
                max={60}
                onChange={(value) => set({ invalidRate: value / 100 })}
              />
            </div>
            <label className="flex min-h-11 items-start gap-2 border border-line bg-paper px-3 py-2">
              <input type="checkbox" className="mt-1.5" checked={plan.cluster} onChange={(event) => set({ cluster: event.target.checked })} />
              <span>
                <span className="block text-sm text-ink">按社区、学校、单位整群抽样</span>
                <span className="block text-xs text-muted">同一群里的人彼此相似，要乘设计效应（Kish, 1965）</span>
              </span>
            </label>
            {plan.cluster ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField label="每群大约多少人 m" value={rawPlan.clusterSize} min={2} onChange={(value) => set({ clusterSize: value })} />
                <NumberField label="组内相关系数 ρ" hint="不知道取 0.05" step={0.01} value={rawPlan.icc} min={0} max={0.5} onChange={(value) => set({ icc: value })} />
              </div>
            ) : null}
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="要比较几类人（亚群体数 g）"
              hint="只访谈一类人填 1；要比较城乡、男女这类差别，就填类别数"
              value={rawPlan.subgroups}
              min={1}
              max={12}
              onChange={(value) => set({ subgroups: value })}
            />
            <NumberField label="每类访谈数" hint="10+3 规则即 13；最少 6" value={rawPlan.perGroup} min={6} max={40} onChange={(value) => set({ perGroup: value })} />
            <NumberField label="预计爽约比例（%）" value={Math.round(plan.dropout * 100)} min={0} max={100} onChange={(value) => set({ dropout: value / 100 })} />
          </div>
        )}
      </div>

      <div className="border border-ink bg-paper p-5">
        <p className="text-xs tracking-widest text-muted">至少</p>
        <p className="mt-1 font-serif text-5xl tabular-nums text-ink">{result.target}</p>
        <p className="text-sm text-ink-soft">{result.unit}</p>
        <p className="mt-3 text-base text-ink">{issueLabel(result)}</p>
        <p className="mt-1 text-xs text-muted">由「{result.requiredBy}」决定。每一步都能用公式复算，不是拍脑袋的经验数。</p>
        <ol className="mt-5 space-y-4">
          {result.steps.map((step) => (
            <Step key={step.key} step={step} emphasis={step.label === result.requiredBy} />
          ))}
          {result.adjust.map((step) => (
            <Step key={step.key} step={step} emphasis={false} />
          ))}
        </ol>
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-sm text-ink">写进论文的一句话</p>
          <p className="mt-1 text-sm leading-7 text-ink-soft">{result.sentence}</p>
          <Button
            tone="ghost"
            className="mt-2"
            onClick={() => {
              void navigator.clipboard?.writeText(`${result.sentence}\n\n${result.references.join("\n")}`).then(() => setCopied(true));
            }}
          >
            {copied ? "已复制" : "复制这句和参考文献"}
          </Button>
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-sm text-ink">参考文献（都是公开出版物，可以在图书馆或数据库核对）</p>
          <ul className="mt-2 space-y-1 text-xs leading-6 text-ink-soft">
            {result.references.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-xs leading-6 text-muted">
          人数达到下限，只说明统计上够用，不等于样本有代表性，也不等于一定显著。代表性取决于怎么抽样。
        </p>
      </div>
    </div>
  );
}
