export type ModelTier = "base" | "premium";

export type ModelOption = {
  id: string;
  name: string;
  vendor: string;
  tier: ModelTier;
  note: string;
  route: "xai" | "relay";
  model: string;
};

export const MODELS: ModelOption[] = [
  {
    id: "grok-4.7",
    name: "Grok 4.7",
    vendor: "xAI",
    tier: "base",
    note: "包含在开题包中，检索与出题默认使用。",
    route: "xai",
    model: "grok-4.7",
  },
  {
    id: "grok-4.5",
    name: "Grok 4.5",
    vendor: "xAI",
    tier: "base",
    note: "速度较快，题目更短。",
    route: "xai",
    model: "grok-4.5",
  },
  {
    id: "relay-gpt",
    name: "GPT",
    vendor: "另行接入",
    tier: "premium",
    note: "另行接入。成稿包包含，单次另行计费。",
    route: "relay",
    model: "gpt-4.1",
  },
  {
    id: "relay-claude",
    name: "Claude",
    vendor: "另行接入",
    tier: "premium",
    note: "另行接入。成稿包包含，单次另行计费。",
    route: "relay",
    model: "claude-sonnet-4",
  },
  {
    id: "relay-kimi",
    name: "Kimi",
    vendor: "另行接入",
    tier: "premium",
    note: "适合中文长文。另行接入。",
    route: "relay",
    model: "kimi-k2",
  },
];

export function modelById(id: string) {
  return MODELS.find((item) => item.id === id) ?? MODELS[0]!;
}
