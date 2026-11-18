import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Mark } from "@/components/mark";
import { exampleProject } from "@/lib/research/example";
import { useLedger } from "@/lib/research/store";

const LINKS = [
  { to: "/brought", label: "自带题目" },
  { to: "/pricing", label: "价格" },
  { to: "/risks", label: "学术规范" },
  { to: "/mine", label: "我的" },
] as const;

function NavLinks() {
  const replaceProject = useLedger((state) => state.replaceProject);
  const navigate = useNavigate();
  return (
    <>
      {LINKS.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          className="shrink-0 py-1 transition-colors hover:text-ink"
          activeProps={{ className: "shrink-0 py-1 text-ink" }}
        >
          {item.label}
        </Link>
      ))}
      <button
        className="shrink-0 py-1 transition-colors hover:text-ink"
        onClick={() => {
          replaceProject(exampleProject());
          void navigate({ to: "/studio" });
        }}
      >
        看示例
      </button>
      <Link to="/orders" className="shrink-0 py-1 transition-colors hover:text-ink">
        订单
      </Link>
    </>
  );
}

export function Shell({ children, plain = false }: { children: ReactNode; plain?: boolean }) {
  const setReady = useLedger((state) => state.setReady);
  useEffect(() => {
    if (useLedger.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    const unsub = useLedger.persist.onFinishHydration(() => setReady(true));
    void useLedger.persist.rehydrate();
    return unsub;
  }, [setReady]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <div className="flex min-h-[4.5rem] items-center gap-4 py-2">
            <Link to="/" aria-label="天问开题" className="flex shrink-0 items-center gap-2.5 text-ink">
              <Mark className="size-9" />
              <span className="brand-words">
                <span className="brand-tianwen">天问</span>
                <span className="brand-kaiti">开题</span>
              </span>
            </Link>
            <nav className="ml-auto hidden items-center gap-7 text-sm text-muted md:flex">
              <NavLinks />
            </nav>
            <Link to="/" hash="form" className="ml-auto shrink-0 bg-ink px-3.5 py-2 text-sm text-on-cinnabar transition-colors hover:bg-ink-soft md:ml-0">
              开始
            </Link>
          </div>
          <nav className="flex gap-5 pb-3 text-sm text-muted md:hidden">
            <NavLinks />
          </nav>
        </div>
      </header>
      <main>{children}</main>
      {plain ? null : (
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-12 text-sm leading-7 text-muted md:flex-row md:items-start md:justify-between md:px-10">
            <div>
              <p className="brand-words compact" aria-label="天问开题">
                <span className="brand-tianwen">天问</span>
                <span className="brand-kaiti">开题</span>
              </p>
              <p className="mt-1">社会科学开题</p>
            </div>
            <p className="flex max-w-xl flex-wrap gap-x-5">
              <Link to="/risks">学术规范</Link>
              <Link to="/pricing">价格</Link>
              <Link to="/mine">我的</Link>
              <Link to="/orders">订单</Link>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
