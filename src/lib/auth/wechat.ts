/** 微信登录只走这一条。AppSecret 不进网页。 */

export type WechatIdentity = {
  openid: string;
  nickname: string;
};

const IDENTITY_KEY = "tianwen-wechat";
const STATE_KEY = "tianwen-wechat-state";

export function wechatAppId() {
  return (import.meta.env.VITE_WECHAT_APP_ID ?? "").trim();
}

export function inWechatBrowser() {
  return typeof navigator !== "undefined" && /MicroMessenger/i.test(navigator.userAgent);
}

export function wechatCallbackUrl() {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const path = `${base}/mine`;
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 电脑打开扫码；微信内打开网页授权。 */
export function wechatAuthorizeUrl(input: { appId: string; redirectUri: string; inWechat: boolean; state: string }) {
  const base = input.inWechat ? "https://open.weixin.qq.com/connect/oauth2/authorize" : "https://open.weixin.qq.com/connect/qrconnect";
  const scope = input.inWechat ? "snsapi_userinfo" : "snsapi_login";
  const query = [
    `appid=${encodeURIComponent(input.appId)}`,
    `redirect_uri=${encodeURIComponent(input.redirectUri)}`,
    "response_type=code",
    `scope=${scope}`,
    `state=${encodeURIComponent(input.state)}`,
  ].join("&");
  return `${base}?${query}#wechat_redirect`;
}

export function readWechatCallback(search: string) {
  const query = new URLSearchParams(search);
  return { code: query.get("code")?.trim() ?? "", state: query.get("state")?.trim() ?? "" };
}

export function rememberWechatState() {
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  return state;
}

export function takeWechatState(state: string) {
  const saved = sessionStorage.getItem(STATE_KEY) ?? "";
  sessionStorage.removeItem(STATE_KEY);
  return Boolean(saved) && saved === state;
}

export function readWechatIdentity(): WechatIdentity | null {
  try {
    const raw = sessionStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WechatIdentity>;
    const openid = parsed.openid?.trim() ?? "";
    if (!openid) return null;
    return { openid, nickname: parsed.nickname?.trim() ?? "" };
  } catch {
    return null;
  }
}

export function writeWechatIdentity(value: WechatIdentity | null) {
  if (!value?.openid) sessionStorage.removeItem(IDENTITY_KEY);
  else sessionStorage.setItem(IDENTITY_KEY, JSON.stringify({ openid: value.openid, nickname: value.nickname }));
}
