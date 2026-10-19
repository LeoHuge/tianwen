import { subjectSentence } from "./subject";
import type { Project } from "./types";
import { blankProject } from "./types";

export function exampleProject(): Project {
  const project = blankProject();
  const subjectParts = {
    where: "某市工业园",
    who: "女工",
    stage: "入职 1 年以上",
    condition: "上夜班、下班乘末班公交通勤",
    time: "",
    exclude: "",
  };
  return {
    ...project,
    keywords: ["夜间公交", "末班时刻", "同事结伴", "通勤安全感"],
    subjectParts,
    subject: subjectSentence(subjectParts),
    unit: "企业/组织",
    discipline: "社会学",
    field: "组织与劳动",
    paradigm: "定性",
    instrument: "interview",
  };
}
