import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { IndexTag } from "@/components/index-tags";
import { Poster } from "@/components/poster";
import { Shell } from "@/components/shell";
import { exampleProject } from "@/lib/research/example";
import { FIELDS } from "@/lib/research/fields";
import { homeExample } from "@/lib/research/home-examples";
import { useLedger } from "@/lib/research/store";
import { checkSubject, SUBJECT_SLOTS, subjectSentence } from "@/lib/research/subject";
import { BLANK_SUBJECT, blankProject, type SubjectParts } from "@/lib/research/types";

export const Route = createFileRoute("/")({ component: Home });

const UNITS = ["个人", "家庭", "社区／村", "组织", "地区"];
const HOME_SLOTS = SUBJECT_SLOTS.filter((slot) => slot.need !== "optional");
const FIELD =
  "h-12 w-full min-w-0 border border-line bg-sheet px-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-ink";
const STEPS = ["填写四个关键词", "写清研究对象", "检索近五年文献", "付款后查看并修改题目"];
const LIMITS = [
  ["不编造数据", "表中的数字须来自您自己的数据。"],
  ["不改写文献", "题名、期刊和收录均保持检索时的原文。"],
  ["不承诺结果", "不保证开题、答辩或查重通过。"],
  ["不联系导师", "选题和修改由您自行决定。"],
];
const PACKS = [
  {
    name: "开题包",
    price: "¥199",
    items: ["检索论文与立项，并标注收录", "给出 3 个具体题目，付款后可查看", "按建议修改所选题目"],
  },
  {
    name: "分析包",
    price: "¥599",
    items: ["问卷或访谈提纲", "题项和变量对照", "样本量计算书", "Stata / R 可复现代码"],
  },
  {
    name: "成稿包",
    price: "¥799",
    items: ["已购买开题包的，补 ¥600", "问卷与样本量计算书", "写作初稿，并标明人工智能生成", "1 轮结构性修订"],
  },
  {
    name: "三包合买",
    price: "¥1,199",
    items: ["已购买开题包的，补 ¥1,000", "包含开题包、分析包和成稿包", "3 轮人工协助结构性修订", "分开购买合计 ¥1,597"],
  },
];

function Home() {
  const navigate = useNavigate();
  const replaceProject = useLedger((state) => state.replaceProject);
  const [discipline, setDiscipline] = useState("社会学");
  const [keywords, setKeywords] = useState(["", "", "", ""]);
  const [subject, setSubject] = useState<SubjectParts>({ ...BLANK_SUBJECT });
  const [unitTouched, setUnitTouched] = useState(false);
  const example = homeExample(discipline);
  const [unit, setUnit] = useState(example.unit);
  const check = checkSubject(subject);
  const subjectPlaceholders: Record<string, string> = {
    where: example.where,
    who: example.who,
    stage: example.stage,
    condition: example.condition,
  };

  function pickDiscipline(name: string) {
    const next = homeExample(name);
    setDiscipline(name);
    if (!unitTouched) setUnit(next.unit);
  }

  function start() {
    const project = blankProject();
    const chosen = homeExample(discipline);
    project.keywords = keywords.map((word) => word.trim());
    project.subjectParts = subject;
    project.subject = subjectSentence(subject);
    project.unit = unit === "社区／村" ? "社区" : unit === "组织" ? "企业/组织" : unit === "地区" ? "街道/乡镇" : unit;
    project.discipline = discipline;
    project.field = chosen.field;
    sessionStorage.setItem(
      "tianwen-brief",
      JSON.stringify({ keywords: project.keywords, subjectParts: subject, unit: project.unit, discipline, field: chosen.field }),
    );
    replaceProject(project);
    void navigate({ to: "/studio" });
  }

  function openExample() {
    replaceProject(exampleProject());
    void navigate({ to: "/studio" });
  }

  return (
    <Shell>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1200px] md:grid-cols-[248px_1fr]">
          <div className="order-2 flex flex-col justify-between gap-10 border-b border-line px-6 py-8 md:order-1 md:border-r md:border-b-0 md:px-8 md:py-10">
            <div>
              <p className="kicker">社会科学</p>
              <p className="mt-5 font-serif text-[28px] leading-snug text-ink">从四个关键词写起。</p>
              <p className="mt-3 text-sm leading-7 text-muted">题目选定之后，仍可按建议修改。</p>
            </div>
            <ol className="space-y-2.5 text-sm text-ink-soft">
              {STEPS.map((item, index) => (
                <li key={item} className="flex items-baseline gap-3">
                  <span className="font-serif text-brass tabular-nums">0{index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="order-1 md:order-2">
            <Poster />
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1200px] items-start gap-10 px-5 py-16 md:grid-cols-[1.15fr_0.85fr] md:gap-14 md:px-10 md:py-20">
        <div id="form" className="scroll-mt-32">
          <p className="kicker">开题</p>
          <h1 className="mt-3 font-serif text-[32px] leading-snug font-medium md:text-[46px] md:leading-[1.25]">
            四个关键词，
            <br />
            写成一份可以实施的开题。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-ink-soft">
            请先选择学科，再填写四个关键词和研究对象。我们检索 2021 年以来的中文期刊、外文期刊，以及国家社科基金、国家自然科学基金立项，给出 3 个具体题目。开题包 ¥199，付款后即可查看，并按建议修改。若还需要问卷、样本量或初稿，再支付差额。
          </p>

          <div className="sheet mt-8">
            <Row label="学科">
              <div className="relative max-w-xs">
                <select
                  value={discipline}
                  aria-label="学科"
                  className={`${FIELD} cursor-pointer appearance-none pr-10`}
                  onChange={(event) => pickDiscipline(event.target.value)}
                >
                  {FIELDS.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted" aria-hidden="true">
                  展开
                </span>
              </div>
            </Row>
            <Row label="关键词">
              <div className="grid grid-cols-2 gap-2">
                {keywords.map((word, index) => (
                  <input
                    key={index}
                    value={word}
                    maxLength={24}
                    placeholder={example.keywords[index]}
                    aria-label={`关键词 ${index + 1}`}
                    className={FIELD}
                    onChange={(event) => {
                      const next = keywords.slice();
                      next[index] = event.target.value;
                      setKeywords(next);
                    }}
                  />
                ))}
              </div>
            </Row>
            <Row label="研究对象">
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {HOME_SLOTS.map((slot) => (
                    <label key={slot.key} className="block min-w-0">
                      <span className="mb-1.5 flex items-center gap-2 text-xs text-muted">
                        {slot.label}
                        {slot.need === "must" ? <span className="text-warn">必填</span> : <span>至少填写一项</span>}
                      </span>
                      <input
                        value={subject[slot.key]}
                        maxLength={30}
                        placeholder={subjectPlaceholders[slot.key] ?? slot.placeholder}
                        className={FIELD}
                        onChange={(event) => setSubject({ ...subject, [slot.key]: event.target.value })}
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-6 text-muted">
                  请写明地点和人群。年龄、身份与经历两项中，至少填写一项。例如「{example.where}{example.stage}、{example.condition}的{example.who}」。
                </p>
                {check.sentence ? (
                  <p className="mt-2 border-l-2 border-brass pl-3 text-sm leading-7 text-ink">研究对象：{check.sentence}</p>
                ) : null}
              </div>
            </Row>
            <Row label="分析单位">
              <div className="flex flex-wrap gap-2">
                {UNITS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`min-h-10 px-3.5 text-sm transition ${item === unit ? "bg-ink text-on-cinnabar" : "border border-line bg-sheet text-ink hover:border-ink"}`}
                    onClick={() => {
                      setUnitTouched(true);
                      setUnit(item);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Row>
          </div>

          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button className="inline-flex min-h-12 items-center justify-center bg-ink px-6 text-sm text-on-cinnabar transition hover:bg-ink-soft" onClick={start}>
              开始检索，生成 3 个题目
            </button>
            <button className="inline-flex min-h-12 items-center justify-center px-2 text-sm text-ink underline decoration-line underline-offset-4 transition hover:decoration-ink" onClick={openExample}>
              查看完整示例
            </button>
          </div>
          <p className="mt-4 text-sm text-muted">检索和生成题目不收费。查看题目需支付 ¥199。</p>
        </div>

        <aside className="sheet relative overflow-hidden p-7 text-ink md:sticky md:top-24">
          <span className="absolute inset-y-0 left-0 w-1 bg-brass" aria-hidden="true" />
          <p className="kicker">示例 · {discipline} · 虚构题目</p>
          <h2 className="mt-4 font-serif text-xl leading-8">{example.title}</h2>
          <p className="mt-5 text-xs text-muted">收录按下列名称标注</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <IndexTag id="CSSCI" />
            <IndexTag id="CSSCI扩展" />
            <IndexTag id="北核" />
            <IndexTag id="AMI顶级" />
            <IndexTag id="AMI权威" />
            <IndexTag id="AMI核心" />
            <IndexTag id="AMI扩展" />
            <IndexTag id="AMI入库" />
            <IndexTag id="CSCD核心" />
            <IndexTag id="CSCD扩展" />
            <IndexTag id="SSCI" />
            <IndexTag id="SCIE" />
            <IndexTag id="SCI" />
            <IndexTag id="ESCI" />
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm text-muted">有效问卷至少</p>
            <p className="mt-1 font-serif text-5xl leading-none tabular-nums">150</p>
            <p className="mt-2 text-sm text-muted">份。按 15% 的无效率计算，发放 177 份。</p>
          </div>
          <ul className="mt-4 space-y-2 text-xs leading-6 text-ink-soft">
            <li>因子分析：15 道量表题 × 10 = 150（Hair et al., 2019）</li>
            <li>回归：k = 10、f² = 0.15、功效 0.80，N = 118（Cohen, 1988）</li>
            <li>两项取大者 150；150 ÷ (1 − 0.15) = 176.5，取 177</li>
          </ul>
        </aside>
      </section>

      <section className="border-t border-line bg-paper-2">
        <div className="mx-auto max-w-[1200px] px-5 py-14 md:px-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl">服务边界</h2>
            <Link to="/risks" className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink">
              查看说明
            </Link>
          </div>
          <ul className="mt-8 grid gap-px bg-line sm:grid-cols-2 md:grid-cols-4">
            {LIMITS.map(([title, detail], index) => (
              <li key={title} className="bg-paper-2 px-5 py-6">
                <p className="font-serif text-brass tabular-nums">0{index + 1}</p>
                <p className="mt-3 text-base text-ink">{title}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-10">
          <p className="kicker">研究工具</p>
          <h2 className="mt-2 font-serif text-3xl">问卷、访谈提纲与样本量</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
            题目确定之后，再设计调查工具。筛选题依据研究对象的限定条件。量表依据题目中的自变量、因变量，以及中介变量或调节变量。
          </p>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              {
                name: "问卷",
                items: [
                  "包括卷首语、筛选题、基本信息、各变量量表和结束语。",
                  "每个变量给出操作化定义，采用 5 点计分，并至少设置一道反向题。",
                  "卷中设置一道注意力检测题，并附无效问卷的剔除规则。",
                  "附变量与题项对照表、预调查说明和分析计划，可下载 Word。",
                ],
              },
              {
                name: "访谈提纲",
                items: [
                  "纳入标准、排除标准和抽样方式均来自研究对象。",
                  "包括开场、四个主题和收尾。问题针对已经发生的具体事情。",
                  "每道主问题附两至三句追问。",
                  "附登记表、访谈记录要求和初始编码框架。",
                ],
              },
              {
                name: "样本量",
                items: [
                  "按拟采用的分析分别计算。回归使用统计功效，因子分析使用题项比，比例估计使用 Cochran 公式。",
                  "写出公式、代入过程和出处，结果可以复核。",
                  "再按预计无效率计算应发放的份数。",
                  "访谈人数按亚群体和 10+3 饱和规则估算。",
                ],
              },
            ].map((block, index) => (
              <div key={block.name} className="border-t border-ink/15 pt-5">
                <p className="font-serif text-brass tabular-nums">0{index + 1}</p>
                <p className="mt-2 font-serif text-xl">{block.name}</p>
                <ul className="mt-4 space-y-2.5 text-sm leading-7 text-ink-soft">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">价格</p>
              <h2 className="mt-2 font-serif text-3xl">费用按交付内容计算</h2>
            </div>
            <Link to="/pricing" className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink">
              查看计价说明
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {PACKS.map((pack, index) => (
              <div key={pack.name} className={`sheet flex flex-col p-5 ${index === 0 ? "ring-1 ring-ink" : ""}`}>
                <p className="text-sm text-muted">{pack.name}</p>
                <p className="mt-3 font-serif text-4xl tabular-nums">{pack.price}</p>
                <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm leading-7 text-ink-soft">
                  {pack.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[6.5rem_1fr] md:items-start">
      <p className="text-sm text-muted md:pt-3">{label}</p>
      {children}
    </div>
  );
}
