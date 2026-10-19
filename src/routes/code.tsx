import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PayDialog } from "@/components/pay-dialog";
import { Button } from "@/components/primitives";
import { Shell } from "@/components/shell";
import { yuan, planById } from "@/lib/research/catalog";
import { CODE_FILES } from "@/lib/research/code-source";
import { useLedger } from "@/lib/research/store";
import { isStaticPreview } from "@/lib/research/static-preview";

export const Route = createFileRoute("/code")({ component: CodePage });

function CodePage() {
  const orders = useLedger((state) => state.orders);
  const ready = useLedger((state) => state.ready);
  const unlocked = orders.some((order) => order.status === "paid" && order.planId === "code");
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(0);
  const current = CODE_FILES[file] ?? CODE_FILES[0]!;
  const price = planById("code").price;

  return (
    <Shell>
      <article className="mx-auto max-w-2xl px-5 py-14">
        <p className="text-sm text-muted">另外 {yuan(price)}，初稿里没有</p>
        <h1 className="mt-3 text-3xl leading-snug">要跑软件，或要交编码表，买这里。</h1>
        <div className="mt-6 space-y-4 text-base leading-8 text-ink-soft">
          <p>付过定金和尾款，拿到的是初稿，不是这些文件。</p>
          <p>做问卷，给的是 Stata 和 R。它们帮你读入表格、看缺失、做描述。回归那一行被注释掉了，里面没有现成的系数。</p>
          <p>做访谈，给的是一张空编码表，外加方法里可以改写的几句话。主题和原话留着你填。期刊要的通常是这段说明，不是软件工程文件。</p>
          <p>列名要按你的表改。Stata 和 NVivo 的许可证不在这个价钱里。</p>
        </div>
        <div className="mt-8">
          {ready && unlocked ? (
            <p className="text-sm text-muted">这份浏览器已经解开脚本。</p>
          ) : (
            <Button onClick={() => setOpen(true)}>{isStaticPreview() ? "点击解锁全文" : `付 ${yuan(price)}，看全文`}</Button>
          )}
        </div>
        <div className="mt-10">
          <div className="flex gap-4 text-sm">
            {CODE_FILES.map((item, index) => (
              <button key={item.name} className={index === file ? "text-ink" : "text-muted"} onClick={() => setFile(index)}>
                {item.name}
              </button>
            ))}
          </div>
          <pre className="mt-4 overflow-auto border-t border-line py-4 text-xs leading-6 text-ink-soft">
            {ready && unlocked ? current.body : current.body.split("\n").slice(0, 6).join("\n") + "\n\n…"}
          </pre>
        </div>
      </article>
      <PayDialog planId="code" open={open} onOpenChange={setOpen} />
    </Shell>
  );
}
