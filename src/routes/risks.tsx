import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { RISK_GROUPS } from "@/lib/research/risks";

export const Route = createFileRoute("/risks")({ component: RisksPage });

function RisksPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <p className="kicker">学术规范</p>
        <h1 className="mt-3 font-serif text-4xl leading-snug">文献、数据和成稿如何处理</h1>
        <p className="mt-4 text-sm text-ink-soft">
          下面说明交付范围，以及文献、数字、修订和退款如何处理。文稿中的事实和出处由您核对。
        </p>
        <div className="mt-8">
          {RISK_GROUPS.map((group) => (
            <section key={group.id} id={group.id} className="border-t border-line py-6">
              <h2 className="text-2xl">{group.title}</h2>
              <p className="mt-2 text-sm text-muted">{group.lead}</p>
              <div className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <details key={item.title} className="border border-line bg-sheet px-4 transition hover:border-frame">
                    <summary className="flex min-h-11 items-center py-3">
                      <span className="text-sm text-ink">{item.title}</span>
                    </summary>
                    <p className="text-sm text-ink-soft">{item.detail}</p>
                    <p className="mt-2 pb-4 text-sm text-ink">{item.mitigation}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Shell>
  );
}
