import { PLANS, yuan } from "@/lib/research/catalog";
import type { PlanId } from "@/lib/research/types";
import { Button } from "./primitives";

export function PlanCards({
  ids,
  onBuy,
}: {
  ids: PlanId[];
  onBuy: (id: PlanId) => void;
}) {
  const plans = ids.map((id) => PLANS.find((plan) => plan.id === id)).filter((plan) => plan != null);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map((plan) => (
        <article
          key={plan.id}
          className={plan.recommended ? "sheet flex flex-col p-6 ring-1 ring-ink" : "sheet flex flex-col p-6"}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-brass">{plan.eyebrow}</p>
              <h3 className="mt-1 text-2xl">{plan.name}</h3>
            </div>
            {plan.recommended ? <span className="bg-ink px-2 py-1 text-xs text-on-cinnabar">多数人选</span> : null}
          </div>
          <p className="mt-3 font-serif text-4xl tabular-nums">{yuan(plan.price)}</p>
          <p className="mt-3 text-sm text-ink-soft">{plan.summary}</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm">
            {plan.points.map((point) => (
              <li key={point} className="border-t border-line pt-2">
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-brass">{plan.revisions}</p>
          <Button className="mt-4" tone={plan.recommended ? "primary" : "ink"} onClick={() => onBuy(plan.id)}>
            扫码购买（演示）
          </Button>
        </article>
      ))}
    </div>
  );
}
