export const CODE_FILES = [
  {
    name: "describe.do",
    body: `* 天问 · Stata 描述草稿
* 另付项目。不成稿的一部分。
* 不含 Stata 许可。列名是占位，换成你的表再跑。
* 这里不写回归结果。

clear all
import delimited using "your-data.csv", varnames(1) bindquote(strict) encoding(utf8) clear

* 常见缺失写法先变成系统缺失
foreach v of varlist _all {
    capture replace \`v' = "" if inlist(lower(\`v'), "na", "n/a", "null", "缺失", "无")
}

misstable summarize
summarize
* tabulate gender, missing

* 确认变量含义之后，再自己决定要不要回归。
* regress y x1 x2
`,
  },
  {
    name: "describe.R",
    body: `# 天问 · R 描述草稿
# 另付项目。不成稿的一部分。
# 不附带任何系数或 p 值。

dat <- read.csv("your-data.csv", stringsAsFactors = FALSE, na.strings = c("", "NA", "N/A", "null", "缺失", "无"))

sapply(dat, function(x) sum(is.na(x)))
summary(dat)

# 标识列不要拿去求均值。下面只是位置。
# num <- dat[sapply(dat, is.numeric)]
# num <- num[, !grepl("id|编号", names(num), ignore.case = TRUE), drop = FALSE]
# round(sapply(num, function(x) c(mean = mean(x, na.rm = TRUE), sd = sd(x, na.rm = TRUE))), 2)

# 回归留给你自己指定变量。
# summary(lm(y ~ x1 + x2, data = dat))
`,
  },
  {
    name: "codebook.txt",
    body: `天问 · 访谈编码表（空）
另付。不是 NVivo 的结果导出，也不是编好的主题。

期刊通常怎么要求
多数社科期刊不要求提交 .nvp 工程文件。
方法部分一般要写：用什么软件、谁编码、编码表如何形成、有没有第二个人核对。
COREQ、SRQR 一类清单问的是这些，不是软件工程。
有的期刊或审稿人会要编码表作为补充材料。
可识别的访谈原文通常不随稿提交。

方法里可以改写的句子
访谈由研究者本人完成。转写之后用 NVivo（或____）管理节点。
编码由____人完成。先按提纲建立节点，再根据材料增补。
软件只用来存放和检索，不产生结论。

节点（定义和例证由研究者自己填，不要粘贴可识别原文）
节点        来自        定义        不包含        材料位置
场合        关键词      （待写）    （待写）      （待写）
会变化的事  关键词      （待写）    （待写）      （待写）
是谁        研究对象    （待写）    （待写）      （待写）
`,
  },
];
