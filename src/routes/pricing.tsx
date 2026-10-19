import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PlanCards } from "@/components/plan-cards";
import { PayDialog } from "@/components/pay-dialog";
import { Shell } from "@/components/shell";
import { HUMAN_REVIEW, yuan } from "@/lib/research/catalog";
import type { PlanId } from "@/lib/research/types";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

const MATRIX: string[][] = [
  ["交付", "开题包", "分析包", "成稿包", "三包合买"],
  ["检索中外文论文与立项，标注 CSSCI、AMI 各级、CSCD、SSCI、SCIE、SCI、ESCI", "含", "含", "含", "含"],
  ["具体论文题目", "3 个", "含", "含", "含"],
  ["按建议修改选题", "含", "含", "含", "含"],
  ["问卷或访谈提纲", "不含", "含", "含", "含"],
  ["样本量计算书（公式与出处）", "不含", "含", "写入成稿", "写入成稿"],
  ["知情同意与质量控制", "不含", "含", "含", "含"],
  ["描述统计", "本地", "本地", "本地", "本地"],
  ["成稿初稿", "不含", "不含", "含", "含"],
  ["结构性修订", "0 轮", "题项 1 轮", "1 轮", "3 轮"],
  ["文献逐条核对", "不做", "不做", "不做", "不做"],
  ["统计结果", "你自己算", "你自己算", "你自己算", "你自己算"],
];

function PricingPage() {
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [open, setOpen] = useState(false);
  const buy = (id: PlanId) => {
    setPlanId(id);
    setOpen(true);
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[1200px] px-5 py-14 md:px-10">
        <p className="kicker">人民币</p>
        <h1 className="mt-3 font-serif text-4xl leading-snug">天问开题，先看这张表</h1>
        <div className="mt-6 max-w-3xl overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-4 font-normal">怎么选</th>
                <th className="py-2 pr-4 font-normal">一共</th>
                <th className="py-2 pr-4 font-normal">先付开题包</th>
                <th className="py-2 pr-4 font-normal">再补</th>
                <th className="py-2 font-normal">能改</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="py-3 pr-4">只要选题</td>
                <td className="py-3 pr-4 tabular-nums">¥199</td>
                <td className="py-3 pr-4 tabular-nums">¥199</td>
                <td className="py-3 pr-4">—</td>
                <td className="py-3">按建议改题</td>
              </tr>
              <tr className="border-b border-line">
                <td className="py-3 pr-4">三包合买</td>
                <td className="py-3 pr-4 tabular-nums">¥1,099</td>
                <td className="py-3 pr-4 tabular-nums">¥199</td>
                <td className="py-3 pr-4 tabular-nums">¥900</td>
                <td className="py-3">三轮</td>
              </tr>
              <tr className="border-b border-line">
                <td className="py-3 pr-4">成稿包</td>
                <td className="py-3 pr-4 tabular-nums">¥799</td>
                <td className="py-3 pr-4 tabular-nums">¥199</td>
                <td className="py-3 pr-4 tabular-nums">¥600</td>
                <td className="py-3">一轮</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">分析包</td>
                <td className="py-3 pr-4 tabular-nums">¥599</td>
                <td className="py-3 pr-4" colSpan={2}>
                  直接买，含代码
                </td>
                <td className="py-3">不含成稿</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-2xl text-base leading-8 text-ink-soft">
          选题单独付：付 ¥199，检索出的三个题马上弹出，可以按建议修改。要问卷、样本量计算书和初稿，再补差价，传上数据就出初稿。
        </p>

        <div className="mt-8">
          <PlanCards ids={["topic", "survey", "buyout", "revise3", "year", "code"]} onBuy={buy} />
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <button className="sheet p-6 text-left transition hover:border-ink" onClick={() => buy("addon-buyout")}>
            <p className="text-xs text-brass">一修用完之后</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">{yuan(230)}</p>
            <p className="mt-2 text-sm text-ink-soft">一修用完了，再改一轮是这个价。不会因此变成无限改。</p>
          </button>
          <button className="sheet p-6 text-left transition hover:border-ink" onClick={() => buy("addon-revise")}>
            <p className="text-xs text-brass">三修或年匣用完后</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">{yuan(140)}</p>
            <p className="mt-2 text-sm text-ink-soft">三轮用完之后，再改一轮。改的是结构和表述，不是把题推倒重来。</p>
          </button>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl">各档差在哪</h2>
          <div className="mt-4 max-w-full overflow-x-auto border border-line">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <tbody>
                {MATRIX.map((row, index) => (
                  <tr key={row[0]} className={index === 0 ? "bg-ink text-on-cinnabar" : "border-t border-line bg-paper-2"}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${index}-${cellIndex}`} className="px-3 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-2xl">这些钱对应什么</h2>
            <ul className="mt-4 space-y-3 text-base leading-7 text-ink-soft">
              <li>开题包 ¥199。检索、三个题、按建议改题。觉得题不行就停，不用再花钱。</li>
              <li>分析包 ¥599。一份能发出去的问卷或访谈提纲，样本量按公式算出并写明出处。不含替你去发。</li>
              <li>成稿包 ¥799，已买开题包补 ¥600。从问卷到初稿，能改一轮。不含文献核对，不含统计代码。</li>
              <li>三包合买 ¥1,099，已买开题包补 ¥900。同样的交付，开题后最常改的三轮都在里面。第 4 轮 ¥140。</li>
              <li>年匣 ¥6,120。给带学生的人，8 个题，每个仍是三轮。</li>
              <li>统计代码 ¥2,520。要 Stata、R 或访谈编码表，得另外买。</li>
            </ul>
          </div>
          <aside className="border border-brass bg-brass-soft p-5 text-ink">
            <p className="text-xs">不在扫码里</p>
            <h3 className="mt-2 text-2xl">{HUMAN_REVIEW.name}</h3>
            <p className="mt-2 font-serif text-4xl tabular-nums">{yuan(HUMAN_REVIEW.price)}</p>
            <p className="mt-3 text-sm">{HUMAN_REVIEW.note}</p>
          </aside>
        </section>

        <section className="mt-12 border border-line p-5">
          <h2 className="text-2xl">付款前先看退款</h2>
          <p className="mt-3 text-base leading-8 text-ink-soft">
            还没生成，可以退。开题包的三个题弹出即视为交付，不退。一修的初稿出来之后，不因为文笔不满意退款。三修没用来改的轮次，按剩下的轮数退差价。年匣里已经打开的题不退；一个题都还没开始、购买后 7 天内，可以全退。现在这个页面不会真扣款，所以也没有真退款。
          </p>
        </section>
      </div>
      <PayDialog planId={planId} open={open} onOpenChange={setOpen} />
    </Shell>
  );
}
