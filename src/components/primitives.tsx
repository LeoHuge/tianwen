import { cn } from "@/lib/cn";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "ink" | "ghost" | "brass" }
>(function Button({ tone = "primary", className, ...props }, ref) {
  const tones = {
    primary: "bg-ink text-on-cinnabar hover:bg-ink-soft",
    ink: "bg-ink text-on-cinnabar hover:bg-ink-soft",
    ghost: "border border-line bg-sheet text-ink hover:border-ink",
    brass: "bg-brass-soft text-ink hover:bg-brass-soft/80",
  };
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-h-11 items-center justify-center px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
});

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const controlClass =
  "w-full border border-line bg-sheet px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-ink";

