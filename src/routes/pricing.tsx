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
  ["检索中外文论文与立项，标注 CSSCI、AMI 各级、CSCD、SSCI、SCIE、SCI、ESCI、EI", "含", "含", "含", "含"],
  ["具体论文题目", "3 个", "含", "含", "含"],
  ["按建议修改选题", "含", "含", "含", "含"],
  ["问卷或访谈提纲", "不含", "含", "含", "含"],
  ["样本量计算书（公式与出处）", "不含", "含", "写入成稿", "写入成稿"],
  ["知情同意与质量控制", "不含", "含", "含", "含"],
  ["描述统计", "在本机计算", "在本机计算", "在本机计算", "在本机计算"],
  ["成稿初稿", "不含", "不含", "含", "含"],
  ["结构性修订", "按建议改题", "题项 1 轮", "1 轮", "3 轮人工协助"],
  ["文献出处", "保持检索原文", "保持检索原文", "保持检索原文", "保持检索原文"],
  ["统计结果", "按您的数据填写", "按您的数据填写", "按您的数据填写", "按您的数据填写"],
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
        <h1 className="mt-3 font-serif text-4xl leading-snug">各档费用与交付</h1>
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
                <td className="py-3 pr-4 tabular-nums">¥1,199</td>
                <td className="py-3 pr-4 tabular-nums">¥199</td>
                <td className="py-3 pr-4 tabular-nums">¥1,000</td>
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
          选题可单独购买：支付 ¥199 后即可查看三个题目，并按建议修改。如需问卷、样本量计算书和初稿，再支付差额。上传数据后交付初稿。
        </p>

        <div className="mt-8">
          <PlanCards ids={["topic", "survey", "buyout", "revise3", "year", "code"]} onBuy={buy} />
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <button className="sheet p-6 text-left transition hover:border-ink" onClick={() => buy("addon-buyout")}>
            <p className="text-xs text-brass">成稿包修订用完之后</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">{yuan(230)}</p>
            <p className="mt-2 text-sm text-ink-soft">成稿包的一轮修订用完之后，按此价格再增加一轮结构性修订。</p>
          </button>
          <button className="sheet p-6 text-left transition hover:border-ink" onClick={() => buy("addon-revise")}>
            <p className="text-xs text-brass">三包合买或年匣用完之后</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">{yuan(140)}</p>
            <p className="mt-2 text-sm text-ink-soft">三轮用完之后，按此价格再增加一轮。修订用于调整结构和表述。</p>
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
              <li>开题包 ¥199。检索、三个题目，以及按建议修改。查看题目后，如不继续，无需购买后续内容。</li>
              <li>分析包 ¥599。一份可发放的问卷或访谈提纲，样本量按公式计算并写明出处。问卷由您发放。</li>
              <li>成稿包 ¥799，已购买开题包的补 ¥600。从问卷到初稿，含一轮修订。文献保持检索原文。统计代码另行提供。</li>
              <li>三包合买 ¥1,199，已购买开题包的补 ¥1,000。同样的交付，三轮结构性修订由人工协助。第 4 轮 ¥140。</li>
              <li>年匣 ¥6,120。供带学生的教研室使用，8 个题目，每个含三轮修订。</li>
              <li>统计代码 ¥2,520。Stata、R 或访谈编码表另行购买。</li>
            </ul>
          </div>
          <aside className="border border-brass bg-brass-soft p-5 text-ink">
            <p className="text-xs">另行预约</p>
            <h3 className="mt-2 text-2xl">{HUMAN_REVIEW.name}</h3>
            <p className="mt-2 font-serif text-4xl tabular-nums">{yuan(HUMAN_REVIEW.price)}</p>
            <p className="mt-3 text-sm">{HUMAN_REVIEW.note}</p>
          </aside>
        </section>

        <section className="mt-12 border border-line p-5">
          <h2 className="text-2xl">付款前请看退款范围</h2>
          <p className="mt-3 text-base leading-8 text-ink-soft">
            内容生成之前可以退回。开题包的三个题目交付之后，该笔费用按购买说明结算。成稿包的初稿交付之后，不因表述偏好退回。三包合买中尚未使用的轮次，按剩余轮数退回差额。年匣中已经开始的题目不退回；一个题目都尚未开始、且在购买后 7 日内，可以全额退回。当前为预览，确认后即可查看，不发生扣款。
          </p>
        </section>
      </div>
      <PayDialog planId={planId} open={open} onOpenChange={setOpen} />
    </Shell>
  );
}
