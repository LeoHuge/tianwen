import{r as e}from"./rolldown-runtime-hePW80VL.js";import{N as t,c as n}from"./link-B2hEhiEU.js";import{n as r,o as i,t as a}from"./pay-dialog-21YT6xtB.js";import{D as o,O as s,m as c,t as l}from"./shell--4rNCY5S.js";var u=e(t()),d=[{name:`describe.do`,body:`* 天问 · Stata 描述草稿
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
`},{name:`describe.R`,body:`# 天问 · R 描述草稿
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
`},{name:`codebook.txt`,body:`天问 · 访谈编码表（空）
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
`}],f=n();function p(){let e=c(e=>e.orders),t=c(e=>e.ready),n=e.some(e=>e.status===`paid`&&e.planId===`code`),[p,m]=(0,u.useState)(!1),[h,g]=(0,u.useState)(0),_=d[h]??d[0],v=o(`code`).price;return(0,f.jsxs)(l,{children:[(0,f.jsxs)(`article`,{className:`mx-auto max-w-2xl px-5 py-14`,children:[(0,f.jsxs)(`p`,{className:`text-sm text-muted`,children:[`另外 `,s(v),`，初稿里没有`]}),(0,f.jsx)(`h1`,{className:`mt-3 text-3xl leading-snug`,children:`要跑软件，或要交编码表，买这里。`}),(0,f.jsxs)(`div`,{className:`mt-6 space-y-4 text-base leading-8 text-ink-soft`,children:[(0,f.jsx)(`p`,{children:`付过定金和尾款，拿到的是初稿，不是这些文件。`}),(0,f.jsx)(`p`,{children:`做问卷，给的是 Stata 和 R。它们帮你读入表格、看缺失、做描述。回归那一行被注释掉了，里面没有现成的系数。`}),(0,f.jsx)(`p`,{children:`做访谈，给的是一张空编码表，外加方法里可以改写的几句话。主题和原话留着你填。期刊要的通常是这段说明，不是软件工程文件。`}),(0,f.jsx)(`p`,{children:`列名要按你的表改。Stata 和 NVivo 的许可证不在这个价钱里。`})]}),(0,f.jsx)(`div`,{className:`mt-8`,children:t&&n?(0,f.jsx)(`p`,{className:`text-sm text-muted`,children:`这份浏览器已经解开脚本。`}):(0,f.jsx)(r,{onClick:()=>m(!0),children:i()?`点击解锁全文`:`付 ${s(v)}，看全文`})}),(0,f.jsxs)(`div`,{className:`mt-10`,children:[(0,f.jsx)(`div`,{className:`flex gap-4 text-sm`,children:d.map((e,t)=>(0,f.jsx)(`button`,{className:t===h?`text-ink`:`text-muted`,onClick:()=>g(t),children:e.name},e.name))}),(0,f.jsx)(`pre`,{className:`mt-4 overflow-auto border-t border-line py-4 text-xs leading-6 text-ink-soft`,children:t&&n?_.body:_.body.split(`
`).slice(0,6).join(`
`)+`

…`})]})]}),(0,f.jsx)(a,{planId:`code`,open:p,onOpenChange:m})]})}export{p as component};