import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { HitList } from "@/components/index-tags";
import { InstrumentView } from "@/components/instrument-view";
import { PayDialog } from "@/components/pay-dialog";
import { Button, controlClass, Field } from "@/components/primitives";
import { SampleSheet } from "@/components/sample-sheet";
import { Shell } from "@/components/shell";
import { StatsPanel } from "@/components/stats-panel";
import { SubjectBuilder } from "@/components/subject-builder";
import { LockedTopics, PartsChips, TopicCard, TopicEditDialog, TopicsReveal } from "@/components/topic-dialogs";
import { composeInstrument, composePack, revisePack } from "@/lib/research/ai-fns";
import { CONTRACTS, TOPIC_FEE, yuan } from "@/lib/research/catalog";
import { exampleProject } from "@/lib/research/example";
import { FIELDS, fieldsOf } from "@/lib/research/fields";
import { generateTopics, searchHot } from "@/lib/research/hot-fns";
import {
  buildInstrument,
  constructSummary,
  designFromInstrument,
  instrumentMarkdown,
  instrumentWordHtml,
  type Instrument,
  type InstrumentSeed,
} from "@/lib/research/instrument";
import { MODELS } from "@/lib/research/models";
import { takeOpen } from "@/lib/research/open";
import { computeSample, sampleHtml, sampleMarkdown, sanitize, type SamplePlan } from "@/lib/research/sample-size";
import { buildManuscript, manuscriptMarkdown, vagueKeywords } from "@/lib/research/skeleton";
import { DEMO_CSV, readDataFile, statsSentence, summarizeCsv } from "@/lib/research/stats";
import { projectAccess, useLedger } from "@/lib/research/store";
import { checkSubject, subjectSentence } from "@/lib/research/subject";
import { rulesCandidates } from "@/lib/research/topic-parts";
import { BLANK_SUBJECT, DISCLOSURE, type Candidate, type HotHit, type Paradigm, type PlanId, type Project } from "@/lib/research/types";

export const Route = createFileRoute("/studio")({ component: StudioPage });

const UNITS = ["个人", "家庭", "社区", "村庄", "学校/班级", "企业/组织", "街道/乡镇", "其他"];
const PARADIGMS: { id: Paradigm; label: string; note: string }[] = [
  { id: "定量", label: "定量 · 问卷调查", note: "题目会写清自变量、因变量和中介或调节；之后出问卷和样本量计算书。" },
  { id: "定性", label: "定性 · 半结构访谈", note: "题目会写清具体情境和要理解的过程；之后出访谈提纲和访谈人数计算。" },
];

type Busy = "search" | "topic" | "instrument" | "model" | "revise" | "file" | null;

function briefKeyOf(project: Project) {
  return [
    project.keywords.map((word) => word.trim()).join("|"),
    JSON.stringify(project.subjectParts),
    project.unit,
    project.discipline,
    project.field,
    project.paradigm,
  ].join("§");
}

function seedOf(project: Project): InstrumentSeed | null {
  const topic = project.topic;
  if (!topic) return null;
  return {
    kind: topic.paradigm === "定性" ? "interview" : "scale",
    title: topic.title,
    question: topic.question,
    parts: topic.parts,
    pattern: topic.pattern,
    subject: project.subjectParts,
    unit: project.unit,
    discipline: project.discipline,
    keywords: project.keywords,
  };
}

function planWith(plan: SamplePlan, doc: Instrument | null): SamplePlan {
  const design = designFromInstrument(doc);
  if (!design) return plan;
  return sanitize({ ...plan, items: design.items, factors: design.factors, predictors: design.predictors });
}

function download(name: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function scrollTo(id: string) {
  window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

function StudioPage() {
  const project = useLedger((state) => state.project);
  const orders = useLedger((state) => state.orders);
  const ready = useLedger((state) => state.ready);
  const patchProject = useLedger((state) => state.patchProject);
  const replaceProject = useLedger((state) => state.replaceProject);
  const newProject = useLedger((state) => state.newProject);
  const lookUp = useServerFn(searchHot);
  const makeTopics = useServerFn(generateTopics);
  const writeInstrument = useServerFn(composeInstrument);
  const compose = useServerFn(composePack);
  const revise = useServerFn(revisePack);
  const [message, setMessage] = useState("");
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [phaseSec, setPhaseSec] = useState(0);
  const [modelId, setModelId] = useState(MODELS[0]!.id);
  const [note, setNote] = useState("");
  const skipSearch = useRef<(() => void) | null>(null);

  const access = projectAccess(orders, project.id);
  const tier = access.tier ?? project.tier;
  const contract = CONTRACTS[tier];
  const subjectCheck = checkSubject(project.subjectParts);
  const vague = vagueKeywords(project.keywords);
  const briefIssue = briefProblem(project, vague, subjectCheck);
  const briefKey = briefKeyOf(project);
  const candidatesFresh = project.candidates.length > 0 && project.candidateKey === briefKey;
  const rerollsLeft = Math.max(0, 1 - project.rerolls);
  const topicLocked = access.instrument;
  // 付过开题包且本项目已经出了题，题目依据的信息就锁定。
  const briefLocked = access.topic && project.candidates.length > 0;
  const kind = project.paradigm === "定性" ? "interview" : "scale";
  const sample = useMemo(() => computeSample(project.samplePlan, kind), [project.samplePlan, kind]);
  const summary = useMemo(() => summarizeCsv(project.csv), [project.csv]);
  const dataOk = summary.rows >= 5 && summary.columns.length >= 2;
  const remaining = Math.max(0, access.allowance - project.revisions.length);
  const instrumentKey = project.topic ? `${project.topic.title}§${project.topic.paradigm}` : "";
  const doc = project.instrumentDoc && project.instrumentKey === instrumentKey ? project.instrumentDoc : null;

  useEffect(() => {
    if (!busy || busy === "file") return;
    setPhaseSec(0);
    const id = window.setInterval(() => setPhaseSec((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [busy]);

  useLayoutEffect(() => {
    if (!ready) return;
    const open = takeOpen();
    if (open === "example") {
      replaceProject(exampleProject());
      return;
    }
    if (open === "blank") {
      newProject();
      return;
    }
    const raw = sessionStorage.getItem("tianwen-brief");
    if (!raw) return;
    sessionStorage.removeItem("tianwen-brief");
    try {
      const brief = JSON.parse(raw) as {
        keywords?: unknown[];
        subjectParts?: Record<string, unknown>;
        unit?: unknown;
        discipline?: unknown;
        field?: unknown;
      };
      if (!Array.isArray(brief.keywords)) return;
      const parts = { ...BLANK_SUBJECT };
      for (const key of Object.keys(parts) as (keyof typeof parts)[]) parts[key] = String(brief.subjectParts?.[key] ?? "");
      patchProject({
        keywords: brief.keywords.map((word) => String(word)).slice(0, 4),
        subjectParts: parts,
        subject: subjectSentence(parts),
        unit: String(brief.unit ?? "社区"),
        ...(typeof brief.discipline === "string" && brief.discipline ? { discipline: brief.discipline } : {}),
        ...(typeof brief.field === "string" && brief.field ? { field: brief.field } : {}),
      });
    } catch {
      return;
    }
  }, [ready, replaceProject, newProject, patchProject]);

  // 付了升级款（或分析包）后：先用规则出完整问卷，再请模型改写核心题项。
  useEffect(() => {
    if (!ready || !access.instrument) return;
    const current = useLedger.getState().project;
    const seed = seedOf(current);
    if (!seed) return;
    const key = `${seed.title}§${current.topic!.paradigm}`;
    if (current.instrumentKey === key && current.instrumentDoc) return;
    const base = buildInstrument(seed);
    patchProject({ instrumentDoc: base, instrumentKey: key, samplePlan: planWith(current.samplePlan, base) });
    setBusy("instrument");
    void writeInstrument({
      data: { kind: seed.kind, title: seed.title, question: seed.question, subject: subjectSentence(seed.subject, false), discipline: seed.discipline, parts: seed.parts, pattern: seed.pattern, note: "" },
    })
      .then((result) => {
        if (useLedger.getState().project.instrumentKey !== key) return;
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        const next = buildInstrument(seed, result.part);
        patchProject({ instrumentDoc: next, samplePlan: planWith(useLedger.getState().project.samplePlan, next) });
      })
      .catch(() => setMessage("问卷润色中断了，先用已经生成的完整版本。"))
      .finally(() => setBusy((value) => (value === "instrument" ? null : value)));
  }, [ready, access.instrument, instrumentKey, project.id, patchProject, writeInstrument]);

  // 付了升级款并传上数据后，先给规则底稿。
  useEffect(() => {
    if (!ready || !access.draft || !dataOk) return;
    const current = useLedger.getState().project;
    if (current.manuscript || !current.topic) return;
    const manuscript = buildManuscript(current, computeSample(current.samplePlan, current.paradigm === "定性" ? "interview" : "scale"));
    if (manuscript) patchProject({ manuscript });
  }, [ready, access.draft, dataOk, project.manuscript, project.topic, project.csv, patchProject]);

  function patch(partial: Partial<Project>) {
    patchProject(partial);
  }

  function localRules(current: Project, hits: HotHit[], avoid: string[]) {
    const seed = {
      keywords: current.keywords.map((word) => word.trim()),
      subject: current.subjectParts,
      unit: current.unit,
      discipline: current.discipline,
      field: current.field,
      paradigm: (current.paradigm || "定量") as Paradigm,
      hits: hits.map((hit) => ({ name: hit.name, source: hit.source })),
    };
    const items: Candidate[] = [];
    for (let variant = 0; variant < 4 && items.length < 3; variant += 1) {
      for (const item of rulesCandidates(seed, variant)) {
        if (!avoid.includes(item.title) && !items.some((other) => other.title === item.title)) items.push(item);
      }
    }
    return items.slice(0, 3);
  }

  async function runGenerate(reroll: boolean) {
    const issue = briefProblem(useLedger.getState().project, vagueKeywords(useLedger.getState().project.keywords), checkSubject(useLedger.getState().project.subjectParts));
    if (issue) {
      setMessage(issue);
      document.getElementById("brief")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setMessage("");
    const current = useLedger.getState().project;
    const keywords = current.keywords.map((word) => word.trim());
    const sentence = subjectSentence(current.subjectParts, false);
    let hits: HotHit[] = reroll ? current.hotHits : [];
    if (!reroll) {
      setBusy("search");
      let searchNote = "";
      const skipped = new Promise<"skip">((resolve) => {
        skipSearch.current = () => resolve("skip");
      });
      const timer = new Promise<"timeout">((resolve) => window.setTimeout(() => resolve("timeout"), 185_000));
      try {
        const outcome = await Promise.race([lookUp({ data: { keywords, subject: sentence } }), skipped, timer]);
        if (outcome === "skip") searchNote = "没有等检索，题目只按关键词和研究对象生成。";
        else if (outcome === "timeout") searchNote = "检索超过 3 分钟，先不等了，题目按关键词和研究对象生成。";
        else if (outcome.ok) hits = outcome.hits;
        else searchNote = `${outcome.error}题目按关键词和研究对象生成。`;
      } catch {
        searchNote = "检索中断了，题目按关键词和研究对象生成。";
      }
      skipSearch.current = null;
      patchProject({ hotHits: hits, hotKey: keywords.join("|"), searchNote });
    }
    setBusy("topic");
    const avoid = reroll ? current.candidates.map((item) => item.title) : [];
    let items: Candidate[] = [];
    let candidateNote = "";
    try {
      const result = await Promise.race([
        makeTopics({
          data: {
            keywords,
            subjectParts: current.subjectParts,
            unit: current.unit,
            discipline: current.discipline,
            field: current.field,
            paradigm: current.paradigm || "定量",
            hits: hits.map((hit) => ({ name: hit.name, source: hit.source, basis: hit.basis, journal: hit.journal, indexes: hit.indexes, level: hit.level })),
            modelId,
            avoid,
          },
        }),
        new Promise<"timeout">((resolve) => window.setTimeout(() => resolve("timeout"), 130_000)),
      ]);
      if (result === "timeout") throw new Error("timeout");
      items = result.items;
      candidateNote = result.note;
    } catch {
      candidateNote = "出题服务没有响应，3 个题先按规则生成，稍后可以换一批。";
    }
    if (items.length < 3) {
      for (const item of localRules(current, hits, [...avoid, ...items.map((other) => other.title)])) {
        if (items.length >= 3) break;
        items.push(item);
      }
    }
    patchProject({
      candidates: items,
      candidateKey: briefKeyOf(useLedger.getState().project),
      candidateNote,
      rerolls: reroll ? current.rerolls + 1 : current.rerolls,
    });
    setBusy(null);
    if (reroll) setRevealOpen(true);
    else scrollTo("topics");
  }

  function choose(index: number) {
    const current = useLedger.getState().project;
    const item = current.candidates[index];
    if (!item) return;
    // 已经选中的题再点一次，不把改过的版本冲掉。
    if (!(current.topic?.index === index && current.topic.originalTitle === item.title)) {
      patch({ topic: { ...item, index, originalTitle: item.title, edits: 0 }, manuscript: null });
    }
    setRevealOpen(false);
    scrollTo("topic");
  }

  function pay(id: PlanId) {
    setPlanId(id);
    setPayOpen(true);
  }

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy("file");
    setMessage("");
    try {
      const read = await readDataFile(file);
      patch({
        csv: read.csv,
        csvIsDemo: false,
        includeStats: true,
        fileName: read.fileName,
        parseNote: `${read.fileName} · ${read.encoding} · ${delimiterLabel(read.delimiter)}${read.sheet ? ` · ${read.sheet}` : ""} · ${read.summary.rows} 行`,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "这个文件没有解析成功。");
    } finally {
      setBusy(null);
    }
  }

  async function writeModel() {
    const current = useLedger.getState().project;
    if (!current.topic) return;
    setBusy("model");
    setMessage("");
    try {
      const result = await compose({
        data: {
          keywords: current.keywords.map((word) => word.trim()),
          subject: subjectSentence(current.subjectParts, false),
          unit: current.unit,
          discipline: current.discipline,
          title: current.topic.title,
          question: current.topic.question,
          paradigm: current.topic.paradigm,
          measures: constructSummary(current.instrumentDoc),
          sampleSentence: sample.sentence,
          statsSummary: current.csvIsDemo ? null : statsSentence(summarizeCsv(current.csv)),
        },
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      patchProject({
        manuscript: result.manuscript,
        modelRuns: current.modelRuns + 1,
        analysisPlan: result.analysisPlan || current.analysisPlan,
      });
      document.getElementById("manuscript")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "生成失败");
    } finally {
      setBusy(null);
    }
  }

  async function onRevise() {
    if (remaining <= 0) {
      pay(tier === "revise3" ? "addon-revise" : "addon-buyout");
      return;
    }
    if (note.trim().length < 4) {
      setMessage("写清要改哪里，例如「孤独感部分少一题，加一条关于夜间的题」，不要只写「不好」。");
      return;
    }
    const current = useLedger.getState().project;
    const seed = seedOf(current);
    if (!seed) return;
    setBusy("revise");
    setMessage("");
    try {
      if (!current.manuscript) {
        const result = await writeInstrument({
          data: { kind: seed.kind, title: seed.title, question: seed.question, subject: subjectSentence(seed.subject, false), discipline: seed.discipline, parts: seed.parts, pattern: seed.pattern, note: note.trim() },
        });
        if (!result.ok) {
          setMessage(`${result.error}这一轮没有被消耗。`);
          return;
        }
        const next = buildInstrument(seed, result.part);
        patch({
          instrumentDoc: next,
          samplePlan: planWith(current.samplePlan, next),
          revisions: [...current.revisions, { at: new Date().toISOString(), note: note.trim(), target: "问卷题项" }],
        });
      } else {
        const result = await revise({
          data: {
            note: note.trim(),
            target: "全文结构",
            brief: `${current.topic?.title ?? ""}；${subjectSentence(current.subjectParts, false)}；${current.keywords.join("、")}`,
            manuscript: current.manuscript,
          },
        });
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        patch({
          manuscript: result.manuscript,
          revisions: [...current.revisions, { at: new Date().toISOString(), note: note.trim(), target: "成稿" }],
        });
      }
      setNote("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "修订失败，这一轮没有被消耗。");
    } finally {
      setBusy(null);
    }
  }

  const original = project.topic ? (project.candidates[project.topic.index] ?? null) : null;
  const generating = busy === "search" || busy === "topic";

  return (
    <Shell plain>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:px-10">
        <div className="grid gap-6 md:grid-cols-[1.4fr_0.8fr] md:items-stretch">
          <div className="flex flex-col justify-center">
            <p className="kicker">工作台</p>
            <h1 className="mt-2 font-serif text-3xl leading-snug">从四个词到一份能做的开题</h1>
            <ol className="mt-4 space-y-1.5 text-sm leading-7 text-ink-soft">
              <li>① 写关键词和研究对象 ② 检索近五年论文和立项，出 3 个题</li>
              <li>③ 付开题包 {yuan(TOPIC_FEE)}，三个题马上弹出，选一个按建议修改</li>
              <li>④ 要问卷、样本量计算书和初稿，再补差价升级</li>
            </ol>
          </div>
          <div className="relative bg-ink px-6 py-6 text-on-cinnabar">
            <span className="absolute inset-y-0 left-0 w-1 bg-brass" aria-hidden="true" />
            <p className="text-lg">{!ready ? "正在打开" : access.upgraded ? `已升级${contract.name}` : access.topic ? "开题包已付" : "还没有付款"}</p>
            <p className="mt-2 text-sm leading-7 text-on-cinnabar/75">检索 1 到 3 分钟，出题不到 1 分钟，出问卷约 1 分钟。收数据另算。</p>
            <p className="mt-5 flex gap-5 text-sm">
              <button className="border-b border-on-cinnabar/50 pb-0.5" onClick={() => replaceProject(exampleProject())}>
                看例子
              </button>
              <button className="border-b border-on-cinnabar/50 pb-0.5" onClick={() => newProject()}>
                我重来
              </button>
            </p>
          </div>
        </div>

        <section id="brief" className="mt-10">
          <h2 className="text-xl">① 关键词与研究对象</h2>
          {briefLocked ? <p className="mt-2 text-sm text-brass">开题包已付，题目按这些信息出的，这里不能再改。题目本身可以在第 ③ 步按建议修改。</p> : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {project.keywords.map((word, index) => (
              <Field key={index} label={`关键词 ${index + 1}`}>
                <input
                  className={controlClass}
                  value={word}
                  maxLength={24}
                  disabled={briefLocked}
                  onChange={(event) => {
                    const keywords = project.keywords.slice();
                    keywords[index] = event.target.value;
                    patch({ keywords });
                  }}
                />
              </Field>
            ))}
          </div>
          {vague.length ? <p className="mt-3 text-sm text-warn">这几个词太宽，换成能观察的事物：{vague.join("、")}</p> : null}
          <div className="mt-4">
            <SubjectBuilder
              value={project.subjectParts}
              disabled={briefLocked}
              legacy={project.legacySubject}
              onChange={(subjectParts) => patch({ subjectParts, subject: subjectSentence(subjectParts) })}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="分析单位">
              <select className={controlClass} value={project.unit} disabled={briefLocked} onChange={(event) => patch({ unit: event.target.value })}>
                {UNITS.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </Field>
            <Field label="学科">
              <select
                className={controlClass}
                value={project.discipline}
                disabled={briefLocked}
                onChange={(event) => {
                  const discipline = event.target.value;
                  patch({ discipline, field: fieldsOf(discipline)[0] ?? "" });
                }}
              >
                {FIELDS.map((item) => (
                  <option key={item.name}>{item.name}</option>
                ))}
              </select>
            </Field>
            <Field label="细分">
              <select className={controlClass} value={project.field} disabled={briefLocked} onChange={(event) => patch({ field: event.target.value })}>
                {fieldsOf(project.discipline).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-5">
            <p className="text-sm text-ink">定量还是定性（由你选，不预选）</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {PARADIGMS.map((item) => (
                <button
                  key={item.id}
                  disabled={briefLocked}
                  className={
                    project.paradigm === item.id
                      ? "min-h-11 border border-ink bg-ink px-4 py-2 text-left text-sm text-on-cinnabar disabled:opacity-80"
                      : "min-h-11 border border-line bg-paper px-4 py-2 text-left text-sm disabled:opacity-60"
                  }
                  onClick={() => patch({ paradigm: item.id, instrument: item.id === "定性" ? "interview" : "scale" })}
                >
                  <span className="block">{item.label}</span>
                  <span className={project.paradigm === item.id ? "block text-xs text-on-cinnabar/80" : "block text-xs text-muted"}>{item.note}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="topics" className="mt-12">
          <h2 className="text-xl">② 检索并出 3 个题</h2>
          <p className="mt-2 text-sm leading-7 text-ink-soft">
            按四个关键词检索 2021 年以来的中文期刊、外文期刊，以及国家社科基金、国家自然科学基金立项。中文标注 CSSCI来源、CSSCI扩展版、北大核心、AMI 各级和 CSCD。外文分别标注 SSCI、SCIE、SCI 和 ESCI，不互相替代。课题标注重大、重点、一般、面上和青年。检索结束后给出 3 个具体题目。若检索未完成，仍会给出题目。
          </p>
          <details className="mt-3 text-sm">
            <summary className="min-h-11 py-2 text-muted underline underline-offset-4">出题用哪个模型（默认即可）</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {MODELS.map((item) => (
                <button
                  key={item.id}
                  disabled={generating}
                  className={modelId === item.id ? "min-h-11 border border-ink px-3 text-sm" : "min-h-11 border border-line px-3 text-sm text-muted"}
                  onClick={() => setModelId(item.id)}
                >
                  {item.name}
                  {item.tier === "premium" ? " · 另付" : ""}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-6 text-muted">所选型号不可用时，自动换成能用的型号，不会因此出不了题。GPT、Claude、Kimi 走自己配置的中转站。</p>
          </details>
          {briefIssue && !access.topic ? <p className="mt-3 text-sm text-warn">出题前还差一步：{briefIssue}</p> : null}
          {!access.topic ? (
            <Button className="mt-4" disabled={!ready || generating || Boolean(briefIssue)} onClick={() => void runGenerate(false)}>
              {busy === "search" ? `正在检索 · ${clock(phaseSec)}` : busy === "topic" ? `正在出题 · ${clock(phaseSec)}` : candidatesFresh ? "重新检索并出题" : "检索并出 3 个题"}
            </Button>
          ) : null}
          {busy === "search" ? (
            <div className="mt-3 text-sm leading-7 text-ink">
              <p className="tabular-nums">检索已进行 {clock(phaseSec)}。通常 1 到 3 分钟，超过 3 分钟会自动停下，直接出题。</p>
              <button className="min-h-11 text-cinnabar underline underline-offset-4" onClick={() => skipSearch.current?.()}>
                不等检索，直接出题
              </button>
            </div>
          ) : null}
          {busy === "topic" ? <p className="mt-3 text-sm tabular-nums leading-7 text-ink">正在出题 {clock(phaseSec)}。模型不可用时会按规则先出，不会空手。</p> : null}
          {project.searchNote && project.hotKey === project.keywords.map((word) => word.trim()).join("|") ? (
            <p className="mt-3 border border-line bg-paper-2 px-3 py-2 text-sm text-ink-soft">{project.searchNote}</p>
          ) : null}
          {project.hotHits.length && project.hotKey === project.keywords.map((word) => word.trim()).join("|") ? (
            <div className="mt-5">
              <HitList hits={project.hotHits} />
            </div>
          ) : null}
          {candidatesFresh || access.topic ? (
            <div className="mt-6">
              {project.candidateNote ? <p className="mb-3 text-sm text-note">{project.candidateNote}</p> : null}
              {!access.topic && candidatesFresh ? (
                <div className="border border-ink bg-paper-2 p-4">
                  <p className="text-base">三个题目已经出好了。</p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    付开题包 {yuan(TOPIC_FEE)} 后马上弹出。题目弹出即视为交付，不退；之后要问卷和初稿，只补差价。
                  </p>
                  <div className="mt-4">
                    <LockedTopics count={project.candidates.length} />
                  </div>
                  <Button className="mt-4 w-full sm:w-auto" onClick={() => pay("topic")}>
                    付开题包 {yuan(TOPIC_FEE)}，弹出三个题
                  </Button>
                </div>
              ) : null}
              {access.topic && project.candidates.length ? (
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm text-ink">你的三个题{project.topic ? "（选中的有粗框）" : "，先选一个"}</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <button className="min-h-11 text-cinnabar underline underline-offset-4" onClick={() => setRevealOpen(true)}>
                        弹出来看
                      </button>
                      {!topicLocked ? (
                        <button
                          className="min-h-11 text-cinnabar underline underline-offset-4 disabled:text-muted disabled:no-underline"
                          disabled={rerollsLeft <= 0 || generating}
                          onClick={() => void runGenerate(true)}
                        >
                          {busy === "topic" ? `正在换 · ${clock(phaseSec)}` : rerollsLeft > 0 ? "都不满意，换一批（含 1 次）" : "换一批的次数用完了"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {project.candidates.map((item, index) => (
                      <TopicCard
                        key={item.title}
                        item={item}
                        index={index}
                        active={project.topic?.index === index && project.topic.originalTitle === item.title}
                        onChoose={topicLocked ? undefined : () => choose(index)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              {access.topic && !project.candidates.length ? (
                <div className="border border-line bg-paper-2 p-4 text-sm">
                  <p>开题包已付，但这个项目还没出题。</p>
                  <Button className="mt-3" disabled={generating || Boolean(briefIssue)} onClick={() => void runGenerate(false)}>
                    {busy ? `正在出题 · ${clock(phaseSec)}` : "检索并出 3 个题"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {access.topic && project.topic ? (
          <section id="topic" className="mt-12">
            <h2 className="text-xl">③ 定题</h2>
            <div className="mt-4 border-2 border-ink bg-paper p-4">
              <p className="text-xs text-muted">
                {project.topic.paradigm} · {project.topic.edits ? `已改 ${project.topic.edits} 次` : "原题"}
                {topicLocked ? " · 已锁定，问卷按这一题出" : ""}
              </p>
              <h3 className="mt-2 text-2xl leading-10">{project.topic.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-soft">{project.topic.question}</p>
              <PartsChips parts={project.topic.parts} paradigm={project.topic.paradigm} pattern={project.topic.pattern} title={project.topic.title} />
              {!topicLocked ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button tone="ink" onClick={() => setEditOpen(true)}>
                    按建议修改这一题
                  </Button>
                  <Button tone="ghost" onClick={() => scrollTo("upgrade")}>
                    就用这一题，下一步
                  </Button>
                </div>
              ) : null}
              {!topicLocked ? (
                <p className="mt-3 text-xs leading-6 text-muted">修改不能随意重写：先套用建议、在下拉里换词，最后只能小改几个字。升级之后题目锁定，因为问卷、筛选题和样本量都从这一题来。</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {access.topic && !access.instrument ? (
          <section id="upgrade" className="mt-12">
            <h2 className="text-xl">④ 要问卷、样本量和初稿，补差价</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              开题包已付 {yuan(TOPIC_FEE)}，这里只补差价。补完马上出{project.paradigm === "定性" ? "访谈提纲" : "问卷"}和样本量计算书；传上数据后出初稿，不再另外收钱。
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(Object.keys(CONTRACTS) as (keyof typeof CONTRACTS)[]).map((key) => {
                const item = CONTRACTS[key];
                const active = project.tier === key;
                return (
                  <button key={key} className={active ? "border-2 border-ink bg-paper p-4 text-left" : "border border-line bg-paper p-4 text-left"} onClick={() => patch({ tier: key })}>
                    <p className="text-lg">{item.name}</p>
                    <p className="mt-2 font-serif text-3xl tabular-nums">补 {yuan(item.upgrade)}</p>
                    <p className="mt-1 text-sm text-muted">
                      整档 {yuan(item.total)}，已付 {yuan(TOPIC_FEE)}
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                      {item.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            {!project.topic ? <p className="mt-3 text-sm text-warn">先在上面选定一个题，问卷要按它出。</p> : null}
            <Button className="mt-4 w-full sm:w-auto" disabled={!project.topic} onClick={() => pay(CONTRACTS[project.tier].upgradeId)}>
              补 {yuan(CONTRACTS[project.tier].upgrade)}，升级{CONTRACTS[project.tier].name}
            </Button>
          </section>
        ) : null}

        {access.instrument && project.topic ? (
          <section id="instrument" className="mt-12">
            <h2 className="text-xl">⑤ {kind === "scale" ? "问卷" : "访谈提纲"}</h2>
            {busy === "instrument" ? (
              <p className="mt-2 text-sm tabular-nums text-ink">模型正在按题目改写核心题项（约 1 分钟，已 {clock(phaseSec)}）。下面先给完整的规则版本。</p>
            ) : doc?.source === "model" ? (
              <p className="mt-2 text-sm text-ok">核心题项已由模型按这一题改写。筛选题、计分、质量控制由规则生成。</p>
            ) : null}
            {doc?.notes.map((line) => (
              <p key={line} className="mt-2 text-sm text-note">
                {line}
              </p>
            ))}
            {doc ? (
              <>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    tone="ink"
                    onClick={() =>
                      download(`${kind === "scale" ? "问卷" : "访谈提纲"}-${project.id}.doc`, instrumentWordHtml(doc, sampleHtml(sample)), "application/msword;charset=utf-8")
                    }
                  >
                    下载 Word（含样本量计算书）
                  </Button>
                  <Button
                    tone="ghost"
                    onClick={() => download(`${kind === "scale" ? "问卷" : "访谈提纲"}-${project.id}.md`, `${instrumentMarkdown(doc)}\n${sampleMarkdown(sample)}`, "text/markdown;charset=utf-8")}
                  >
                    下载 Markdown
                  </Button>
                </div>
                <div className="mt-4">
                  <InstrumentView doc={doc} />
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">正在生成…</p>
            )}
            {!project.manuscript && remaining > 0 && doc ? (
              <div className="mt-6 border-t border-line pt-4">
                <Field
                  label={`只改题项（剩 ${remaining} 轮，${kind === "scale" ? "问卷" : "提纲"}和成稿共用）`}
                  hint={kind === "scale" ? "写清改哪一部分、怎么改。筛选题和计分规则不会被改掉。" : "写清改哪个模块、怎么改。筛选标准和登记表不会被改掉。"}
                >
                  <textarea className={`${controlClass} min-h-20`} value={note} onChange={(event) => setNote(event.target.value)} />
                </Field>
                <Button className="mt-3" tone="ghost" disabled={busy !== null} onClick={() => void onRevise()}>
                  {busy === "revise" ? `正在改 · ${clock(phaseSec)}` : "按意见改题项"}
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}

        {access.instrument && project.topic ? (
          <section id="sample" className="mt-12">
            <h2 className="text-xl">⑥ 样本量计算书</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              {kind === "scale"
                ? "有效问卷要收多少，按你要做的分析逐项计算：回归用统计功效（非中心 F 分布，与 G*Power 同一算法），因子分析用题项比，估计比例用 Cochran 公式，最后按无效率放大发放量。每一步写出公式、代入和出处。"
                : "访谈人数按亚群体和 10+3 饱和停止规则计算，再按爽约率放大邀约人数。每一步写出公式和出处。"}
            </p>
            <div className="mt-4">
              <SampleSheet plan={project.samplePlan} kind={kind} onChange={(samplePlan) => patch({ samplePlan })} />
            </div>
          </section>
        ) : null}

        {access.instrument && !access.draft ? (
          <section className="mt-12 border border-line bg-paper-2 p-4 text-sm leading-7">
            <p>你买的是分析包，不含初稿。要初稿，可在价格页补买成稿包。</p>
          </section>
        ) : null}

        {access.draft && project.topic ? (
          <section id="data" className="mt-12">
            <h2 className="text-xl">⑦ 上传你收回来的数据</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              csv 或 Excel，第一行是变量名。表留在你这台电脑上，写稿时只用算好的汇总，不会把原始行交出去。上传前先删掉姓名、电话这类能认出人的列。
            </p>
            <label
              className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-brass bg-paper-2 px-4 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void onFile(event.dataTransfer.files[0] ?? null);
              }}
            >
              <span className="text-sm">{busy === "file" ? "正在解析…" : "点这里选择文件，或把文件拖进来"}</span>
              <span className="mt-1 text-xs text-muted">只传你自己收集的数据</span>
              <input
                className="hidden"
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,.xls"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void onFile(file);
                  event.target.value = "";
                }}
              />
            </label>
            <Button
              className="mt-3"
              tone="ghost"
              onClick={() =>
                patch({
                  csv: DEMO_CSV,
                  csvIsDemo: true,
                  includeStats: false,
                  fileName: "练习数据.csv",
                  parseNote: "练习数据，16 行，含一个空值和一个 NA。不会把这些数字写进成稿。",
                })
              }
            >
              没有文件时，解析一份练习表
            </Button>
            {project.parseNote ? <p className="mt-4 text-sm text-brass">{project.parseNote}</p> : null}
            {project.csv ? (
              <div className="mt-4">
                <StatsPanel csv={project.csv} demo={project.csvIsDemo} />
              </div>
            ) : null}
            {project.csv && !dataOk ? <p className="mt-3 text-sm text-warn">至少要解析出 5 行、2 列，才能出初稿。</p> : null}
            {kind === "scale" && summary.rows > 0 && summary.rows < sample.target ? (
              <p className="mt-3 text-sm text-note">
                现在 {summary.rows} 行，低于样本量计算书的 {sample.target} 份。初稿照样可以出，但结果节只能写描述，不宜下推断结论。
              </p>
            ) : null}
          </section>
        ) : null}

        {access.draft && dataOk && project.topic ? (
          <section id="manuscript" className="mt-12">
            <h2 className="text-xl">⑧ 初稿</h2>
            {project.manuscript ? (
              <article className="mt-4 bg-paper-2 p-4">
                <p className="text-xs text-brass">{project.manuscript.source === "model" ? "写顺后的一版" : "先按你的设计整理的一版"}</p>
                <h3 className="mt-2 text-2xl leading-10">{project.manuscript.title}</h3>
                <p className="mt-3 text-sm leading-7">{project.manuscript.abstract}</p>
                {project.manuscript.sections.map((section) => (
                  <section key={section.heading} className="mt-4">
                    <h4 className="text-lg">{section.heading}</h4>
                    <p className="mt-1 text-sm leading-7 text-ink-soft">{section.body}</p>
                  </section>
                ))}
                {project.manuscript.warnings.map((warning) => (
                  <p key={warning} className="mt-3 text-sm text-warn">
                    {warning}
                  </p>
                ))}
                <p className="mt-4 text-xs text-muted">{DISCLOSURE}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button tone="ink" disabled={busy !== null} onClick={() => void writeModel()}>
                    {busy === "model" ? `正在写 · ${clock(phaseSec)}` : "把这版写顺"}
                  </Button>
                  <Button
                    tone="ghost"
                    onClick={() => {
                      if (!project.manuscript) return;
                      download("tianwen-draft.md", manuscriptMarkdown({ ...project.manuscript, disclosure: DISCLOSURE }), "text/markdown;charset=utf-8");
                    }}
                  >
                    下载
                  </Button>
                </div>
              </article>
            ) : (
              <p className="mt-3 text-sm text-muted">正在整理初稿…</p>
            )}
            <div className="mt-6">
              <Field label={tier === "revise3" ? `结构性修订，剩余 ${remaining} 轮` : `修订，剩余 ${remaining} 轮`}>
                <textarea className={`${controlClass} min-h-20`} value={note} onChange={(event) => setNote(event.target.value)} />
              </Field>
              <Button className="mt-3" tone="ghost" disabled={busy !== null} onClick={() => void onRevise()}>
                {busy === "revise" ? `正在改 · ${clock(phaseSec)}` : remaining > 0 ? "使用 1 轮" : "加购一轮"}
              </Button>
            </div>
          </section>
        ) : null}

        {message ? <p className="mt-6 border border-brass bg-brass-soft px-3 py-2 text-sm">{message}</p> : null}
      </div>
      <PayDialog
        planId={planId}
        open={payOpen}
        projectId={project.id}
        note={planId === "topic" ? "付完马上弹出三个题。题目弹出即视为交付，不退。" : undefined}
        onOpenChange={setPayOpen}
        onPaid={(paid) => {
          if (paid === "topic") window.setTimeout(() => setRevealOpen(true), 120);
          if (paid === "upgrade-buyout" || paid === "upgrade-revise") scrollTo("instrument");
        }}
      />
      <TopicsReveal
        open={revealOpen}
        onOpenChange={setRevealOpen}
        candidates={project.candidates}
        chosenTitle={project.topic?.originalTitle ?? ""}
        onChoose={choose}
      />
      {project.topic ? (
        <TopicEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          topic={project.topic}
          original={original}
          subject={project.subjectParts}
          keywords={project.keywords}
          onSave={(topic) => patch({ topic, manuscript: null })}
        />
      ) : null}
    </Shell>
  );
}

function clock(total: number) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function briefProblem(project: Project, vague: string[], subject: ReturnType<typeof checkSubject>) {
  if (project.keywords.some((word) => word.trim().length < 2)) return "四个关键词都要写满，每个至少两个字。";
  if (vague.length) return `这几个词太宽，看不出要观察什么：${vague.join("、")}。`;
  if (subject.missing.length) return `研究对象还缺：${subject.missing.join("；")}。`;
  if (subject.problems.length) return subject.problems[0]!;
  if (!project.field) return "再选一个细分学科。";
  if (!project.paradigm) return "选定量（问卷）还是定性（访谈）。";
  return null;
}

function delimiterLabel(delimiter: string) {
  if (delimiter === "\t") return "制表符";
  if (delimiter === ",") return "逗号";
  return delimiter;
}
