import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, '.study/mindmaps/国考公共科目完整脑图.md');
const outputDir = path.join(root, '.study/mindmaps/images');

const sections = parseSections(fs.readFileSync(sourcePath, 'utf8'));
const subtitles = {
  '01': '考试结构、行测六部分、申论三类试卷与五类基础题',
  '02': '党的创新理论、重大部署、重点领域与时政更新',
  '03': '法律、经济、历史人文、科技、地理国情与社会生态',
  '04': '逻辑填空、片段阅读、语句表达与篇章阅读',
  '05': '基础工具、十大常见模型与数字推理',
  '06': '图形、定义、类比、逻辑与分析推理',
  '07': '核心概念、公式、比较方法、速算与陷阱',
  '08': '三类试卷能力、五类题型、阅读表达与卷面要求',
};

const palettes = [
  ['#315B5A', '#DDEAE6', '#88AAA1'],
  ['#7D4F48', '#F2E4DE', '#C39082'],
  ['#4E607A', '#E3E9F1', '#8EA2BF'],
  ['#6C5A7B', '#ECE5F1', '#A997B5'],
  ['#80613F', '#F2E9DA', '#C0A275'],
  ['#3E6653', '#E1ECE5', '#82A58F'],
  ['#4B6575', '#E0EAF0', '#89A9B8'],
  ['#785862', '#F0E3E7', '#B28A96'],
];

fs.mkdirSync(outputDir, { recursive: true });

for (const [index, section] of sections.entries()) {
  const number = section.title.slice(0, 2);
  const title = section.title.slice(3);
  const filename = `${number}-${slug(title)}.svg`;
  const { svg, height } = renderMap({
    number,
    title,
    subtitle: subtitles[number] || '国家公务员考试公共科目完整考点框架',
    cards: section.children,
    palette: palettes[index % palettes.length],
  });
  fs.writeFileSync(path.join(outputDir, filename), svg);
  console.log(`${filename}\t3840×${height}`);
}

console.log(`已生成 ${sections.length} 张 SVG：${outputDir}`);

function parseSections(markdown) {
  const result = [];
  let current = null;
  let stack = [];

  for (const rawLine of markdown.split(/\r?\n/)) {
    const sectionMatch = rawLine.match(/^##\s+(\d{2}\s+.+)$/);
    if (sectionMatch) {
      current = { title: sectionMatch[1].trim(), children: [] };
      result.push(current);
      stack = [{ depth: -1, node: current }];
      continue;
    }

    if (/^##\s+/.test(rawLine)) {
      current = null;
      stack = [];
      continue;
    }

    if (!current) continue;
    const bulletMatch = rawLine.match(/^(\s*)-\s+(.+)$/);
    if (!bulletMatch) continue;

    const depth = Math.floor(bulletMatch[1].length / 2);
    const node = { title: bulletMatch[2].trim(), children: [] };
    while (stack.length && stack.at(-1).depth >= depth) stack.pop();
    const parent = stack.at(-1)?.node || current;
    parent.children.push(node);
    stack.push({ depth, node });
  }

  return result.filter((section) => /^0[1-8]\s/.test(section.title));
}

function renderMap({ number, title, subtitle, cards, palette }) {
  const width = 3840;
  const margin = 120;
  const gap = 64;
  const columnCount = 2;
  const columnWidth = (width - margin * 2 - gap * (columnCount - 1)) / columnCount;
  const headerTop = 90;
  const headerHeight = 360;
  const contentTop = headerTop + headerHeight + 92;
  const cardLayouts = [];
  const columns = Array(columnCount).fill(contentTop);

  for (const [index, card] of cards.entries()) {
    const color = shiftColor(palette[0], index);
    const lines = cardLines(card, columnWidth - 112);
    const height = 122 + lines.reduce((sum, line) => sum + line.height, 0) + 44;
    const column = columns.indexOf(Math.min(...columns));
    const x = margin + column * (columnWidth + gap);
    const y = columns[column];
    cardLayouts.push({ card, x, y, width: columnWidth, height, lines, color, index });
    columns[column] += height + gap;
  }

  const contentBottom = Math.max(...columns) - gap;
  const height = 3840;
  if (contentBottom > height - 170) {
    throw new Error(`${title} 内容高度 ${contentBottom} 超出 3840px 画布，请调整布局`);
  }
  const bg = '#F7F5F0';
  const text = '#243331';
  const muted = '#64716E';

  const paths = cardLayouts.map((layout) => {
    const startX = width / 2;
    const startY = headerTop + headerHeight;
    const endX = layout.x + layout.width / 2;
    const endY = layout.y;
    const midY = startY + (endY - startY) * 0.46;
    return `<path d="M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}" fill="none" stroke="${escapeXml(palette[2])}" stroke-width="5" stroke-opacity="0.34"/>`;
  }).join('\n');

  const cardsSvg = cardLayouts.map((layout) => renderCard(layout, text, muted, palette[1])).join('\n');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <circle cx="155" cy="155" r="94" fill="${palette[1]}" opacity="0.72"/>
  <circle cx="3670" cy="215" r="52" fill="${palette[1]}" opacity="0.72"/>
  <rect x="${margin}" y="${headerTop}" width="${width - margin * 2}" height="${headerHeight}" rx="44" fill="${palette[0]}"/>
  <rect x="${margin + 48}" y="${headerTop + 52}" width="154" height="78" rx="39" fill="#FFFFFF" fill-opacity="0.16"/>
  <text x="${margin + 125}" y="${headerTop + 106}" text-anchor="middle" fill="#FFFFFF" font-size="42" font-weight="700" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">${number}</text>
  <text x="${margin + 242}" y="${headerTop + 128}" fill="#FFFFFF" font-size="96" font-weight="700" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">${escapeXml(title)}</text>
  <text x="${margin + 242}" y="${headerTop + 220}" fill="#FFFFFF" fill-opacity="0.86" font-size="42" font-weight="400" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">${escapeXml(subtitle)}</text>
  <text x="${margin + 242}" y="${headerTop + 296}" fill="#FFFFFF" fill-opacity="0.62" font-size="32" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">国考公共科目 · 2026-08-18 整理</text>
  ${paths}
  ${cardsSvg}
  <text x="${margin}" y="${height - 76}" fill="${muted}" font-size="32" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">依据：2026 年度国考公共科目笔试考试大纲 + 2022—2026 年公开真题题型分析</text>
  <text x="${width - 760}" y="${height - 76}" fill="${muted}" font-size="32" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">2027 年考试以最新官方大纲为准</text>
</svg>`;
  return { svg, height };
}

function cardLines(card, maxWidth) {
  const lines = [];

  for (const child of card.children) {
    if (child.children.length === 0) {
      addWrapped(lines, `• ${child.title}`, 40, 0, maxWidth, 66, false);
      continue;
    }

    addWrapped(lines, child.title, 44, 0, maxWidth, 74, true);
    for (const grandchild of child.children) {
      if (grandchild.children.length === 0) {
        addWrapped(lines, `• ${grandchild.title}`, 39, 30, maxWidth - 30, 65, false);
      } else {
        const joined = `${grandchild.title}：${grandchild.children.map((item) => item.title).join('、')}`;
        addWrapped(lines, `• ${joined}`, 39, 30, maxWidth - 30, 65, false);
      }
    }
    lines.push({ spacer: true, height: 16 });
  }

  if (lines.at(-1)?.spacer) lines.pop();
  return lines;
}

function addWrapped(target, text, fontSize, indent, maxWidth, lineHeight, emphasis) {
  const wrapped = wrapText(text, maxWidth, fontSize);
  wrapped.forEach((part, index) => {
    target.push({
      text: part,
      fontSize,
      indent: indent + (index > 0 ? 28 : 0),
      height: lineHeight,
      emphasis,
    });
  });
}

function renderCard(layout, textColor, mutedColor, softColor) {
  const { x, y, width, height, card, lines, color, index } = layout;
  const titleHeight = 118;
  let cursorY = y + titleHeight + 38;
  const body = [];

  for (const line of lines) {
    if (line.spacer) {
      cursorY += line.height;
      continue;
    }
    const fill = line.emphasis ? color : textColor;
    const weight = line.emphasis ? 650 : 430;
    body.push(`<text x="${x + 54 + line.indent}" y="${cursorY + line.fontSize}" fill="${fill}" font-size="${line.fontSize}" font-weight="${weight}" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">${escapeXml(line.text)}</text>`);
    cursorY += line.height;
  }

  return `
  <g>
    <rect x="${x + 8}" y="${y + 12}" width="${width}" height="${height}" rx="34" fill="#20312E" opacity="0.08"/>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="34" fill="#FFFFFF" stroke="${softColor}" stroke-width="3"/>
    <path d="M ${x + 34} ${y} H ${x + width - 34} Q ${x + width} ${y} ${x + width} ${y + 34} V ${y + titleHeight} H ${x} V ${y + 34} Q ${x} ${y} ${x + 34} ${y}" fill="${color}"/>
    <circle cx="${x + 74}" cy="${y + 59}" r="32" fill="#FFFFFF" fill-opacity="0.2"/>
    <text x="${x + 74}" y="${y + 72}" text-anchor="middle" fill="#FFFFFF" font-size="34" font-weight="700" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">${index + 1}</text>
    <text x="${x + 136}" y="${y + 78}" fill="#FFFFFF" font-size="54" font-weight="700" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">${escapeXml(card.title)}</text>
    ${body.join('\n    ')}
  </g>`;
}

function wrapText(text, maxWidth, fontSize) {
  const lines = [];
  let current = '';
  let width = 0;
  const limit = maxWidth / fontSize;

  for (const char of [...text]) {
    const weight = /[\u0000-\u00ff]/.test(char) ? 0.56 : 1;
    if (width + weight > limit && current) {
      lines.push(current);
      current = char;
      width = weight;
    } else {
      current += char;
      width += weight;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function shiftColor(base, index) {
  const amount = [0, 10, -8, 18, -15, 6][index % 6];
  const value = base.replace('#', '');
  const rgb = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
  return `#${rgb.map((channel) => Math.max(0, Math.min(255, channel + amount)).toString(16).padStart(2, '0')).join('')}`;
}

function slug(value) {
  return value.replace(/[\\/:*?"<>|\s]+/g, '-');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
