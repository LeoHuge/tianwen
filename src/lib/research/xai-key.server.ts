import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Server-only. Environment first, then the gitignored `.xai-key` file on this computer. */
export function readXaiApiKey(): string {
  const fromEnv = process.env.XAI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const text = readFileSync(join(process.cwd(), ".xai-key"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const value = line.trim();
      if (!value || value.startsWith("#")) continue;
      return value;
    }
  } catch {
    return "";
  }
  return "";
}
