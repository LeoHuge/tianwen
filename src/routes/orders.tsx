import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PayDialog } from "@/components/pay-dialog";
import { Button } from "@/components/primitives";
import { Shell } from "@/components/shell";
import { yuan } from "@/lib/research/catalog";
import { useLedger } from "@/lib/research/store";
import type { PlanId } from "@/lib/research/types";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const orders = useLedger((state) => state.orders);
  const ready = useLedger((state) => state.ready);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <h1 className="text-4xl">订单</h1>
        <p className="mt-3 text-sm text-muted">演示账本存在这台浏览器里。清除站点数据、换设备或换浏览器，购买记录都会消失。正式产品不能这样记账。</p>
        {!ready ? <p className="mt-8 text-sm text-muted">正在读取本机订单…</p> : null}
        {ready && orders.length === 0 ? <p className="mt-8 text-sm text-ink-soft">还没有订单。</p> : null}
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="sheet flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-lg">{order.title}</p>
                <p className="text-sm text-muted">
                  {order.id} · {order.channel === "wechat" ? "微信" : "支付宝"} ·{" "}
                  {new Date(order.createdAt).toLocaleString("zh-CN", { hour12: false })}
                </p>
              </div>
              <p className="font-serif text-2xl tabular-nums">{yuan(order.amount)}</p>
              {order.status === "paid" ? (
                <span className="text-sm text-brass">已模拟到账</span>
              ) : (
                <Button
                  tone="ink"
                  onClick={() => {
                    setPlanId(order.planId);
                    setOpen(true);
                  }}
                >
                  继续演示支付
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
      <PayDialog planId={planId} open={open} onOpenChange={setOpen} />
    </Shell>
  );
}
