import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Mark } from "@/components/mark";
import { exampleProject } from "@/lib/research/example";
import { useLedger } from "@/lib/research/store";

const LINKS = [
  { to: "/pricing", label: "价格" },
  { to: "/risks", label: "学术规范" },
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
        登录
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
          <div className="flex h-16 items-center gap-4">
            <Link to="/" className="flex shrink-0 items-center gap-2.5 text-ink">
              <Mark className="size-8" />
              <span className="font-serif text-lg tracking-wide">天问</span>
              <span className="text-sm text-muted">开题</span>
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
              <p className="font-serif text-base text-ink">天问开题</p>
              <p className="mt-1">天问科技（备案主体待登记）</p>
            </div>
            <p className="flex max-w-xl flex-wrap gap-x-5">
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
                京ICP备xxxxxxxx号
              </a>
              <span>所用模型：待登记后公示名称与编号</span>
              <Link to="/risks">用户协议</Link>
              <Link to="/risks">隐私政策</Link>
              <Link to="/risks">投诉举报</Link>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
