/** GitHub Pages has no payment server. Unlock stays a local click. Literature search opens the databases directly. */
export function isStaticPreview(): boolean {
  if (import.meta.env.VITE_STATIC_PREVIEW === "true") return true;
  if (typeof location !== "undefined" && /(^|\.)github\.io$/i.test(location.hostname)) return true;
  return false;
}
