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
    note: "含在开题包里。检索出题默认用这个。",
    route: "xai",
    model: "grok-4.7",
  },
  {
    id: "grok-4.5",
    name: "Grok 4.5",
    vendor: "xAI",
    tier: "base",
    note: "更快，题会短一些。",
    route: "xai",
    model: "grok-4.5",
  },
  {
    id: "relay-gpt",
    name: "GPT",
    vendor: "中转",
    tier: "premium",
    note: "走你自己的中转站。买断含，单次另付。",
    route: "relay",
    model: "gpt-4.1",
  },
  {
    id: "relay-claude",
    name: "Claude",
    vendor: "中转",
    tier: "premium",
    note: "走你自己的中转站。买断含，单次另付。",
    route: "relay",
    model: "claude-sonnet-4",
  },
  {
    id: "relay-kimi",
    name: "Kimi",
    vendor: "中转",
    tier: "premium",
    note: "中文长文。走你自己的中转站。",
    route: "relay",
    model: "kimi-k2",
  },
];

export function modelById(id: string) {
  return MODELS.find((item) => item.id === id) ?? MODELS[0]!;
}
