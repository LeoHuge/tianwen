import { Mark } from "@/components/mark";

export function Poster() {
  return (
    <div className="poster" aria-hidden="true">
      <div className="poster-wash" />
      <span className="poster-corner poster-corner-nw" />
      <span className="poster-corner poster-corner-se" />
      <div className="poster-top">
        <Mark className="poster-logo" />
        <p className="poster-kicker">卷一</p>
      </div>
      <div className="poster-body">
        <p className="poster-kicker">四个词</p>
        <div className="poster-title">
          <span>开</span>
          <span>题</span>
        </div>
        <span className="poster-rule" />
      </div>
      <div className="poster-foot">
        <p className="poster-line">写成一份可以实施的开题</p>
        <p className="poster-meta">
          <span>检索免费</span>
          <span>看题 ¥199</span>
        </p>
      </div>
    </div>
  );
}
