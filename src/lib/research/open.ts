export type OpenKind = "example" | "blank";

let pending: OpenKind | null = null;

export function requestOpen(kind: OpenKind) {
  pending = kind;
}

export function takeOpen() {
  const kind = pending;
  pending = null;
  return kind;
}
