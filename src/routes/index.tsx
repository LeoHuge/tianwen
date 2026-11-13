import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { IndexTag } from "@/components/index-tags";
import { Poster } from "@/components/poster";
import { Shell } from "@/components/shell";
import { DisciplineFields } from "@/components/discipline-fields";
import { exampleProject } from "@/lib/research/example";
import { directionsOf, type Track } from "@/lib/research/fields";
import { homeExample, metaMaterial, paradigmExampleTitle, textMaterial } from "@/lib/research/home-examples";
import { useLedger } from "@/lib/research/store";
import { checkSubject, META_SLOTS, SUBJECT_SLOTS, subjectSentence, TEXT_SLOTS } from "@/lib/research/subject";
import { BLANK_SUBJECT, blankProject, instrumentKind, type Paradigm, type SubjectParts } from "@/lib/research/types";

export const Route = createFileRoute("/")({ component: Home });

const UNITS = ["个人", "家庭", "社区／村", "组织", "地区"] as const;
const PARADIGMS: { id: Paradigm; label: string; note: string }[] = [
  { id: "定量", label: "定量", note: "问卷，写自变量和因变量" },
  { id: "定性", label: "定性", note: "访谈，写情境和过程" },
  { id: "文本分析", label: "文本分析", note: "一份文本、一个视角" },
  { id: "元分析", label: "元分析", note: "一批已发表研究，摘录效应量" },
];
const HOME_SLOTS = SUBJECT_SLOTS.filter((slot) => slot.need !== "optional");
const FIELD =
  "h-12 w-full min-w-0 border border-line bg-sheet px-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-ink";
const STEPS = ["填写四个关键词", "写清研究对象", "检索近五年文献", "付款后查看并修改题目"];
const LIMITS = [
  ["数据由您提供", "表中的数字须来自您自己的数据。"],
  ["文献保持原文", "题名、期刊和收录均保持检索时的原文。"],
  ["结果由您负责", "开题、答辩与查重按所在单位的要求完成。"],
  ["修改由您决定", "选题和修改由您自行决定。"],
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
  const [paradigm, setParadigm] = useState<"" | Paradigm>("");
  const [track, setTrack] = useState<Track>("研究生");
  const [category, setCategory] = useState("法学");
  const [branch, setBranch] = useState("");
  const [discipline, setDiscipline] = useState("社会学");
  const [keywords, setKeywords] = useState(["", "", "", ""]);
  const [subject, setSubject] = useState<SubjectParts>({ ...BLANK_SUBJECT });
  const [unitTouched, setUnitTouched] = useState(false);
  const [disciplinePicked, setDisciplinePicked] = useState(false);
  const [formError, setFormError] = useState("");
  const textual = paradigm === "文本分析";
  const meta = paradigm === "元分析";
  const storedExample = homeExample(discipline);
  const shownExample = disciplinePicked ? storedExample : null;
  const example =
    shownExample && textual && shownExample.text
      ? shownExample
      : shownExample && !textual && !meta && !shownExample.text
        ? shownExample
        : null;
  const textView = shownExample && textual ? textMaterial(shownExample) : null;
  const metaView = shownExample && meta ? metaMaterial(shownExample) : null;
  const formSlots = textual ? TEXT_SLOTS.filter((slot) => slot.need !== "optional") : meta ? META_SLOTS.filter((slot) => slot.need !== "optional") : HOME_SLOTS;
  const units = textual ? (["文本", ...UNITS] as const) : meta ? (["研究", ...UNITS] as const) : UNITS;
  const [unit, setUnit] = useState<string>(example?.unit ?? "个人");
  const check = checkSubject(subject, paradigm);
  const subjectPlaceholders: Record<string, string> = textView
    ? { where: textView.name, who: textView.kind, stage: textView.scope, condition: textView.part }
    : metaView
      ? { where: metaView.relation, who: metaView.studies, stage: metaView.scope, condition: metaView.extract }
      : example
        ? { where: example.where, who: example.who, stage: example.stage, condition: example.condition }
        : {};

  function pickParadigm(next: Paradigm) {
    setParadigm(next);
    setFormError("");
    const allowed = next === "文本分析" ? ["文本", ...UNITS] : next === "元分析" ? ["研究", ...UNITS] : [...UNITS];
    const peopleUnit = storedExample && storedExample.unit !== "文本" ? storedExample.unit : "个人";
    if (!allowed.includes(unit)) setUnit(next === "文本分析" ? "文本" : next === "元分析" ? "研究" : peopleUnit);
    else if (!unitTouched && next === "文本分析") setUnit("文本");
    else if (!unitTouched && next === "元分析") setUnit("研究");
  }

  function start() {
    if (!paradigm) {
      setFormError("请先选择定量、定性、文本分析或元分析。");
      return;
    }
    const project = blankProject();
    project.keywords = keywords.map((word) => word.trim());
    project.subjectParts = subject;
    project.subject = subjectSentence(subject, true, paradigm);
    project.unit = unit === "社区／村" ? "社区" : unit === "组织" ? "企业/组织" : unit === "地区" ? "街道/乡镇" : unit;
    project.track = track;
    project.category = category;
    project.branch = branch;
    project.discipline = discipline;
    const fieldSource = storedExample?.field ?? "";
    project.field = fieldSource && directionsOf(discipline).includes(fieldSource) ? fieldSource : (directionsOf(discipline)[0] ?? "");
    project.paradigm = paradigm;
    project.instrument = instrumentKind(paradigm);
    sessionStorage.setItem(
      "tianwen-brief",
      JSON.stringify({
        keywords: project.keywords,
        subjectParts: subject,
        unit: project.unit,
        track,
        category,
        branch,
        discipline,
        field: project.field,
        paradigm: project.paradigm,
      }),
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
              <p className="mt-5 font-serif text-[28px] leading-snug text-ink">从四个关键词写起</p>
              <p className="mt-3 text-sm leading-7 text-muted">题目选定之后，仍可按建议修改</p>
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
            写成一份可以实施的开题
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-ink-soft">
            请先选择研究范式，再按目录选择学科，然后填写四个关键词和研究对象。定量出问卷，定性出访谈提纲，文本分析出分类框架，元分析出摘录表。我们检索 2021 年以来的中文期刊、外文期刊，以及国家社科基金、国家自然科学基金立项，给出 3 个具体题目。开题包 ¥199，付款后即可查看，并按建议修改。若还需要问卷、访谈提纲、文本分析框架、摘录表或初稿，再支付差额。
          </p>

          <div className="sheet mt-8">
            <Row label="范式">
              <div className="grid gap-2 sm:grid-cols-2">
                {PARADIGMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      paradigm === item.id
                        ? "min-h-11 border border-ink bg-ink px-4 py-2 text-left text-sm text-on-cinnabar"
                        : "min-h-11 border border-line bg-sheet px-4 py-2 text-left text-sm"
                    }
                    onClick={() => pickParadigm(item.id)}
                  >
                    <span className="block">{item.label}</span>
                    <span className={paradigm === item.id ? "block text-xs text-on-cinnabar/80" : "block text-xs text-muted"}>{item.note}</span>
                  </button>
                ))}
              </div>
            </Row>
            <DisciplineFields
              variant="home"
              value={{ track, category, branch, discipline, field: storedExample?.field ?? "" }}
              onChange={(next) => {
                setTrack(next.track);
                setCategory(next.category);
                setBranch(next.branch);
                setDiscipline(next.discipline);
                setDisciplinePicked(true);
                setFormError("");
                const chosen = homeExample(next.discipline);
                if (!unitTouched && paradigm !== "文本分析" && paradigm !== "元分析" && chosen && chosen.unit !== "文本") setUnit(chosen.unit);
              }}
            />
            <Row label="关键词">
              <div className="grid grid-cols-2 gap-2">
                {keywords.map((word, index) => (
                  <input
                    key={index}
                    value={word}
                    maxLength={24}
                    placeholder={shownExample?.keywords[index]}
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
            <Row label={textual ? "文本" : meta ? "纳入的研究" : "研究对象"}>
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {formSlots.map((slot) => (
                    <label key={slot.key} className="block min-w-0">
                      <span className="mb-1.5 flex items-center gap-2 text-xs text-muted">
                        {slot.label}
                        {slot.need === "must" ? <span className="text-warn">必填</span> : <span>至少填写一项</span>}
                      </span>
                      <input
                        value={subject[slot.key]}
                        maxLength={30}
                        placeholder={subjectPlaceholders[slot.key]}
                        className={FIELD}
                        onChange={(event) => setSubject({ ...subject, [slot.key]: event.target.value })}
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-6 text-muted">
                  {textual
                    ? textView
                      ? `写一份可以逐条摘录的文本。例如「${textView.name}」，类型写「${textView.kind}」，纳入「${textView.part}」。`
                      : "写一份可以逐条摘录的文本。文本名称和文本类型必填，版本与纳入范围至少写一项。理论视角放在关键词里。"
                    : meta
                      ? metaView
                        ? `纳入已经发表的研究。例如看「${metaView.relation}」，只收「${metaView.studies}」，摘录「${metaView.extract}」。合并效应在摘录完成后计算。`
                        : "写要综合的研究关系、纳入哪类研究，以及检索范围和必须摘录的内容。效应量从原文摘录，合并效应在摘录完成后计算。"
                      : example
                      ? `请写明地点和人群。年龄、身份与经历两项中，至少填写一项。例如「${example.where}${example.stage}、${example.condition}的${example.who}」。`
                      : "请写明地点和人群。年龄、身份与经历两项中，至少填写一项。"}
                </p>
                {check.sentence ? (
                  <p className="mt-2 border-l-2 border-brass pl-3 text-sm leading-7 text-ink">{textual ? "文本：" : meta ? "纳入：" : "研究对象："}{check.sentence}</p>
                ) : null}
              </div>
            </Row>
            <Row label="分析单位">
              <div className="flex flex-wrap gap-2">
                {units.map((item) => (
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
            <Link to="/brought" className="inline-flex min-h-12 items-center justify-center px-2 text-sm text-ink underline decoration-line underline-offset-4 transition hover:decoration-ink">
              已有题目，先评判
            </Link>
          </div>
          {formError ? <p className="mt-4 text-sm text-warn">{formError}</p> : null}
          <p className="mt-4 text-sm text-muted">检索和生成题目不收费。查看题目需支付 ¥199。</p>
        </div>

        <aside className="sheet relative overflow-hidden p-7 text-ink md:sticky md:top-24">
          <span className="absolute inset-y-0 left-0 w-1 bg-brass" aria-hidden="true" />
          <p className="kicker">{shownExample ? `题目示例 · ${category || "学科"} · ${discipline}` : "题目示例"}</p>
          {shownExample ? (
            <>
              <h2 className="mt-4 font-serif text-xl leading-8">{paradigmExampleTitle(shownExample, paradigm)}</h2>
              {paradigm === "定性" && !shownExample.text ? (
                <p className="mt-3 text-sm leading-7 text-ink-soft">
                  访谈案例：{shownExample.where}，{shownExample.stage}、{shownExample.condition}的{shownExample.who}。访谈问他们如何经历这一过程。
                </p>
              ) : null}
              {textView ? (
                <p className="mt-3 text-sm leading-7 text-ink-soft">
                  文本案例：{textView.name}，{textView.kind}，{textView.scope}，纳入{textView.part}。
                </p>
              ) : null}
              {metaView ? (
                <p className="mt-3 text-sm leading-7 text-ink-soft">
                  元分析案例：纳入{metaView.scope}、{metaView.studies}，看{metaView.relation}。摘录{metaView.extract}。合并效应在摘录完成之后，按原文中的效应量计算。
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-4 text-sm leading-7 text-ink-soft">{disciplinePicked ? "请按上方学科填写四个关键词" : "选定具体学科后，这里给出一条题目示例"}</p>
          )}
          <p className="mt-5 text-xs text-muted">收录按现行目录标注</p>
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
            <IndexTag id="EI" />
          </div>
          {paradigm === "定量" ? (
            <>
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
            </>
          ) : (
            <p className="mt-6 border-t border-line pt-5 text-sm leading-7 text-ink-soft">
            {paradigm === "文本分析"
              ? "文本分析按文本范围确定材料，由两名编码者独立归类，一致性用 Cohen's κ 报告。"
              : paradigm === "定性"
                ? "访谈按亚群体估计人数，并按饱和情况决定何时停止。计算书写明公式和出处。"
                : paradigm === "元分析"
                  ? "元分析以一项已发表研究为分析单位。先确定检索式和纳入标准，效应量从原文摘录，合并效应在摘录完成之后计算。"
                  : "选择定量后，这里给出一份问卷份数的计算示例"}
            </p>
          )}
        </aside>
      </section>

      <section className="border-t border-line bg-paper-2">
        <div className="mx-auto max-w-[1200px] px-5 py-14 md:px-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl">使用说明</h2>
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
          <h2 className="mt-2 font-serif text-3xl">问卷、访谈提纲、文本分析与样本量</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
            题目确定之后，再设计研究工具。问卷和访谈按研究对象写出筛选题。文本分析按理论视角列出类目，材料是一份文本。
          </p>
          <div className="mt-10 grid gap-10 md:grid-cols-2 xl:grid-cols-4">
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
                name: "文本分析",
                items: [
                  "题目写成理论视角、一份文本和要分析的现象。",
                  "范式包括目的论、归化与异化、生态翻译学、批评话语分析、框架分析、叙事分析、多模态话语分析、互文性、语料库、内容分析、文本细读、符号学。",
                  "交付分类框架：文本范围、类目和判定规则、试编码说明。",
                  "两名编码者独立归类，用 Cohen's κ 报告一致性，并在方法中写明计算过程。",
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
