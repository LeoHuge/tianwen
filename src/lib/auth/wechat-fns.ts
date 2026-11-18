import { createServerFn } from "@tanstack/react-start";

/** 只用服务器上的 AppSecret 换 openid。缺任何一项就空着返回，不造身份。 */
export const exchangeWechatCode = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const code = String((input as { code?: unknown })?.code ?? "").trim();
    if (!/^[0-9A-Za-z_-]{8,128}$/.test(code)) throw new Error("授权码无效。");
    return { code };
  })
  .handler(async ({ data }) => {
    const appId = process.env.WECHAT_APP_ID?.trim() ?? "";
    const secret = process.env.WECHAT_APP_SECRET?.trim() ?? "";
    if (!appId || !secret) return { ok: false as const, openid: "", nickname: "" };
    try {
      const tokenUrl = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
      tokenUrl.searchParams.set("appid", appId);
      tokenUrl.searchParams.set("secret", secret);
      tokenUrl.searchParams.set("code", data.code);
      tokenUrl.searchParams.set("grant_type", "authorization_code");
      const token = (await fetch(tokenUrl).then((response) => response.json())) as { openid?: unknown; access_token?: unknown };
      const openid = typeof token.openid === "string" ? token.openid.trim() : "";
      const accessToken = typeof token.access_token === "string" ? token.access_token : "";
      if (!openid || !accessToken) return { ok: false as const, openid: "", nickname: "" };
      const infoUrl = new URL("https://api.weixin.qq.com/sns/userinfo");
      infoUrl.searchParams.set("access_token", accessToken);
      infoUrl.searchParams.set("openid", openid);
      infoUrl.searchParams.set("lang", "zh_CN");
      const info = (await fetch(infoUrl).then((response) => response.json())) as { nickname?: unknown };
      const nickname = typeof info.nickname === "string" ? info.nickname.trim().slice(0, 32) : "";
      return { ok: true as const, openid, nickname };
    } catch {
      return { ok: false as const, openid: "", nickname: "" };
    }
  });
