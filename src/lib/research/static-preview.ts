/** GitHub Pages has no payment or literature server. Unlock stays a local click. */
export function isStaticPreview(): boolean {
  if (import.meta.env.VITE_STATIC_PREVIEW === "true") return true;
  if (typeof location !== "undefined" && /(^|\.)github\.io$/i.test(location.hostname)) return true;
  return false;
}
