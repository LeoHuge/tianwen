// 服务端调用模型的公共部分，只在 createServerFn 的 handler 里使用。
// 以前出题失败的主要原因：默认模型名在接口里不存在时直接报错，没有备选；
// 推理模型把 max_tokens 用在思考上，正文被截断；JSON 稍有瑕疵就整体作废。
import { looseJson } from "./json-loose";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class ModelError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

/** 出题、写问卷用：先试所选型号，再试其它常见型号。 */
export const CHAT_PREFERENCE = [
  "grok-4.7",
  "grok-4.5",
  "grok-4-1-fast-non-reasoning",
  "grok-4-fast-non-reasoning",
  "grok-4",
  "grok-4-latest",
  "grok-3-latest",
  "grok-3",
];

/** 联网检索用：需要支持 web_search 工具的型号。 */
export const SEARCH_PREFERENCE = ["grok-4.5", "grok-4.7", "grok-4-1-fast-reasoning", "grok-4-fast-reasoning", "grok-4", "grok-4-latest"];

export function xaiBase() {
  return (process.env.XAI_BASE_URL || "https://api.x.ai/v1").replace(/\/$/, "");
}

let listed: { at: number; ids: string[] } | null = null;

async function listModels(apiKey: string): Promise<string[] | null> {
  if (listed && Date.now() - listed.at < 10 * 60 * 1000) return listed.ids;
  try {
    const response = await fetch(`${xaiBase()}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { id?: unknown }[]; models?: { id?: unknown }[] };
    const ids = [...(body.data ?? []), ...(body.models ?? [])].map((item) => String(item.id ?? "")).filter(Boolean);
    if (!ids.length) return null;
    listed = { at: Date.now(), ids };
    return ids;
  } catch {
    return null;
  }
}

function rank(id: string) {
  let score = 0;
  if (/grok-4/.test(id)) score += 100;
  if (/grok-3/.test(id)) score += 50;
  if (/fast/.test(id)) score += 5;
  if (/mini/.test(id)) score -= 10;
  if (/code/.test(id)) score -= 60;
  return score;
}

/**
 * 依次要试的型号。环境变量指定的型号排第一；接口能列出型号时，列表里确实有的排前面，
 * 再补两个列表里的 grok 型号；列不出来就按偏好顺序全试。
 */
export async function modelChain(apiKey: string, preference: string[], requested?: string, envKey?: string) {
  const configured = envKey ? process.env[envKey]?.trim() : "";
  const wanted = unique([configured, requested, ...preference].filter((id): id is string => Boolean(id)));
  const ids = await listModels(apiKey);
  if (!ids) return wanted.slice(0, 6);
  const known = wanted.filter((id) => ids.includes(id));
  const unknown = wanted.filter((id) => !ids.includes(id));
  const extra = ids
    .filter((id) => /grok/i.test(id) && !/image|vision|imagine|video|embed|tts|voice|audio/i.test(id) && !wanted.includes(id))
    .sort((a, b) => rank(b) - rank(a));
  return unique([...(configured ? [configured] : []), ...known, ...extra.slice(0, 2), ...unknown]).slice(0, 7);
}

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part && typeof part === "object" && "text" in part ? String((part as { text?: unknown }).text ?? "") : ""))
      .join("");
  }
  return "";
}

function isTimeout(error: unknown) {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError" || /timeout|aborted/i.test(error.message));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 调用 chat/completions 并解析成 JSON。换型号、重试、去掉 response_format 都在这里做。
 * validate 返回 false 时视为这一次没出成，会再试。
 */
export async function chatJson(input: {
  apiKey: string;
  endpoint?: string;
  models: string[];
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
  deadline: number;
  attemptMs?: number;
  validate?: (data: unknown) => boolean;
}) {
  const endpoint = input.endpoint ?? `${xaiBase()}/chat/completions`;
  let lastError = "模型暂时不可用";
  for (const model of input.models) {
    let format = true;
    let tries = 0;
    while (tries < 2) {
      const left = input.deadline - Date.now();
      if (left < 6000) throw new ModelError(lastError === "模型暂时不可用" ? "等待时间到了" : lastError);
      tries += 1;
      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${input.apiKey}` },
          body: JSON.stringify({
            model,
            temperature: input.temperature ?? 0.4,
            max_tokens: input.maxTokens,
            messages: input.messages,
            ...(format ? { response_format: { type: "json_object" } } : {}),
          }),
          signal: AbortSignal.timeout(Math.max(5000, Math.min(input.attemptMs ?? 80000, left - 3000))),
        });
      } catch (error) {
        lastError = isTimeout(error) ? "模型超时" : "连不上模型服务";
        if (isTimeout(error)) break;
        continue;
      }
      if (response.status === 401 || response.status === 403) {
        throw new ModelError(`模型密钥无效或没有权限（${response.status}）`, response.status);
      }
      if (response.status === 429 || response.status >= 500) {
        lastError = `模型服务繁忙（${response.status}）`;
        await sleep(1500);
        continue;
      }
      if (!response.ok) {
        const detail = (await response.text().catch(() => "")).slice(0, 400);
        lastError = `模型没有完成（${response.status}）`;
        if (format && /response_format|json_object/i.test(detail)) {
          format = false;
          tries -= 1;
          continue;
        }
        break;
      }
      const body = (await response.json().catch(() => null)) as {
        choices?: { message?: { content?: unknown }; finish_reason?: string }[];
      } | null;
      const choice = body?.choices?.[0];
      const data = looseJson(textOf(choice?.message?.content));
      if (data && (!input.validate || input.validate(data))) return { data, model };
      lastError = choice?.finish_reason === "length" ? "模型输出被截断" : "模型没有返回完整结构";
    }
  }
  throw new ModelError(lastError);
}

function readResponse(body: unknown) {
  const links: string[] = [];
  let text = "";
  const record = body as {
    output_text?: unknown;
    output?: { type?: string; content?: { type?: string; text?: string; annotations?: { url?: string }[] }[] }[];
    citations?: unknown[];
  };
  for (const item of record.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if ((part.type !== "output_text" && part.type !== "text") || !part.text) continue;
      text += part.text;
      for (const note of part.annotations ?? []) if (note.url) links.push(note.url);
    }
  }
  if (!text && typeof record.output_text === "string") text = record.output_text;
  for (const cite of record.citations ?? []) {
    if (typeof cite === "string") links.push(cite);
    else if (cite && typeof cite === "object" && "url" in cite && typeof (cite as { url?: unknown }).url === "string") links.push((cite as { url: string }).url);
  }
  return { text, links };
}

/** 用 Responses 接口加 web_search 工具检索。返回模型的原文和它打开过的链接。 */
export async function webSearch(input: { apiKey: string; models: string[]; prompt: string; deadline: number }) {
  let lastError = "检索服务暂时不可用";
  for (const model of input.models) {
    const left = input.deadline - Date.now();
    if (left < 15000) break;
    let response: Response;
    try {
      response = await fetch(`${xaiBase()}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${input.apiKey}` },
        body: JSON.stringify({
          model,
          tools: [{ type: "web_search" }],
          tool_choice: "auto",
          input: [{ role: "user", content: input.prompt }],
        }),
        signal: AbortSignal.timeout(left - 3000),
      });
    } catch (error) {
      lastError = isTimeout(error) ? "检索超时" : "连不上检索服务";
      if (isTimeout(error)) break;
      continue;
    }
    if (response.status === 401 || response.status === 403) throw new ModelError(`检索密钥无效或没有权限（${response.status}）`, response.status);
    if (!response.ok) {
      lastError = `检索没有完成（${response.status}）`;
      if (response.status === 429 || response.status >= 500) await sleep(1500);
      continue;
    }
    const body = (await response.json().catch(() => null)) as unknown;
    const { text, links } = readResponse(body);
    if (text.trim()) return { text, links, model };
    lastError = "检索没有返回内容";
  }
  throw new ModelError(lastError);
}

export function reason(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "原因不明";
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}
