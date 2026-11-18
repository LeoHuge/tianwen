import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { yuan } from "@/lib/research/catalog";
import { useLedger } from "@/lib/research/store";
import { isStaticPreview } from "@/lib/research/static-preview";
import { exchangeWechatCode } from "@/lib/auth/wechat-fns";
import {
  inWechatBrowser,
  readWechatCallback,
  readWechatIdentity,
  rememberWechatState,
  takeWechatState,
  wechatAppId,
  wechatAuthorizeUrl,
  wechatCallbackUrl,
  writeWechatIdentity,
  type WechatIdentity,
} from "@/lib/auth/wechat";

export const Route = createFileRoute("/mine")({ component: MinePage });

function MinePage() {
  const orders = useLedger((state) => state.orders);
  const ready = useLedger((state) => state.ready);
  const exchange = useServerFn(exchangeWechatCode);
  const [identity, setIdentity] = useState<WechatIdentity | null>(null);
  const preview = isStaticPreview();
  const appId = wechatAppId();
  const canRedirect = !preview && Boolean(appId);

  useEffect(() => {
    setIdentity(readWechatIdentity());
    const { code, state } = readWechatCallback(window.location.search);
    if (!code) return;
    const stateOk = takeWechatState(state);
    window.history.replaceState({}, "", window.location.pathname);
    if (preview || !stateOk) return;
    void exchange({ data: { code } })
      .then((result) => {
        if (result.ok && result.openid) writeWechatIdentity({ openid: result.openid, nickname: result.nickname });
        setIdentity(readWechatIdentity());
      })
      .catch(() => setIdentity(readWechatIdentity()));
  }, [exchange, preview]);

  function startLogin() {
    if (!canRedirect) return;
    const state = rememberWechatState();
    window.location.assign(wechatAuthorizeUrl({ appId, redirectUri: wechatCallbackUrl(), inWechat: inWechatBrowser(), state }));
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <p className="kicker">账号</p>
        <h1 className="mt-3 text-4xl">我的</h1>
        <p className="mt-3 text-sm leading-7 text-muted">只使用微信登录。微信确认后带回授权码，再由服务器换成 openid。缺的步骤保持空白，不写入身份。</p>

        <section className="mt-10">
          <h2 className="text-xl">微信登录</h2>
          <button type="button" className="mt-4 min-h-11 bg-ink px-4 text-sm text-on-cinnabar" onClick={startLogin}>
            微信登录
          </button>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm leading-7 text-ink-soft">
            <li>打开微信授权。电脑显示二维码，微信内直接确认。</li>
            <li>微信回到本页，地址上带授权码。</li>
            <li>服务器用 AppSecret 换 openid。这一步不在网页里做。</li>
            <li>订单和题目按 openid 保存。</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl">身份</h2>
          {identity ? (
            <div className="mt-3 border border-line bg-sheet px-4 py-4 text-sm leading-7">
              <p>{identity.nickname || "微信用户"}</p>
              <p className="text-muted">{identity.openid}</p>
            </div>
          ) : (
            <div className="mt-3 border border-line bg-sheet px-4 py-8 text-sm text-muted">（空）</div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl">按 openid 保存的订单和题目</h2>
          <div className="mt-3 border border-line bg-sheet px-4 py-8 text-sm text-muted">（空）</div>
        </section>

        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl">这台浏览器里的订单</h2>
            <Link to="/orders" className="text-sm text-cinnabar underline underline-offset-4">
              订单
            </Link>
          </div>
          <p className="mt-2 text-sm leading-7 text-muted">这些记录还没有 openid。</p>
          {!ready ? <p className="mt-4 text-sm text-muted">正在读取…</p> : null}
          {ready && orders.length === 0 ? <p className="mt-4 text-sm text-ink-soft">还没有订单。</p> : null}
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="sheet flex flex-col gap-2 p-5 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="text-lg">{order.title}</p>
                  <p className="text-sm text-muted">
                    {order.id} · {order.channel === "wechat" ? "微信" : "支付宝"} · {order.status === "paid" ? "已确认" : "待确认"}
                  </p>
                </div>
                <p className="font-serif text-2xl tabular-nums">{yuan(order.amount)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Shell>
  );
}
