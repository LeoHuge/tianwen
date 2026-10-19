/**
 * 宽松地读模型返回的 JSON：去掉代码围栏和前后说明文字，修掉尾逗号和字符串里的裸换行，
 * 被 max_tokens 截断的结尾会补齐括号。读不出来返回 null，不抛错。
 */
export function looseJson(text: string): unknown {
  if (!text || typeof text !== "string") return null;
  const fenced = text.match(/```(?:json|JSON)?\s*([\s\S]*?)(?:```|$)/);
  const sources = fenced?.[1] ? [fenced[1], text] : [text];
  for (const source of sources) {
    const start = source.search(/[{[]/);
    if (start < 0) continue;
    const body = source.slice(start);
    const balanced = balancedPrefix(body);
    for (const piece of [balanced, body]) {
      if (!piece) continue;
      const direct = tryParse(piece);
      if (direct !== undefined) return direct;
      const fixed = tryParse(repair(piece));
      if (fixed !== undefined) return fixed;
    }
  }
  return null;
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function balancedPrefix(text: string) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") depth += 1;
    else if (ch === "}" || ch === "]") {
      depth -= 1;
      if (depth === 0) return text.slice(0, i + 1);
    }
  }
  return null;
}

function repair(text: string) {
  let out = "";
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    if (inString) {
      if (escaped) {
        escaped = false;
        out += ch;
      } else if (ch === "\\") {
        escaped = true;
        out += ch;
      } else if (ch === '"') {
        inString = false;
        out += ch;
      } else if (ch === "\n") out += "\\n";
      else if (ch === "\t") out += "\\t";
      else if (ch !== "\r") out += ch;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === "{" || ch === "[") {
      stack.push(ch === "{" ? "}" : "]");
      out += ch;
    } else if (ch === "}" || ch === "]") {
      out = out.replace(/,\s*$/, "");
      stack.pop();
      out += ch;
      if (stack.length === 0) return out;
    } else out += ch;
  }
  if (escaped) out = out.slice(0, -1);
  if (inString) out += '"';
  // 截断在半个键值对上：去掉没写完的那一段
  out = out
    .replace(/,\s*"[^"]*"\s*:\s*[^"{}[\],\s][^"{}[\],]*$/, "")
    .replace(/,\s*"[^"]*"\s*:?\s*$/, "")
    .replace(/\{\s*"[^"]*"\s*:?\s*$/, "{")
    .replace(/,\s*$/, "");
  while (stack.length) {
    out = out.replace(/,\s*$/, "");
    out += stack.pop();
  }
  return out;
}
