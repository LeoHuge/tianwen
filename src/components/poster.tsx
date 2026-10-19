import { Mark } from "@/components/mark";

export function Poster() {
  return (
    <div className="poster" aria-hidden="true">
      <div className="poster-top">
        <Mark className="poster-logo" />
        <p className="poster-kicker">卷一</p>
      </div>
      <div>
        <p className="poster-kicker">四个词</p>
        <div className="poster-title">
          <span>开</span>
          <span>题</span>
        </div>
      </div>
      <div className="poster-foot">
        <p className="poster-line">写成一份可以实施的开题。</p>
        <p className="poster-meta">检索免费 · 看题 ¥199</p>
      </div>
    </div>
  );
}
