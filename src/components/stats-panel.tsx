import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { summarizeCsv } from "@/lib/research/stats";

export function StatsPanel({ csv, demo }: { csv: string; demo: boolean }) {
  const summary = summarizeCsv(csv);
  const category = summary.columns.find((column) => column.kind === "category" && column.categories?.length);
  return (
    <div className="space-y-4">
      {demo ? (
        <p className="border border-cinnabar bg-paper px-3 py-2 text-sm text-cinnabar">
          这是虚构的演示表，只为看界面。禁止写入论文，也不会交给模型。
        </p>
      ) : null}
      <p className="text-sm text-muted">
        计算发生在这台浏览器里。点击生成时，默认不上传逐行原始记录。
        {summary.rows > 0 && summary.rows < 40 ? " 行数很少时，即便只上传均值也可能认出个人，请谨慎勾选。" : ""}
      </p>
      {summary.warnings.map((warning) => (
        <p key={warning} className="text-sm text-brass">
          {warning}
        </p>
      ))}
      {summary.columns.length > 0 ? (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-brass-soft text-ink">
              <tr>
                <th className="px-3 py-2 font-medium">变量</th>
                <th className="px-3 py-2 font-medium">有效</th>
                <th className="px-3 py-2 font-medium">缺失</th>
                <th className="px-3 py-2 font-medium">摘要</th>
              </tr>
            </thead>
            <tbody>
              {summary.columns.map((column) => (
                <tr key={column.name} className="border-t border-line">
                  <td className="px-3 py-2">{column.name}</td>
                  <td className="px-3 py-2 tabular-nums">{column.n}</td>
                  <td className="px-3 py-2 tabular-nums">{column.missing}</td>
                  <td className="px-3 py-2 text-ink-soft">
                    {column.role === "id"
                      ? "标识列，不计算均值"
                      : column.role === "empty"
                        ? "空列"
                        : column.kind === "number"
                          ? `${column.role === "likert" ? "量表分 " : ""}均值 ${column.mean}，标准差 ${column.sd}，${column.min}–${column.max}`
                          : (column.categories ?? []).map((item) => `${item.label} ${item.count}`).join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">贴入带表头的 CSV 后，这里出现描述统计。</p>
      )}
      {category?.categories ? (
        <div className="h-52 w-full border border-line bg-paper-2 p-3">
          <p className="mb-2 text-sm text-ink">{category.name}</p>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={category.categories}>
              <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted)", fontSize: 12 }} width={28} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-cinnabar)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
