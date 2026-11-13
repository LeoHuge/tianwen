import { MAIN_MAX, TITLE_MAX } from "./topic-parts";
import type { Paradigm } from "./types";

export type BroughtInput = {
  title: string;
  paradigm: "" | Paradigm;
  object: string;
  discipline: string;
};

export type BroughtRewrite = {
  label: string;
  title: string;
  note: string;
};

export type BroughtVerdict = {
  ok: boolean;
  title: string;
  paradigm: Paradigm | "";
  paradigmNote: string;
  held: string[];
  problems: string[];
  revisions: string[];
  rewrites: BroughtRewrite[];
  plan: string;
};

const WHO =
  /企业|公司|学生|教师|患者|居民|老年|农户|员工|用户|儿童|妇女|农民|护士|医师|医生|家长|青少年|大学生|村民|社区|医院|学校|工人|骑手|公务员|流动人口|子女|父母|小学生|中学生/;
const TEXT_KIND = /年报|字幕|条例|办法|报道|小说|教材|病历|规程|政策|社论|演讲|剧本|课文|实录|教案/;
const TEXT_LENS = /内容分析|话语|叙事|细读|隐喻|意象|框架|符号/;
const BANNED_WORDS = ["研究综述", "创新路径", "若干思考", "浅析", "浅谈", "现状", "对策", "探析", "探究", "刍议"];
const EMPTY_PATTERNS = [
  "的应用现状与优化策略研究",
  "应用现状与优化策略研究",
  "的应用现状与优化策略",
  "应用现状与优化策略",
  "的应用现状与对策研究",
  "应用现状与对策研究",
  "现状与优化策略研究",
  "现状与对策研究",
  "问题与对策研究",
  "问题及对策研究",
  "优化策略研究",
  "现状与对策",
  "问题与对策",
  "问题及对策",
  "应用现状",
  "优化策略",
  "优化路径",
  "提升策略",
  "创新路径",
  "研究综述",
  "若干思考",
];

export function inferParadigm(title: string): Paradigm | "" {
  if (title.includes("元分析")) return "元分析";
  if (/《[^》]{1,40}》/.test(title) || TEXT_LENS.test(title)) return "文本分析";
  if (/如何|怎样|何以|形塑/.test(title) && !/中介|调节/.test(title)) return "定性";
  if (/影响|中介|调节|的关系|与.+关系|导致|造成/.test(title)) return "定量";
  return "";
}

function mainOf(title: string) {
  return (title.split("——")[0] ?? title).trim();
}

function pairOf(title: string) {
  const core = mainOf(title)
    .replace(/[：:].*$/, "")
    .replace(/的元分析$/, "");
  const matched = /(.{2,24}?)(?:对|与)(.{2,24}?)的?(?:影响|关系|效应)/.exec(core);
  const mechanism = /[：:]([^：:]{2,16})的(中介|调节)/.exec(title);
  return {
    left: matched?.[1]?.trim() ?? "",
    right: matched?.[2]?.trim() ?? "",
    mechanism: mechanism?.[1]?.trim() ?? "",
    role: mechanism?.[2] ?? "",
  };
}

function wordsIn(title: string) {
  return BANNED_WORDS.filter((word) => title.includes(word));
}

function stripEmpty(title: string) {
  const hits: string[] = [];
  let substance = title;
  for (const phrase of EMPTY_PATTERNS) {
    if (!substance.includes(phrase)) continue;
    hits.push(phrase.replace(/^的/, ""));
    substance = substance.replace(phrase, "");
  }
  for (const word of ["浅析", "浅谈", "探析", "探究", "刍议"]) {
    if (substance.startsWith(word)) {
      hits.push(word);
      substance = substance.slice(word.length);
    }
  }
  substance = substance.replace(/(的研究|研究)$/, "");
  for (const word of BANNED_WORDS) {
    if (substance.endsWith(word)) {
      hits.push(word);
      substance = substance.slice(0, -word.length);
    }
  }
  substance = substance.replace(/的$/, "").replace(/^[的与和]/, "");
  return { hits: [...new Set(hits)], substance };
}

function splitSubstance(substance: string) {
  const matched = /^(.{4,36}?)在(.{2,24})$/.exec(substance);
  if (!matched) return { method: substance, setting: "" };
  return {
    method: matched[1].replace(/的$/, ""),
    setting: matched[2].replace(/的$/, ""),
  };
}

function structuralProblems(title: string, paradigm: Paradigm | "", object: string) {
  const problems: string[] = [];
  if (!paradigm) return problems;
  if (paradigm === "定量") {
    const pair = pairOf(title);
    if (!pair.left || !pair.right) problems.push("定量题目需要同时写明条件和结果。");
    else if (pair.left === pair.right) problems.push("条件和结果写成了同一个词。");
    if (!object && !WHO.test(title) && !/导致|造成/.test(title)) problems.push("题目里还看不出是谁。");
  }
  if (paradigm === "定性") {
    if (!/如何|怎样|何以|形塑|经历/.test(title)) problems.push("定性题目需要写出要理解的过程。");
    else if (/提升|促进|优化|赋能|加强|推动/.test(title) && !/形塑|经历|怎样|何以/.test(title)) {
      problems.push("「如何提升」还没有写出要理解的过程。");
    }
    if (!object && !WHO.test(title)) problems.push("访谈还看不出找谁。");
  }
  if (paradigm === "文本分析") {
    const blob = `${title}${object}`;
    if (!/《[^》]{1,40}》/.test(blob) && !TEXT_KIND.test(blob)) problems.push("文本分析需要一份可以逐条摘录的文本。");
    if (!TEXT_LENS.test(title)) problems.push("题目里还看不出要从文本中抽出什么。");
  }
  if (paradigm === "元分析") {
    if (!title.includes("元分析")) problems.push("元分析的题目需要写上「元分析」。");
    if (!pairOf(title).left || !pairOf(title).right) problems.push("请写明要综合的两个变量。");
    if (/r\s*=|d\s*=|I²|I2|p\s*[<=＜]|合并效应\s*[为是=＝]\s*\d/.test(title)) problems.push("题目里写了合并之后的效应。");
  }
  return problems;
}

function outcomeHint(text: string) {
  if (/语文/.test(text)) return "发言、阅读理解或书面表达";
  if (/数学/.test(text)) return "解题过程、课堂提问或作业表现";
  if (/英语|外语/.test(text)) return "口语表达、阅读理解或课堂参与";
  if (/课堂|教学|课程/.test(text)) return "参与、互动或当堂表现";
  if (/企业|公司|研发/.test(text)) return "投入、创新或绩效中的一项";
  if (/老年|养老|照料/.test(text)) return "参与、照料或生活安排中的一项";
  if (/医疗|患者|护士|医师/.test(text)) return "就诊、照护或依从中的一项";
  return "一个能看见、能记录的表现";
}

function proposals(input: {
  method: string;
  setting: string;
  object: string;
  paradigm: "" | Paradigm;
  emptyPhrase: string;
  hint: string;
}) {
  const { method, setting, object, emptyPhrase, hint } = input;
  const thing = method || "【待补：现象】";
  const place = setting ? `在${setting}，` : "";
  const who = object || "【待补：上课的教师或学生】";
  const dropped = emptyPhrase ? `删去「${emptyPhrase}」。` : "删去现状、策略和对策。";
  const kept = [method, setting].filter(Boolean).map((item) => `「${item}」`).join("和");
  const quant = `${place}${thing}对【待补：结果】的影响`;
  const qual = setting ? `${who}如何在${setting}里组织${thing}` : `${who}如何经历${thing}`;
  const text = `《【待补：一份文本的名称】》中${thing}的内容分析`;
  const meta = `${thing}与【待补：另一个变量】关系的元分析`;
  const all: BroughtRewrite[] = [
    {
      label: "定量",
      title: quant,
      note: `${dropped}保留${kept || "题目里的现象"}，改成条件和结果。结果不要写策略。请收成${hint}中的一项，按您的课题选定。选定之前，不要用这句写方案。`,
    },
    {
      label: "定性",
      title: qual,
      note: `${dropped}改成过程，不要写成如何优化或如何提升。方括号换成实际受访者，并写明是哪一种课或哪一种情境。`,
    },
    {
      label: "文本分析",
      title: text,
      note: "只有材料已经是一份课文、课堂实录或教案时才用。书名号里写那一份文本的名称，结论停在这一份文本。",
    },
    {
      label: "元分析",
      title: meta,
      note: "只有准备综合已经发表、并且报告了效应量的研究时才用。两个变量都要写进题目。合并效应等摘录完成后再计算。",
    },
  ];
  if (input.paradigm) return all.filter((item) => item.label === input.paradigm);
  return all.filter((item) => item.label === "定量" || item.label === "定性");
}

function writePlan(input: {
  title: string;
  paradigm: Paradigm;
  object: string;
  discipline: string;
}) {
  const { title, paradigm, object, discipline } = input;
  const pair = pairOf(title);
  const disc = discipline ? `按「${discipline}」组织文献和工具。` : "学科按所在院系的目录填写。";
  const who = object || title.match(WHO)?.[0] || "【待补：地点、人群和可核对的界限】";
  const book = /《[^》]{1,40}》/.exec(title + object)?.[0] ?? (object || "题目中的这份文本");
  const aside = /[：:]([^：:]{2,20})$/.exec(mainOf(title))?.[1]?.trim() ?? "";
  const question =
    paradigm === "文本分析"
      ? `从${book}抽出题目里的现象，并按选定的视角归类。每个判断都要能回到原文位置。`
      : paradigm === "元分析"
        ? `已发表研究里，${pair.left || "【待补：条件】"}与${pair.right || "【待补：结果】"}的效应是否同方向？${pair.mechanism ? `${pair.mechanism}是否改变这一关系？` : aside ? `题目还列出「${aside}」，摘录时单独记录。` : ""}合并效应在摘录完成之后计算。`
        : paradigm === "定性"
          ? title.endsWith("？") || title.endsWith("?")
            ? title
            : `${title}？`
          : `在${who}中，${pair.left || "【待补：条件】"}与${pair.right || "【待补：结果】"}是什么关系？${pair.mechanism ? `${pair.mechanism}在其中起${pair.role || "中介"}作用吗？` : ""}`;
  const design =
    paradigm === "文本分析"
      ? "划定这一份文本的版本、时间和纳入部分。先定类目，再由两名编码者独立归类，用 Cohen's κ 报告一致性。"
      : paradigm === "元分析"
        ? "先写检索式、检索日期和纳入标准。纳入的研究必须报告效应量和样本量。效应量从原文抄录，合并效应在摘录表完成之后计算。"
        : paradigm === "定性"
          ? "半结构访谈。按题目中的过程分模块提问，每道主问题准备追问。主题从材料里归纳。"
          : "横截面问卷。题目里的影响写成关联。筛选题确认对象资格，再测量题目中的变量。";
  const material =
    paradigm === "文本分析"
      ? `材料是${book}。理论视角和现象以题目为准。一份文本的结论写在这一份文本之内。`
      : paradigm === "元分析"
        ? "材料是一批已经发表、并且报告了效应量的实证研究。检索范围、语种和必须摘录的列在开工前写明。"
        : `对象是${who}。地点、年龄或身份、经历这几项里，题目没有写明的，在发放或邀约前补上。`;
  return [
    `# ${title}`,
    "",
    "## 研究方案",
    "",
    `研究问题：${question}`,
    "",
    `做法：${design}`,
    "",
    material,
    "",
    disc,
    "",
    "## 研究计划",
    "",
    "1. 用题目里的现象和对象检索 2021 年以来的期刊与立项。没有打开页面核对的条目不写入正文，需要补出处时标【待核验】。",
    paradigm === "文本分析"
      ? "2. 写出文本范围、类目和判定规则，并做一次试编码。"
      : paradigm === "元分析"
        ? "2. 写出检索式和摘录表。列包括作者年份、效应量、标准误或可换算的统计量、样本量、测法。"
        : paradigm === "定性"
          ? "2. 写出纳入标准、访谈模块、追问和登记表。"
          : "2. 按题目中的变量写题项、筛选题和无效问卷的剔除规则，并按拟做的分析计算问卷份数。",
    paradigm === "元分析"
      ? "3. 检索、筛入、摘录。篇数和效应量在摘录之后填写。"
      : paradigm === "文本分析"
        ? "3. 两名编码者独立归类。条数和例句在编码完成之后写入。"
        : paradigm === "定性"
          ? "3. 按亚群体安排访谈，并按饱和情况决定何时停止。原话在访谈完成之后写入。"
          : "3. 发放、回收、核算。系数和 p 值在核算完成之后写入。",
    "4. 初稿只回答上面的研究问题。文献出处和结果数字在核对、核算或摘录之后写入。",
    "",
  ].join("\n");
}

function finish(partial: Omit<BroughtVerdict, "plan"> & { object: string; discipline: string }): BroughtVerdict {
  const { object, discipline, ...rest } = partial;
  const plan = rest.ok && rest.paradigm ? writePlan({ title: rest.title, paradigm: rest.paradigm, object, discipline }) : "";
  return { ...rest, plan };
}

export function judgeBroughtTopic(input: BroughtInput): BroughtVerdict {
  const title = input.title.replace(/[ \t\n\r]+/g, "").trim();
  const object = input.object.trim();
  const discipline = input.discipline.trim();
  const base = {
    title,
    paradigm: input.paradigm,
    paradigmNote: "",
    held: [] as string[],
    problems: [] as string[],
    revisions: [] as string[],
    rewrites: [] as BroughtRewrite[],
    object,
    discipline,
  };
  if (title.includes("【待补")) {
    return finish({
      ...base,
      ok: false,
      problems: ["方括号里仍是提示，不是题目里的结果、人或文本。"],
      revisions: ["把方括号换成具体的词，再评判。换上的词不要是现状、策略、对策或路径。"],
    });
  }
  if (title.length < 8) {
    return finish({
      ...base,
      ok: false,
      problems: ["题目太短。"],
      revisions: ["写到 8 个字以上，并写明要看的两件事或一份文本。"],
    });
  }

  const problems: string[] = [];
  const revisions: string[] = [];
  const main = mainOf(title);
  if (main.length > MAIN_MAX) problems.push(`主标题 ${main.length} 字，请收到 ${MAIN_MAX} 字以内。`);
  if (title.length > TITLE_MAX) problems.push(`连副标题 ${title.length} 字，请收到 ${TITLE_MAX} 字以内。`);

  const reading = stripEmpty(title);
  const bannedHits = wordsIn(title);
  const { method, setting } = splitSubstance(reading.substance);
  const held = [setting ? `场所：${setting}` : "", method ? `现象或方法：${method}` : ""].filter(Boolean);
  const inferred = inferParadigm(title);
  const paradigm = input.paradigm || inferred;
  let paradigmNote = "";
  if (paradigm && !input.paradigm) paradigmNote = `按题目里的写法，这是${paradigm}。若不是，请改选做法后再评判。`;
  if (input.paradigm && inferred && inferred !== input.paradigm) {
    problems.push(`题目的写法更接近${inferred}，与所选的${input.paradigm}不一致。`);
  }

  const shape = structuralProblems(title, paradigm, object);
  const cleaned = reading.substance;
  const cleanedParadigm = input.paradigm || inferParadigm(cleaned);
  const cleanedShape = cleaned && cleaned !== title ? structuralProblems(cleaned, cleanedParadigm, object) : null;
  const cleanedBanned = cleaned ? wordsIn(cleaned) : [];
  const cleanedReady = Boolean(cleaned && cleaned !== title && cleanedShape && cleanedShape.length === 0 && cleanedBanned.length === 0 && cleanedParadigm);

  const quoted = reading.hits[0] || bannedHits.join("、");
  const hint = outcomeHint(`${title}${object}`);
  if (reading.hits.length > 0 || bannedHits.length > 0) {
    if (cleanedReady) {
      problems.push(`「${quoted}」贴在一句已经成立的题目后面，没有增加内容。删掉即可，不要把策略或对策加回去。`);
    } else {
      problems.push(`「${quoted}」把题目写成了调查现状，再提出办法。现状不是研究问题，策略和对策是还没做出来的结论，这两处都要删。`);
      if (method && setting) {
        problems.push(`「${method}」和「${setting}」仍是两个大范围。题目还没有收成一次可以做完的研究：谁，以及要看的一个结果，或一节课里怎样做。`);
      } else if (reading.substance) {
        problems.push(`留下的「${reading.substance}」还太宽。要补上是谁，以及要看的结果或过程。`);
      }
      problems.push(`读者看不出结果。若做问卷，结果要收成${hint}中的一项，由您按课题选定。若做访谈，要写成谁怎样做，不要写成如何优化。`);
      revisions.push(`删去「${quoted}」。不要把策略、路径、对策写回题目。`);
      if (method || setting) {
        revisions.push(`保留${[method, setting].filter(Boolean).map((item) => `「${item}」`).join("和")}。`);
      }
      revisions.push("补上一个结果，或补上谁在具体场景里怎样做。地点、年级或机构在开题里写明。");
    }
  }

  if (!paradigm && !reading.hits.length) {
    problems.push("从题目里看不出是问卷、访谈、一份文本，还是元分析。");
  }
  for (const item of shape) {
    if (reading.hits.length > 0 && /需要同时写明|需要写出要理解|看不出是谁|看不出找谁|需要一份|需要写上「元分析」|两个变量/.test(item)) continue;
    if (/导致|造成/.test(title) && /需要同时写明/.test(item)) continue;
    problems.push(item);
  }

  let rewrites: BroughtRewrite[] = [];
  if (cleanedReady && cleanedParadigm) {
    rewrites = [
      {
        label: cleanedParadigm,
        title: cleaned,
        note: `删去「${quoted}」。条件和结果都还在，这句可以再评判。不要把对策或策略加回去。`,
      },
    ];
  } else if (reading.hits.length > 0 && reading.substance) {
    rewrites = proposals({ method, setting, object, paradigm: input.paradigm, emptyPhrase: quoted, hint });
  } else if (/导致|造成/.test(title)) {
    const swapped = title.replace(/导致|造成/g, "对");
    const cause = /导致|造成/.exec(title)?.[0] ?? "导致";
    problems.push(`「${cause}」把一次调查写成了已经确定的因果。横截面问卷只能写关联。`);
    rewrites = [
      {
        label: "定量",
        title: swapped.endsWith("的影响") ? swapped : `${swapped}的影响`,
        note: `把「${cause}」改成「对……的影响」。若有中介或调节，用冒号写出那个变量，不要写成策略。`,
      },
    ];
  } else if (problems.some((item) => item.includes("如何提升"))) {
    revisions.push("删去「提升」。提升是希望达到的目标，不是要理解的过程。");
    revisions.push("改成这一类人怎样经历这件事，或改成某个条件对某个结果的影响。目标和策略都不要留在题目里。");
  } else if (problems.length > 0 && reading.hits.length === 0) {
    revisions.push("定量补上条件和结果。定性改成谁怎样做。文本写出一份文本的名称。元分析写出两个变量，并写上元分析。");
  }

  const uniqueProblems = [...new Set(problems)];
  const ok = uniqueProblems.length === 0 && Boolean(paradigm);
  return finish({
    ...base,
    ok,
    paradigm,
    paradigmNote: ok ? paradigmNote : "",
    held: ok ? [] : held.filter((item) => !rewrites.some((item2) => item.endsWith(item2.title))),
    problems: uniqueProblems,
    revisions: [...new Set(revisions)],
    rewrites: ok ? [] : rewrites,
  });
}
