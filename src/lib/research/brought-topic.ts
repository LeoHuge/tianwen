import { BANNED, MAIN_MAX, TITLE_MAX } from "./topic-parts";
import type { Paradigm } from "./types";

export type BroughtInput = {
  title: string;
  paradigm: "" | Paradigm;
  object: string;
  discipline: string;
};

export type BroughtVerdict = {
  ok: boolean;
  title: string;
  paradigm: Paradigm | "";
  paradigmNote: string;
  problems: string[];
  revisions: string[];
  plan: string;
};

const WHO =
  /企业|公司|学生|教师|患者|居民|老年|农户|员工|用户|儿童|妇女|农民|护士|医师|医生|家长|青少年|大学生|村民|社区|医院|学校|工人|骑手|公务员|流动人口|子女|父母/;
const TEXT_KIND = /年报|字幕|条例|办法|报道|小说|教材|病历|规程|政策|社论|演讲|剧本/;
const TEXT_LENS = /内容分析|话语|叙事|细读|隐喻|意象|框架|符号/;

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
          ? title.endsWith("？") || title.endsWith("?") ? title : `${title}？`
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

export function judgeBroughtTopic(input: BroughtInput): BroughtVerdict {
  const title = input.title.replace(/[ \t\n\r]+/g, "").trim();
  const object = input.object.trim();
  const discipline = input.discipline.trim();
  const problems: string[] = [];
  const revisions: string[] = [];
  if (title.length < 8) {
    problems.push("题目太短。");
    revisions.push("写到 8 个字以上，并写明要看的两件事或一份文本。");
  }
  const main = mainOf(title);
  if (main.length > MAIN_MAX) problems.push(`主标题 ${main.length} 字，请收到 ${MAIN_MAX} 字以内。`);
  if (title.length > TITLE_MAX) problems.push(`连副标题 ${title.length} 字，请收到 ${TITLE_MAX} 字以内。`);
  if (BANNED.test(title)) {
    problems.push("题目用了「浅析、浅谈、现状、对策、探析、探究、研究综述、创新路径、若干思考、刍议」。");
    revisions.push("删掉这些字，改成要观察的条件和结果，或一份文本里的一个现象。");
  }

  const inferred = inferParadigm(title);
  const paradigm = input.paradigm || inferred;
  let paradigmNote = "";
  if (!paradigm) {
    problems.push("从题目里看不出是问卷、访谈、一份文本，还是元分析。");
    revisions.push("定量写「对……的影响」或「中介、调节」。定性写「如何」或「形塑」。文本分析用书名号写出一份文本。元分析在题目里写上「元分析」。");
  } else if (!input.paradigm) {
    paradigmNote = `按题目里的写法，这是${paradigm}。若不是，请改选做法后再评判。`;
  } else if (inferred && inferred !== input.paradigm) {
    problems.push(`题目的写法更接近${inferred}，与所选的${input.paradigm}不一致。`);
    revisions.push(`把做法改成${inferred}，或把题目改成${input.paradigm}的句式后再评判。`);
  }

  if (paradigm === "定量") {
    const pair = pairOf(title);
    if (!pair.left || !pair.right) {
      problems.push("定量题目需要同时写明条件和结果。");
      revisions.push("写成「条件对结果的影响」。若有中介或调节，用冒号写明是哪一个变量。");
    } else if (pair.left === pair.right) {
      problems.push("条件和结果写成了同一个词。");
      revisions.push("条件和结果各用一个能观察的词。");
    }
    if (/导致|造成/.test(title)) {
      problems.push("题目写成了确定的因果。");
      revisions.push("横截面问卷改成「对……的影响」或「与……的关系」。");
    }
    if (!object && !WHO.test(title)) {
      problems.push("题目里还看不出是谁。");
      revisions.push("在题目或对象一栏写明一类人、企业或场所。");
    }
  }

  if (paradigm === "定性") {
    if (!/如何|怎样|何以|形塑|经历/.test(title)) {
      problems.push("定性题目需要写出要理解的过程。");
      revisions.push("把「对……的影响」改成「如何形塑……」或「怎样经历……」。");
    } else if (/提升|促进|优化|赋能|加强|推动/.test(title) && !/形塑|经历|怎样|何以/.test(title)) {
      problems.push("「如何提升」还没有写出要理解的过程。");
      revisions.push("改成这一类人怎样经历这件事，或改成定量的「对……的影响」。");
    }
    if (!object && !WHO.test(title)) {
      problems.push("访谈还看不出找谁。");
      revisions.push("写明受访者是哪一类人，以及他们所处的情境。");
    }
  }

  if (paradigm === "文本分析") {
    const blob = `${title}${object}`;
    if (!/《[^》]{1,40}》/.test(blob) && !TEXT_KIND.test(blob)) {
      problems.push("文本分析需要一份可以逐条摘录的文本。");
      revisions.push("用书名号写出作品、文件或报道的名称，或写明年报、字幕、条例等文本类型。");
    }
    if (!TEXT_LENS.test(title)) {
      problems.push("题目里还看不出要从文本中抽出什么。");
      revisions.push("写上现象或视角，例如「某一现象的内容分析」。");
    }
  }

  if (paradigm === "元分析") {
    if (!title.includes("元分析")) {
      problems.push("元分析的题目需要写上「元分析」。");
      revisions.push("写成「A与B关系的元分析」。");
    }
    if (!pairOf(title).left || !pairOf(title).right) {
      problems.push("请写明要综合的两个变量。");
      revisions.push("两个变量都写进题目，例如「A与B关系的元分析」。");
    }
    if (/r\s*=|d\s*=|I²|I2|p\s*[<=＜]|合并效应\s*[为是=＝]\s*\d/.test(title)) {
      problems.push("题目里写了合并之后的效应。");
      revisions.push("删去系数、I² 和 p 值。效应量在摘录完成之后计算。");
    }
  }

  const uniqueRevisions = [...new Set(revisions)];
  const ok = problems.length === 0 && Boolean(paradigm);
  return {
    ok,
    title,
    paradigm,
    paradigmNote,
    problems,
    revisions: uniqueRevisions,
    plan: ok && paradigm ? writePlan({ title, paradigm, object, discipline }) : "",
  };
}
