import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const studyDir = path.join(root, ".study");
const siteDir = path.join(root, "website");
const publicCardsDir = path.join(siteDir, "public", "cards");

const readText = async (file) => readFile(file, "utf8");

const writeText = async (file, content) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, "utf8");
};

const listFiles = async (dir, ext) => {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(ext))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
};

const stripCodeTicks = (value) => value.replace(/`/g, "");

const escapeHtmlAttribute = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const extractSection = (markdown, heading) => {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return "";

  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s+/.test(line)) break;
    body.push(line);
  }
  return body.join("\n").trim();
};

const extractDashboardLine = (dashboard, label) => {
  const pattern = new RegExp(`^- ${label}：(.+)$`, "m");
  return stripCodeTicks(dashboard.match(pattern)?.[1]?.trim() ?? "未记录");
};

const extractTodoItems = (dashboard) => {
  const section = extractSection(dashboard, "当前待办");
  return section
    .split("\n")
    .filter((line) => line.startsWith("- [ ]"))
    .map((line) => line.replace(/^- \[ \]\s*/, ""))
    .slice(0, 6);
};

const extractLatestDaily = async () => {
  const files = await listFiles(path.join(studyDir, "daily"), ".md");
  return files.at(-1);
};

const parseMindmapStatuses = (markdown) => {
  const counts = new Map();
  const statusPattern = /^- \[(.+?)\]\s+(.+)$/gm;
  let match;
  while ((match = statusPattern.exec(markdown))) {
    const status = match[1];
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return [...counts.entries()];
};

const markdownListToHtml = (markdown) => {
  const items = markdown
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("- "))
    .map((line) => `<li>${line.replace(/^\s*-\s*/, "")}</li>`)
    .join("\n");
  return items ? `<ul>\n${items}\n</ul>` : "<p>暂无记录</p>";
};

const extractHeadingSection = (markdown, heading) => extractSection(markdown, heading) || "- 暂无记录";

const pageTitle = (file) => path.basename(file, ".md");

const slugMap = {
  资料分析: "ziliao-fenxi",
  判断推理: "panduan-tuili",
  言语理解: "yanyu-lijie",
  数量关系: "shuliang-guanxi",
  常识判断: "changshi-panduan"
};

const buildHomePage = async () => {
  const dashboard = await readText(path.join(studyDir, "dashboard.md"));
  const xingce = await readText(path.join(studyDir, "mindmaps", "行测脑图.md"));
  const latestDailyFile = await extractLatestDaily();
  const latestDaily = latestDailyFile ? pageTitle(latestDailyFile) : "暂无";
  const todoItems = extractTodoItems(dashboard);
  const statuses = parseMindmapStatuses(xingce);

  const statusHtml = statuses
    .map(([status, count]) => `<li><span>${status}</span><em>${count} 个</em></li>`)
    .join("\n");

  const currentFocusHtml = markdownListToHtml(extractSection(dashboard, "当前主攻"));
  const todoMarkdown =
    todoItems.length > 0
      ? todoItems.map((item) => `- ${item}`).join("\n")
      : "- 暂无待办，继续保持复盘节奏。";

  return `# 考公学习库

这是一个公开学习网站，用来记录考公备考过程中的知识点、错题、学习日志和记忆卡片。

<div class="home-grid">
  <div class="home-card"><span>备考目标</span><strong>${extractDashboardLine(dashboard, "备考目标")}</strong></div>
  <div class="home-card"><span>当前基础</span><strong>${extractDashboardLine(dashboard, "当前基础")}</strong></div>
  <div class="home-card"><span>每日学习</span><strong>${extractDashboardLine(dashboard, "每日学习时间")}</strong></div>
  <div class="home-card"><span>最近记录</span><strong>${latestDaily}</strong></div>
</div>

<div class="study-panels">
  <section class="study-panel">
    <h2>当前主攻</h2>

${currentFocusHtml}
  </section>

  <section class="study-panel">
    <h2>行测状态</h2>
    <ul class="status-list">
${statusHtml}
    </ul>
  </section>
</div>

## 下次建议

${extractSection(dashboard, "下次建议")}

## 当前待办

${todoMarkdown}

## 快速入口

- [行测知识地图](/xingce/)
- [申论知识地图](/shenlun/)
- [错题本](/mistakes/)
- [学习日志](/daily/)
- [知识卡片](/cards/)
`;
};

const copyMarkdownPage = async (source, target, title) => {
  const content = await readText(source);
  await writeText(target, `# ${title}\n\n${content.replace(/^# .+\n+/, "")}`);
};

const buildIndexPage = (title, description, links) => {
  const items = links.map((link) => `- [${link.text}](${link.href})`).join("\n");
  return `# ${title}\n\n${description}\n\n${items}\n`;
};

const buildCardsPage = async () => {
  const cardFiles = await listFiles(path.join(studyDir, "cards"), ".png");
  const figures = cardFiles
    .map((file) => {
      const name = path.basename(file);
      const caption = name.replace(/\.png$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
      const imageSrc = `/cards/${escapeHtmlAttribute(name)}`;
      const imageAlt = escapeHtmlAttribute(caption);
      return `<figure><button class="card-preview-trigger" type="button" data-card-src="${imageSrc}" data-card-alt="${imageAlt}" aria-label="预览${imageAlt}"><img src="${imageSrc}" alt="${imageAlt}" loading="lazy"></button><figcaption>${imageAlt}</figcaption></figure>`;
    })
    .join("\n");

  return `# 知识卡片

这些卡片用于快速复习核心概念、公式和易错点。图片只是辅助记忆，正式记录仍以 Markdown 学习笔记为准。

<div class="card-gallery">
${figures}
</div>
`;
};

const sync = async () => {
  await mkdir(siteDir, { recursive: true });
  await mkdir(publicCardsDir, { recursive: true });
  await rm(publicCardsDir, { recursive: true, force: true });
  await mkdir(publicCardsDir, { recursive: true });

  const cardFiles = await listFiles(path.join(studyDir, "cards"), ".png");
  for (const file of cardFiles) {
    await cp(file, path.join(publicCardsDir, path.basename(file)));
  }

  await writeText(path.join(siteDir, "index.md"), await buildHomePage());
  await copyMarkdownPage(path.join(studyDir, "plan-2027-guokao.md"), path.join(siteDir, "plan.md"), "备考计划");

  await writeText(
    path.join(siteDir, "mindmaps", "index.md"),
    buildIndexPage("知识地图", "按模块查看当前学习状态。", [
      { text: "行测脑图", href: "/mindmaps/xingce" },
      { text: "申论脑图", href: "/mindmaps/shenlun" }
    ])
  );
  await copyMarkdownPage(path.join(studyDir, "mindmaps", "行测脑图.md"), path.join(siteDir, "mindmaps", "xingce.md"), "行测脑图");
  await copyMarkdownPage(path.join(studyDir, "mindmaps", "申论脑图.md"), path.join(siteDir, "mindmaps", "shenlun.md"), "申论脑图");

  const xingceMindmap = await readText(path.join(studyDir, "mindmaps", "行测脑图.md"));
  await writeText(
    path.join(siteDir, "xingce", "index.md"),
    buildIndexPage("行测", "行测部分按题型整理，先把主力模块做稳。", [
      { text: "资料分析", href: "/xingce/ziliao-fenxi" },
      { text: "判断推理", href: "/xingce/panduan-tuili" },
      { text: "言语理解", href: "/xingce/yanyu-lijie" },
      { text: "数量关系", href: "/xingce/shuliang-guanxi" },
      { text: "常识判断", href: "/xingce/changshi-panduan" }
    ])
  );
  for (const [heading, slug] of Object.entries(slugMap)) {
    await writeText(path.join(siteDir, "xingce", `${slug}.md`), `# ${heading}\n\n${extractHeadingSection(xingceMindmap, heading)}\n`);
  }

  await writeText(
    path.join(siteDir, "shenlun", "index.md"),
    `# 申论\n\n申论部分先从材料阅读、归纳概括和提出对策开始，重点练“从材料里找点”和“分条表达”。\n\n${await readText(
      path.join(studyDir, "mindmaps", "申论脑图.md")
    )}`
  );

  const mistakeFiles = await listFiles(path.join(studyDir, "mistakes"), ".md");
  await writeText(
    path.join(siteDir, "mistakes", "index.md"),
    buildIndexPage(
      "错题本",
      "错题按模块整理，重点看错因、正确规则和下次先做什么。",
      mistakeFiles.map((file) => ({ text: pageTitle(file), href: `/mistakes/${pageTitle(file)}` }))
    )
  );
  for (const file of mistakeFiles) {
    await copyMarkdownPage(file, path.join(siteDir, "mistakes", `${pageTitle(file)}.md`), pageTitle(file));
  }

  const dailyFiles = (await listFiles(path.join(studyDir, "daily"), ".md")).reverse();
  await writeText(
    path.join(siteDir, "daily", "index.md"),
    buildIndexPage(
      "学习日志",
      "按日期记录每天学了什么、做了多少题、错在哪里、下次该做什么。",
      dailyFiles.map((file) => ({ text: pageTitle(file), href: `/daily/${pageTitle(file)}` }))
    )
  );
  for (const file of dailyFiles) {
    await copyMarkdownPage(file, path.join(siteDir, "daily", `${pageTitle(file)}.md`), pageTitle(file));
  }

  await writeText(path.join(siteDir, "cards", "index.md"), await buildCardsPage());
};

await sync();
console.log("study site synced");
