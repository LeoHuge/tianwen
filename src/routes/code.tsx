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
        <p className="text-sm text-muted">统计代码 · {yuan(price)}</p>
        <h1 className="mt-3 text-3xl leading-snug">Stata、R 与访谈编码表</h1>
        <div className="mt-6 space-y-4 text-base leading-8 text-ink-soft">
          <p>成稿包交付初稿。统计代码在本页单独提供。</p>
          <p>问卷研究提供 Stata 与 R 脚本，用于读入表格、查看缺失和做描述。回归命令留作注释，系数在您的软件中计算。</p>
          <p>访谈研究提供编码表和方法说明。主题与原话由您填写。期刊通常采用这段方法说明。</p>
          <p>请按您的数据表修改变量名。Stata 与 NVivo 的许可不包含在本项费用中。</p>
        </div>
        <div className="mt-8">
          {ready && unlocked ? (
            <p className="text-sm text-muted">本机已可查看全文。</p>
          ) : (
            <Button onClick={() => setOpen(true)}>{isStaticPreview() ? "查看全文" : `支付 ${yuan(price)}，查看全文`}</Button>
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
