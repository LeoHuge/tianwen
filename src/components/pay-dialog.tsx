import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useNavigate } from "@tanstack/react-router";
import { planById, yuan } from "@/lib/research/catalog";
import { useLedger } from "@/lib/research/store";
import type { PlanId } from "@/lib/research/types";
import { Button } from "./primitives";

export function PayDialog({
  planId,
  open,
  onOpenChange,
  onPaid,
  projectId,
  note,
}: {
  planId: PlanId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid?: (planId: PlanId) => void;
  projectId?: string;
  note?: string;
}) {
  const navigate = useNavigate();
  const orders = useLedger((state) => state.orders);
  const ensurePending = useLedger((state) => state.ensurePending);
  const setChannel = useLedger((state) => state.setChannel);
  const markPaid = useLedger((state) => state.markPaid);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [src, setSrc] = useState("");
  const order = orders.find((item) => item.id === orderId) ?? null;
  const plan = planId ? planById(planId) : null;

  useEffect(() => {
    if (!open || !planId) return;
    setOrderId(ensurePending(planId, "wechat", projectId));
  }, [open, planId, ensurePending, projectId]);

  useEffect(() => {
    if (!order) return;
    let cancel = false;
    const payload = `天问演示订单，不会扣款。单号 ${order.id}，金额 ${order.amount} 元，渠道 ${
      order.channel === "wechat" ? "微信" : "支付宝"
    }。正式环境请使用商户平台返回的支付链接。`;
    void QRCode.toDataURL(payload, {
      margin: 1,
      width: 280,
      color: { dark: "#1c1915", light: "#fbf8f2" },
    }).then((url) => {
      if (!cancel) setSrc(url);
    });
    return () => {
      cancel = true;
    };
  }, [order]);

  if (!plan || !order) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-[2px]" />
        <Dialog.Content className="sheet fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6">
          <Dialog.Title className="font-serif text-2xl text-ink">扫码支付 · 演示</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            {plan.name} · {yuan(plan.price)}。此码不会发起真实扣款。
          </Dialog.Description>
          {note ? <p className="mt-2 text-sm text-ink-soft">{note}</p> : null}
          <div className="mt-4 flex gap-2">
            {(["wechat", "alipay"] as const).map((channel) => (
              <button
                key={channel}
                className={
                  order.channel === channel
                    ? "min-h-11 flex-1 bg-ink px-3 text-sm text-on-cinnabar"
                    : "min-h-11 flex-1 border border-line bg-paper px-3 text-sm text-ink"
                }
                onClick={() => setChannel(order.id, channel)}
              >
                {channel === "wechat" ? "微信支付" : "支付宝"}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col items-center border border-line bg-paper p-4">
            {src ? <img src={src} alt="演示订单二维码" className="size-52" /> : <div className="size-52" />}
            <p className="mt-2 text-center text-xs text-muted">单号 {order.id} · 扫出来也只是一段说明文字</p>
          </div>
          <p className="mt-3 text-xs text-brass">
            生成前可放弃。模拟到账后，数字内容按购买页的规则视为已交付演示权益，换浏览器不会保留。
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() => {
                markPaid(order.id);
                onOpenChange(false);
                onPaid?.(plan.id);
                if (plan.id === "code") void navigate({ to: "/code" });
              }}
            >
              模拟到账，解锁
            </Button>
            <Dialog.Close asChild>
              <Button tone="ghost" className="flex-1">
                先不付
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
