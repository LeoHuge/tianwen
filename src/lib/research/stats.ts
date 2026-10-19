export type ColumnRole = "id" | "likert" | "measure" | "category" | "date" | "empty";

export type ColumnSummary = {
  name: string;
  kind: "number" | "category";
  role: ColumnRole;
  missing: number;
  n: number;
  mean?: number;
  sd?: number;
  min?: number;
  max?: number;
  categories?: { label: string; count: number }[];
  note: string;
};

export type TableSummary = {
  rows: number;
  columns: ColumnSummary[];
  warnings: string[];
};

export type TableRead = {
  csv: string;
  summary: TableSummary;
  fileName: string;
  encoding: string;
  delimiter: string;
  sheet: string | null;
};

const MISSING = /^(na|n\/a|null|none|nan|缺失|无|空|—|－|-|\.)$/i;

export function summarizeCsv(text: string): TableSummary {
  return summarizeRows(parseDelimited(text, sniffDelimiter(text)));
}

export function statsSentence(summary: TableSummary) {
  if (summary.rows === 0) return "";
  const bits = summary.columns
    .filter((column) => column.role !== "id" && column.role !== "empty")
    .map((column) => {
      if (column.kind === "number") {
        return `${column.name}（${roleLabel(column.role)}）：n=${column.n}，均值 ${column.mean}，标准差 ${column.sd}，范围 ${column.min}–${column.max}，缺失 ${column.missing}`;
      }
      const tops = (column.categories ?? []).map((item) => `${item.label} ${item.count}`).join("、");
      return `${column.name}（类别）：有效 ${column.n}，缺失 ${column.missing}，${tops}`;
    });
  return `有效行数 ${summary.rows}。${bits.join("。")}。`;
}

export async function readDataFile(file: File): Promise<TableRead> {
  if (file.size > 8_000_000) throw new Error("文件超过 8MB。请只上传分析要用的列，不要传整库。");
  const buffer = await file.arrayBuffer();
  const lower = file.name.toLowerCase();
  let rows: string[][];
  let encoding = "UTF-8";
  let delimiter = ",";
  let sheet: string | null = null;
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const book = XLSX.read(buffer, { type: "array" });
    sheet = book.SheetNames[0] ?? "";
    if (!sheet || !book.Sheets[sheet]) throw new Error("这个表格里没有可读的工作表。");
    const raw = XLSX.utils.sheet_to_json<(string | number | null)[]>(book.Sheets[sheet], {
      header: 1,
      raw: false,
      defval: "",
    });
    rows = raw.map((row) => row.map((cell) => cleanCell(String(cell ?? ""))));
    delimiter = "Excel";
    encoding = "表格内部";
  } else {
    const decoded = decodeTable(buffer);
    encoding = decoded.encoding;
    delimiter = sniffDelimiter(decoded.text);
    rows = parseDelimited(decoded.text, delimiter).map((row) => row.map((cell) => cleanCell(cell)));
  }
  rows = rows.filter((row) => row.some((cell) => cell !== ""));
  if (rows.length > 5001) {
    rows = rows.slice(0, 5001);
  }
  const summary = summarizeRows(rows);
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    summary.warnings.unshift(`已读工作表「${sheet}」。多表文件只解析第一张。`);
  }
  return { csv: rowsToCsv(rows), summary, fileName: file.name, encoding, delimiter, sheet };
}

function summarizeRows(table: string[][]): TableSummary {
  if (table.length === 0) return { rows: 0, columns: [], warnings: ["没有读到任何行。"] };
  const [header, ...body] = table;
  const width = Math.max(header?.length ?? 0, ...body.map((row) => row.length));
  const names = Array.from({ length: width }, (_, index) => (header?.[index] ?? "").trim() || `列${index + 1}`);
  const warnings: string[] = [];
  if (new Set(names).size !== names.length) warnings.push("有重复列名，后面的同名列会被当成另一列，但导出时容易对错。");
  if (body.length < 30) warnings.push(`目前 ${body.length} 行，少于 30。可以做描述，不宜写成推断结论。`);
  if (body.length >= 5000) warnings.push("只保留前 5000 行，避免把整库塞进浏览器。");

  const columns: ColumnSummary[] = names.map((name, index) => profileColumn(name, body.map((row) => cleanCell(row[index] ?? ""))));
  for (const column of columns) {
    if (column.role === "empty") warnings.push(`「${column.name}」整列是空的。`);
    else if (column.n > 0 && column.missing / (column.n + column.missing) > 0.4) {
      warnings.push(`「${column.name}」缺失超过四成。`);
    }
    if (column.note) warnings.push(`${column.name}：${column.note}`);
  }
  if (!columns.some((column) => column.role === "measure" || column.role === "likert")) {
    warnings.push("没有识别出可计算均值的数值列。请确认第一行是变量名，且分数列是数字。");
  }
  return { rows: body.length, columns, warnings };
}

function profileColumn(name: string, raw: string[]): ColumnSummary {
  const values = raw.map(cleanCell);
  const present = values.filter((value) => value !== "");
  const missing = values.length - present.length;
  if (present.length === 0) {
    return { name, kind: "category", role: "empty", missing, n: 0, note: "", categories: [] };
  }
  const unique = new Set(present);
  const numericValues = present.filter((value) => /^-?\d+(\.\d+)?$/.test(value));
  const numericRatio = numericValues.length / present.length;
  const dateRatio = present.filter((value) => /^\d{4}[-/.年]\d{1,2}/.test(value)).length / present.length;
  if (dateRatio > 0.8) {
    return { name, kind: "category", role: "date", missing, n: present.length, note: "识别为日期，不做均值。", categories: topCounts(present) };
  }
  const idName = /id|编号|序号|学号|样本号/i.test(name);
  if ((idName && unique.size / present.length > 0.9) || (unique.size === present.length && present.length > 8 && numericRatio > 0.9 && idName)) {
    return { name, kind: "category", role: "id", missing, n: present.length, note: "识别为标识列，不进入均值。", categories: [] };
  }
  if (numericRatio > 0.85) {
    const nums = numericValues.map(Number);
    const mean = nums.reduce((sum, value) => sum + value, 0) / nums.length;
    const variance = nums.length > 1 ? nums.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (nums.length - 1) : 0;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const likert = unique.size >= 3 && unique.size <= 7 && min >= 1 && max <= 7 && nums.every((value) => Number.isInteger(value));
    const note = unique.size === 1 ? "这一列没有变异。" : numericValues.length < present.length ? "有少量非数字，已排除出均值。" : "";
    return {
      name,
      kind: "number",
      role: likert ? "likert" : "measure",
      missing: missing + (present.length - numericValues.length),
      n: nums.length,
      mean: round(mean),
      sd: round(Math.sqrt(variance)),
      min: round(min),
      max: round(max),
      note,
    };
  }
  return { name, kind: "category", role: "category", missing, n: present.length, note: "", categories: topCounts(present) };
}

function topCounts(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function roleLabel(role: ColumnRole) {
  if (role === "likert") return "量表分";
  if (role === "measure") return "数值";
  if (role === "date") return "日期";
  return "类别";
}

function cleanCell(value: string) {
  const trimmed = value.replace(/^\uFEFF/, "").trim().replace(/，/g, "");
  if (MISSING.test(trimmed)) return "";
  if (/^-?\d+(\.\d+)?%$/.test(trimmed)) return String(Number(trimmed.slice(0, -1)) / 100);
  return trimmed;
}

function decodeTable(buffer: ArrayBuffer) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const bad = utf8.match(/\uFFFD/g)?.length ?? 0;
  if (bad === 0) return { text: utf8, encoding: "UTF-8" };
  try {
    return { text: new TextDecoder("gbk").decode(buffer), encoding: "GBK" };
  } catch {
    return { text: utf8, encoding: "UTF-8" };
  }
}

function sniffDelimiter(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim()).slice(0, 20);
  const score = (delimiter: string) =>
    lines.reduce((sum, line) => sum + (line.split(delimiter).length - 1), 0);
  const candidates = [",", "\t", ";", "|"] as const;
  return candidates.reduce((best, delimiter) => (score(delimiter) > score(best) ? delimiter : best), ",");
}

function parseDelimited(text: string, delimiter: string): string[][] {
  const source = text.replace(/^\uFEFF/, "").trim();
  if (!source) return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((item) => item.some((value) => value.trim() !== ""));
}

function rowsToCsv(rows: string[][]) {
  return rows
    .map((row) => row.map((cell) => (/[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)).join(","))
    .join("\n");
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export const DEMO_CSV = `id,age,gender,canteen,participation,trust,note
1,67,女,4,3,4,
2,72,男,5,4,4,偶去
3,64,女,2,2,3,
4,81,男,4,3,5,
5,70,女,NA,3,3,拒答食堂题
6,66,男,1,2,2,
7,75,女,5,5,4,
8,69,男,3,2,,
9,78,女,4,4,5,
10,63,男,2,1,2,
11,74,女,5,4,4,
12,68,男,3,3,3,
13,80,女,4,3,4,
14,71,男,2,2,3,
15,65,女,5,4,5,
16,77,男,3,2,3,`;
