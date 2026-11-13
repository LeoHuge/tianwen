import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { HitList } from "@/components/index-tags";
import { LiteratureDesk } from "@/components/literature-links";
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
import { DisciplineFields } from "@/components/discipline-fields";
import { directionsOf } from "@/lib/research/fields";
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
import { isStaticPreview } from "@/lib/research/static-preview";
import { checkSubject, subjectSentence } from "@/lib/research/subject";
import { TEXT_PARADIGMS } from "@/lib/research/text-paradigms";
import { rulesCandidates } from "@/lib/research/topic-parts";
import { BLANK_SUBJECT, DISCLOSURE, instrumentKind, type Candidate, type HotHit, type Paradigm, type PlanId, type Project } from "@/lib/research/types";

export const Route = createFileRoute("/studio")({ component: StudioPage });

const UNITS = ["个人", "家庭", "社区", "村庄", "学校/班级", "企业/组织", "街道/乡镇", "其他"];
const PARADIGMS: { id: Paradigm; label: string; note: string }[] = [
  { id: "定量", label: "定量 · 问卷调查", note: "题目写清自变量、因变量和中介或调节；之后出问卷和样本量计算书。" },
  { id: "定性", label: "定性 · 半结构访谈", note: "题目写清具体情境和要理解的过程；之后出访谈提纲和访谈人数。" },
  { id: "文本分析", label: "文本分析", note: "题目是理论视角、一份文本和要分析的现象。之后出分类框架和编码说明。" },
  { id: "元分析", label: "元分析", note: "题目写一批已发表研究里的关系。之后出摘录表，不计算合并效应。" },
];

const TEXT_UNITS = ["文本", "词条", "篇目", "镜头"];

type Busy = "search" | "topic" | "instrument" | "model" | "revise" | "file" | null;

function briefKeyOf(project: Project) {
  return [
    project.keywords.map((word) => word.trim()).join("|"),
    JSON.stringify(project.subjectParts),
    project.unit,
    project.track,
    project.category,
    project.branch,
    project.discipline,
    project.field,
    project.paradigm,
  ].join("§");
}

function seedOf(project: Project): InstrumentSeed | null {
  const topic = project.topic;
  if (!topic) return null;
  return {
    kind: instrumentKind(topic.paradigm),
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
  const subjectCheck = checkSubject(project.subjectParts, project.paradigm);
  const vague = vagueKeywords(project.keywords);
  const briefIssue = briefProblem(project, vague, subjectCheck);
  const briefKey = briefKeyOf(project);
  const candidatesFresh = project.candidates.length > 0 && project.candidateKey === briefKey;
  const rerollsLeft = Math.max(0, 1 - project.rerolls);
  const topicLocked = access.instrument;
  // 付过开题包且本项目已经出了题，题目依据的信息就锁定。
  const briefLocked = access.topic && project.candidates.length > 0;
  const kind = instrumentKind(project.paradigm);
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
        track?: unknown;
        category?: unknown;
        branch?: unknown;
        discipline?: unknown;
        field?: unknown;
        paradigm?: unknown;
      };
      if (!Array.isArray(brief.keywords)) return;
      const parts = { ...BLANK_SUBJECT };
      for (const key of Object.keys(parts) as (keyof typeof parts)[]) parts[key] = String(brief.subjectParts?.[key] ?? "");
      const paradigm = brief.paradigm === "定量" || brief.paradigm === "定性" || brief.paradigm === "文本分析" ? brief.paradigm : "";
      patchProject({
        keywords: brief.keywords.map((word) => String(word)).slice(0, 4),
        subjectParts: parts,
        subject: subjectSentence(parts, true, paradigm),
        unit: String(brief.unit ?? "社区"),
        ...(brief.track === "本科" || brief.track === "研究生" ? { track: brief.track } : {}),
        ...(typeof brief.category === "string" ? { category: brief.category } : {}),
        ...(typeof brief.branch === "string" ? { branch: brief.branch } : {}),
        ...(typeof brief.discipline === "string" && brief.discipline ? { discipline: brief.discipline } : {}),
        ...(typeof brief.field === "string" ? { field: brief.field } : {}),
        ...(paradigm ? { paradigm, instrument: instrumentKind(paradigm) } : {}),
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
    if (isStaticPreview() || seed.kind === "text" || seed.kind === "meta") return;
    setBusy("instrument");
    void writeInstrument({
      data: { kind: seed.kind, title: seed.title, question: seed.question, subject: subjectSentence(seed.subject, false, current.paradigm), discipline: seed.discipline, parts: seed.parts, pattern: seed.pattern, note: "" },
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
      .catch(() => setMessage("已保留当前完整版本。"))
      .finally(() => setBusy((value) => (value === "instrument" ? null : value)));
  }, [ready, access.instrument, instrumentKey, project.id, patchProject, writeInstrument]);

  // 付了升级款并传上数据后，先给规则底稿。
  useEffect(() => {
    if (!ready || !access.draft || !dataOk) return;
    const current = useLedger.getState().project;
    if (current.manuscript || !current.topic) return;
    const manuscript = buildManuscript(current, computeSample(current.samplePlan, instrumentKind(current.paradigm)));
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
      hits: hits.map((hit) => ({ name: hit.name, source: hit.source, theme: hit.theme, method: hit.method, variables: hit.variables, population: hit.population })),
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
    const issue = briefProblem(useLedger.getState().project, vagueKeywords(useLedger.getState().project.keywords), checkSubject(useLedger.getState().project.subjectParts, useLedger.getState().project.paradigm));
    if (issue) {
      setMessage(issue);
      document.getElementById("brief")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (isStaticPreview()) {
      const current = useLedger.getState().project;
      const keywords = current.keywords.map((word) => word.trim());
      const avoid = reroll ? current.candidates.map((item) => item.title) : [];
      const items = localRules(current, reroll ? current.hotHits : [], avoid);
      patchProject({
        hotHits: reroll ? current.hotHits : [],
        hotKey: keywords.join("|"),
        searchNote: "",
        candidates: items,
        candidateKey: briefKeyOf(useLedger.getState().project),
        candidateNote: "",
        rerolls: reroll ? current.rerolls + 1 : current.rerolls,
      });
      if (reroll) setRevealOpen(true);
      else scrollTo("topics");
      return;
    }
    setMessage("");
    const current = useLedger.getState().project;
    const keywords = current.keywords.map((word) => word.trim());
    const sentence = subjectSentence(current.subjectParts, false, current.paradigm);
    let hits: HotHit[] = reroll ? current.hotHits : [];
    if (!reroll) {
      setBusy("search");
      let searchNote = "";
      const skipped = new Promise<"skip">((resolve) => {
        skipSearch.current = () => resolve("skip");
      });
      const timer = new Promise<"timeout">((resolve) => window.setTimeout(() => resolve("timeout"), 280_000));
      try {
        const outcome = await Promise.race([lookUp({ data: { keywords, subject: sentence } }), skipped, timer]);
        if (outcome === "skip") searchNote = "题目按关键词和研究对象生成。文献可随后补入。";
        else if (outcome === "timeout") searchNote = "检索时间较长，题目先按关键词和研究对象生成。";
        else if (outcome.ok) {
          hits = outcome.hits;
          if (outcome.note) searchNote = outcome.note;
        }
        else searchNote = "检索未完成，题目按关键词和研究对象生成。文献可随后补入。";
      } catch {
        searchNote = "检索未完成，题目按关键词和研究对象生成。文献可随后补入。";
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
            category: current.category,
            branch: current.branch,
            discipline: current.discipline,
            field: current.field,
            paradigm: current.paradigm || "定量",
            hits: hits.map((hit) => ({
              name: hit.name,
              source: hit.source,
              basis: hit.basis,
              journal: hit.journal,
              indexes: hit.indexes,
              level: hit.level,
              theme: hit.theme,
              method: hit.method,
              variables: hit.variables,
              population: hit.population,
            })),
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
      candidateNote = "题目已按当前材料整理，可以再生成一批。";
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
    if (isStaticPreview()) {
      setMessage("初稿按当前题目和已有材料整理。");
      return;
    }
    setBusy("model");
    setMessage("");
    try {
      const result = await compose({
        data: {
          keywords: current.keywords.map((word) => word.trim()),
          subject: subjectSentence(current.subjectParts, false, current.paradigm),
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
    if (isStaticPreview()) {
      setMessage("这一轮按当前材料整理。");
      return;
    }
    const current = useLedger.getState().project;
    const seed = seedOf(current);
    if (!seed) return;
    if ((seed.kind === "text" || seed.kind === "meta") && !current.manuscript) {
      setMessage(seed.kind === "meta" ? "纳入标准和摘录列随题目生成。如需调整，请先修改题目。" : "分析框架随题目中的范式生成。如需更换范式，请先修改题目。");
      return;
    }
    setBusy("revise");
    setMessage("");
    try {
      if (!current.manuscript) {
        const result = await writeInstrument({
          data: { kind: seed.kind, title: seed.title, question: seed.question, subject: subjectSentence(seed.subject, false), discipline: seed.discipline, parts: seed.parts, pattern: seed.pattern, note: note.trim() },
        });
        if (!result.ok) {
          setMessage(`${result.error}这一轮修订尚未计入。`);
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
            brief: `${current.topic?.title ?? ""}；${subjectSentence(current.subjectParts, false, current.paradigm)}；${current.keywords.join("、")}`,
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
      setMessage(error instanceof Error ? error.message : "修订未完成，这一轮尚未计入。");
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
            <p className="kicker">开题</p>
            <h1 className="mt-2 font-serif text-3xl leading-snug">从四个词到一份能做的开题</h1>
            <ol className="mt-4 space-y-1.5 text-sm leading-7 text-ink-soft">
              <li>① 填写关键词和研究对象 ② 检索近五年论文和立项，给出 3 个题目</li>
              <li>③ 支付开题包 {yuan(TOPIC_FEE)} 后查看三个题目，选定一个并按建议修改</li>
              <li>④ 如需问卷、访谈提纲、文本分析框架或摘录表，按差价继续</li>
            </ol>
          </div>
          <div className="relative bg-ink px-6 py-6 text-on-cinnabar">
            <span className="absolute inset-y-0 left-0 w-1 bg-brass" aria-hidden="true" />
            <p className="text-lg">{!ready ? "正在打开" : access.upgraded ? `已购买${contract.name}` : access.topic ? "已购买开题包" : "尚未购买"}</p>
            <p className="mt-2 text-sm leading-7 text-on-cinnabar/75">
              {isStaticPreview() ? "请到对应文献库检索。题目在本页生成。" : "检索约 2 到 4 分钟，出题不到 2 分钟，问卷约 1 分钟。调查由您自行安排。"}
            </p>
            <p className="mt-5 flex gap-5 text-sm">
              <button className="border-b border-on-cinnabar/50 pb-0.5" onClick={() => replaceProject(exampleProject())}>
                查看示例
              </button>
              <button className="border-b border-on-cinnabar/50 pb-0.5" onClick={() => newProject()}>
                重新开始
              </button>
            </p>
          </div>
        </div>

        <section id="brief" className="mt-10">
          <h2 className="text-xl">{project.paradigm === "文本分析" ? "① 范式、学科与文本" : project.paradigm === "元分析" ? "① 范式、学科与纳入的研究" : "① 范式、学科与研究对象"}</h2>
          {briefLocked ? <p className="mt-2 text-sm text-brass">开题包已购买，题目依据这些信息生成。如需调整题目，请在第 ③ 步按建议修改。</p> : null}
          <div className="mt-5">
            <p className="text-sm text-ink">请选择定量、定性、文本分析或元分析</p>
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
                  onClick={() =>
                    patch({
                      paradigm: item.id,
                      instrument: instrumentKind(item.id),
                      unit:
                        item.id === "文本分析"
                          ? TEXT_UNITS.includes(project.unit)
                            ? project.unit
                            : "文本"
                          : item.id === "元分析"
                            ? "研究"
                            : project.unit === "文本" || project.unit === "研究"
                              ? "个人"
                              : project.unit,
                    })
                  }
                >
                  <span className="block">{item.label}</span>
                  <span className={project.paradigm === item.id ? "block text-xs text-on-cinnabar/80" : "block text-xs text-muted"}>{item.note}</span>
                </button>
              ))}
            </div>
            {project.paradigm === "文本分析" ? (
              <p className="mt-3 text-xs leading-6 text-muted">
                出题时按材料选取三个范式。修改题目时，可以换成全部十二个：{TEXT_PARADIGMS.map((item) => item.label).join("、")}。
              </p>
            ) : null}
          </div>
          <div className="mt-5">
            <DisciplineFields
              variant="studio"
              disabled={briefLocked}
              value={{ track: project.track, category: project.category, branch: project.branch, discipline: project.discipline, field: project.field }}
              onChange={(next) => patch(next)}
            />
          </div>
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
              mode={project.paradigm === "文本分析" ? "text" : project.paradigm === "元分析" ? "meta" : "people"}
              onChange={(subjectParts) => patch({ subjectParts, subject: subjectSentence(subjectParts, true, project.paradigm) })}
            />
          </div>
          <div className="mt-4 max-w-xs">
            <Field label="分析单位">
              <select className={controlClass} value={project.unit} disabled={briefLocked} onChange={(event) => patch({ unit: event.target.value })}>
                {(project.paradigm === "文本分析" ? TEXT_UNITS : project.paradigm === "元分析" ? ["研究"] : UNITS).map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section id="topics" className="mt-12">
          <h2 className="text-xl">② 检索并出 3 个题</h2>
          <p className="mt-2 text-sm leading-7 text-ink-soft">
            {isStaticPreview()
              ? "请用这四个关键词检索中国知网、万方、维普和外文数据库，以及国家自然科学基金、国家社科基金。中文按 CSSCI 来源、CSSCI 扩展版、北大核心、AMI 各级和 CSCD 核对。外文按 SSCI、SCIE、SCI、ESCI、EI 分别核对。课题按重大、重点、一般、面上和青年查看。本页同时给出 3 个题目。"
              : "按四个关键词检索 2021 年以来的中文期刊、外文期刊，以及国家社科基金、国家自然科学基金立项。中文标注 CSSCI 来源、CSSCI 扩展版、北大核心、AMI 各级和 CSCD。外文分别标注 SSCI、SCIE、SCI、ESCI 和 EI。课题按国家社科基金、国家自然科学基金，以及重大、重点、一般、面上、青年和西部查看。三个题目对照这些文献的主题、方法、变量和研究对象来写。"}
          </p>
          <details className="mt-3 text-sm">
            <summary className="min-h-11 py-2 text-muted underline underline-offset-4">出题所用模型</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {MODELS.map((item) => (
                <button
                  key={item.id}
                  disabled={generating}
                  className={modelId === item.id ? "min-h-11 border border-ink px-3 text-sm" : "min-h-11 border border-line px-3 text-sm text-muted"}
                  onClick={() => setModelId(item.id)}
                >
                  {item.name}
                  {item.tier === "premium" ? " · 另行计费" : ""}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-6 text-muted">默认模型即可。若该型号暂不可用，将改用可用型号继续出题。</p>
          </details>
          {briefIssue && !access.topic ? <p className="mt-3 text-sm text-warn">出题前还差一步：{briefIssue}</p> : null}
          {!access.topic ? (
            <Button className="mt-4" disabled={!ready || generating || Boolean(briefIssue)} onClick={() => void runGenerate(false)}>
              {busy === "search"
                ? `正在检索 · ${clock(phaseSec)}`
                : busy === "topic"
                  ? `正在出题 · ${clock(phaseSec)}`
                  : isStaticPreview()
                    ? candidatesFresh
                      ? "重新出 3 个题"
                      : "出 3 个题"
                    : candidatesFresh
                      ? "重新检索并出题"
                      : "检索并出 3 个题"}
            </Button>
          ) : null}
          {isStaticPreview() ? <LiteratureDesk keywords={project.keywords} /> : null}
          {busy === "search" ? (
            <div className="mt-3 text-sm leading-7 text-ink">
              <p className="tabular-nums">检索已进行 {clock(phaseSec)}，通常需要 2 到 4 分钟。</p>
              <button className="min-h-11 text-cinnabar underline underline-offset-4" onClick={() => skipSearch.current?.()}>
                先看题目
              </button>
            </div>
          ) : null}
          {busy === "topic" ? <p className="mt-3 text-sm tabular-nums leading-7 text-ink">正在整理题目 {clock(phaseSec)}。</p> : null}
          {!isStaticPreview() && project.searchNote && project.hotKey === project.keywords.map((word) => word.trim()).join("|") ? (
            <p className="mt-3 border border-line bg-paper-2 px-3 py-2 text-sm text-ink-soft">{project.searchNote}</p>
          ) : null}
          {project.hotHits.length && project.hotKey === project.keywords.map((word) => word.trim()).join("|") ? (
            <div className="mt-5">
              <HitList hits={project.hotHits} keywords={project.keywords} />
            </div>
          ) : null}
          {candidatesFresh || access.topic ? (
            <div className="mt-6">
              {project.candidateNote ? <p className="mb-3 text-sm text-note">{project.candidateNote}</p> : null}
              {!access.topic && candidatesFresh ? (
                <div className="border border-ink bg-paper-2 p-4">
                  <p className="text-base">三个题目已经出好了。</p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {isStaticPreview()
                      ? "点击即可查看三个题目。记录保存在这台浏览器。"
                      : `支付开题包 ${yuan(TOPIC_FEE)} 后即可查看三个题目。题目交付后，该笔费用按购买说明结算。后续研究工具和初稿按差价购买。`}
                  </p>
                  <div className="mt-4">
                    <LockedTopics count={project.candidates.length} />
                  </div>
                  <Button className="mt-4 w-full sm:w-auto" onClick={() => pay("topic")}>
                    {isStaticPreview() ? "查看三个题目" : `支付开题包 ${yuan(TOPIC_FEE)}，查看三个题目`}
                  </Button>
                </div>
              ) : null}
              {access.topic && project.candidates.length ? (
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm text-ink">三个题目{project.topic ? "，已选中的以粗框标出" : "，请先选择一个"}</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <button className="min-h-11 text-cinnabar underline underline-offset-4" onClick={() => setRevealOpen(true)}>
                        查看三个题目
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
                {project.topic.paradigm} · {project.topic.edits ? `已修改 ${project.topic.edits} 次` : "原题"}
                {topicLocked ? ` · 题目已确定，${kind === "text" ? "分析框架" : kind === "meta" ? "摘录表" : kind === "interview" ? "访谈提纲" : "问卷"}按这一题目生成` : ""}
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
                <p className="mt-3 text-xs leading-6 text-muted">
                  修改时请先采用建议，或在选项中更换用词，再作少量措辞调整。购买研究工具之后，题目即固定，
                  {kind === "text" ? "类目和编码说明" : kind === "meta" ? "检索范围和摘录列" : "问卷或提纲、筛选题和样本量"}都依据这一题目生成。
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {access.topic && !access.instrument ? (
          <section id="upgrade" className="mt-12">
            <h2 className="text-xl">④ {kind === "text" ? "分析框架" : kind === "meta" ? "摘录表" : "问卷、样本量"}与初稿</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              开题包 {yuan(TOPIC_FEE)} 已计入。支付差额后即可获得{kind === "text" ? "分析框架" : kind === "meta" ? "摘录表" : kind === "interview" ? "访谈提纲" : "问卷"}
              {kind === "text" ? "和文本范围说明" : kind === "meta" ? "和检索说明" : "和样本量计算书"}。上传数据后，初稿包含在这一档中。
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
                      整档 {yuan(item.total)}，已计入开题包 {yuan(TOPIC_FEE)}
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
            {!project.topic ? <p className="mt-3 text-sm text-warn">请先在上方选定一个题目，{kind === "text" ? "分析框架" : kind === "meta" ? "摘录表" : "问卷或提纲"}将按该题目生成。</p> : null}
            <Button className="mt-4 w-full sm:w-auto" disabled={!project.topic} onClick={() => pay(CONTRACTS[project.tier].upgradeId)}>
              支付差额 {yuan(CONTRACTS[project.tier].upgrade)}，购买{CONTRACTS[project.tier].name}
            </Button>
          </section>
        ) : null}

        {access.instrument && project.topic ? (
          <section id="instrument" className="mt-12">
            <h2 className="text-xl">⑤ {kind === "text" ? "分析框架" : kind === "meta" ? "摘录表" : kind === "scale" ? "问卷" : "访谈提纲"}</h2>
            {busy === "instrument" ? (
              <p className="mt-2 text-sm tabular-nums text-ink">正在按题目整理题项（约 1 分钟，已 {clock(phaseSec)}）。下方先显示完整版本。</p>
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
                      download(`${kind === "text" ? "分析框架" : kind === "meta" ? "摘录表" : kind === "scale" ? "问卷" : "访谈提纲"}-${project.id}.doc`, instrumentWordHtml(doc, sampleHtml(sample)), "application/msword;charset=utf-8")
                    }
                  >
                    下载 Word（含{kind === "text" ? "文本范围说明" : kind === "meta" ? "检索说明" : "样本量计算书"}）
                  </Button>
                  <Button
                    tone="ghost"
                    onClick={() => download(`${kind === "text" ? "分析框架" : kind === "meta" ? "摘录表" : kind === "scale" ? "问卷" : "访谈提纲"}-${project.id}.md`, `${instrumentMarkdown(doc)}\n${sampleMarkdown(sample)}`, "text/markdown;charset=utf-8")}
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
            {!project.manuscript && remaining > 0 && doc && kind !== "text" ? (
              <div className="mt-6 border-t border-line pt-4">
                <Field
                  label={`修改题项（剩余 ${remaining} 轮，${kind === "scale" ? "问卷" : "提纲"}与成稿共用）`}
                  hint={kind === "scale" ? "请写明修改哪一部分、如何修改。筛选题和计分规则保持不变。" : "请写明修改哪个模块、如何修改。筛选标准和登记表保持不变。"}
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
            <h2 className="text-xl">⑥ {kind === "text" ? "文本范围与编码" : kind === "meta" ? "检索与摘录" : "样本量计算书"}</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              {kind === "text"
                ? "这里写纳入的文本范围，以及两名编码者如何用 Cohen's κ 核对类目。κ 按实际归类计算，并写入方法。"
                : kind === "meta"
                ? "先写检索式和纳入标准。效应量从原文摘录，合并效应在摘录表完成之后计算。"
                : kind === "scale"
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
            <p>当前为分析包，交付研究工具和样本量说明。初稿在成稿包中提供。</p>
          </section>
        ) : null}

        {access.draft && project.topic ? (
          <section id="data" className="mt-12">
            <h2 className="text-xl">{kind === "text" ? "⑦ 上传编码表" : kind === "meta" ? "⑦ 上传摘录表" : "⑦ 上传收回的数据"}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              {kind === "text"
                ? "请上传 csv 或 Excel。一行一条摘录，列写类目。文件保存在这台电脑，写稿时使用汇总。"
                : kind === "meta"
                  ? "请上传 csv 或 Excel。一行一项研究，列写效应量、样本量和测法。合并效应在表完成之后计算。"
                  : "请上传 csv 或 Excel，第一行是变量名。文件保存在这台电脑，写稿时使用汇总。上传前请删除姓名、电话等能够认出个人的列。"}
            </p>
            <label
              className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-brass bg-paper-2 px-4 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void onFile(event.dataTransfer.files[0] ?? null);
              }}
            >
              <span className="text-sm">{busy === "file" ? "正在读取…" : "选择文件，或将文件拖到此处"}</span>
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
                  parseNote: "练习数据，16 行，含一个空值和一个 NA。数字不写入初稿。",
                })
              }
            >
              没有文件时，可先查看一份练习表
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
                当前 {summary.rows} 行，低于计算书中的 {sample.target} 份。初稿可以先写描述，推断留到样本达到计算书的要求之后。
              </p>
            ) : null}
          </section>
        ) : null}

        {access.draft && dataOk && project.topic ? (
          <section id="manuscript" className="mt-12">
            <h2 className="text-xl">⑧ 初稿</h2>
            {project.manuscript ? (
              <article className="mt-4 bg-paper-2 p-4">
                <p className="text-xs text-brass">{project.manuscript.source === "model" ? "润色后的一版" : "按当前设计整理的初稿"}</p>
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
                    {busy === "model" ? `正在写 · ${clock(phaseSec)}` : "润色这一版"}
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
        note={planId === "topic" ? "支付后即可查看三个题目。题目交付后，该笔费用按购买说明结算。" : undefined}
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
  if (!project.paradigm) return "请选择定量、定性、文本分析或元分析。";
  if (!project.discipline) return "请再选择一个具体学科。";
  if (project.keywords.some((word) => word.trim().length < 2)) return "四个关键词都需要写满，每个至少两个字。";
  if (vague.length) return `这几个词太宽，看不出要观察什么：${vague.join("、")}。`;
  if (subject.missing.length) return `研究对象还缺：${subject.missing.join("；")}。`;
  if (subject.problems.length) return subject.problems[0]!;
  if (directionsOf(project.discipline).length && !directionsOf(project.discipline).includes(project.field)) return "请再选择一个方向。";
  return null;
}

function delimiterLabel(delimiter: string) {
  if (delimiter === "\t") return "制表符";
  if (delimiter === ",") return "逗号";
  return delimiter;
}
