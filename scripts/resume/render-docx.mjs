import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import JSZip from "jszip";

const COLOR = {
  text: "171719",
  body: "48494C",
  muted: "7D7E82",
  light: "A7A8AC",
  line: "171719",
  softLine: "E8E8E9",
  iconBackground: "F7F7F8",
  icon: "55565A",
  white: "FFFFFF",
};

const PAGE_WIDTH = 11906;
const PAGE_MARGIN = 771;
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);
const ITEM_INDENT = 771;
const ICON_WIDTH = 544;
const ICON_GAP = 227;
const BODY_WIDTH = CONTENT_WIDTH - ICON_WIDTH - ICON_GAP;

const NIL_BORDER = { color: COLOR.white, style: BorderStyle.NIL, size: 0 };
const NO_BORDERS = {
  top: NIL_BORDER,
  bottom: NIL_BORDER,
  left: NIL_BORDER,
  right: NIL_BORDER,
  insideHorizontal: NIL_BORDER,
  insideVertical: NIL_BORDER,
};

const baseRun = { font: "Malgun Gothic", size: 18, color: COLOR.text };
const textOf = (value) => typeof value === "string" ? value : value?.text;
const textsOf = (value) => (Array.isArray(value) ? value : [value]).map(textOf).filter(Boolean);
const text = (value, options = {}) => new TextRun({ text: value, ...baseRun, ...options });
const muted = (value, options = {}) => text(value, { color: COLOR.muted, ...options });
const strong = (value, options = {}) => text(value, { bold: true, ...options });

const paragraph = (children, options = {}) => new Paragraph({
  keepLines: true,
  widowControl: true,
  spacing: { after: 0, line: 324 },
  ...options,
  children,
});

const link = (label, url, options = {}) => new ExternalHyperlink({
  link: url,
  children: [text(label, { color: options.color ?? COLOR.muted, size: options.size ?? 17, underline: options.underline })],
});

const tableCell = ({ children, width, borders = NO_BORDERS, margins = {}, verticalAlign = VerticalAlign.TOP, shading }) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    margins: { top: 0, right: 0, bottom: 0, left: 0, ...margins },
    verticalAlign,
    shading,
    children,
  });

const fixedTable = (columnWidths, rows, indent = 0) => new Table({
  width: { size: columnWidths.reduce((sum, width) => sum + width, 0), type: WidthType.DXA },
  columnWidths,
  indent: { size: indent, type: WidthType.DXA },
  layout: TableLayoutType.FIXED,
  borders: NO_BORDERS,
  rows,
});

const sectionTitle = (title, meta = null) => paragraph([
  strong(title, { size: 24 }),
  ...(meta ? [muted(`  ${meta}`, { size: 18 })] : []),
], {
  keepNext: true,
  spacing: { before: 950, after: 155, line: 280 },
  border: { bottom: { color: COLOR.line, style: BorderStyle.SINGLE, size: 6, space: 10 } },
});

const iconRun = (symbol, { round = false } = {}) => text(` ${symbol} `, {
  size: 19,
  color: COLOR.icon,
  border: { color: COLOR.softLine, style: BorderStyle.SINGLE, size: round ? 0 : 4, space: 5 },
  shading: { fill: COLOR.iconBackground },
});

const metaRuns = (values, size = 19) => values.flatMap((value, index) => [
  ...(index ? [muted("  |  ", { size: 17, color: COLOR.light })] : []),
  text(value, { size }),
]);

const header = (data, phone) => {
  const contacts = [];
  if (phone) contacts.push(muted("☎  ", { size: 16, color: COLOR.light }), muted(phone, { size: 17 }));
  if (phone) contacts.push(muted("    ", { size: 17 }));
  contacts.push(muted("✉  ", { size: 16, color: COLOR.light }), link(data.contacts.email.value, data.contacts.email.url, { size: 17 }));

  return [
    paragraph([strong(data.candidate.name, { size: 36 })], {
      keepNext: true,
      spacing: { before: 55, after: 170, line: 390 },
    }),
    paragraph(contacts, { keepNext: true, spacing: { after: 300, line: 240 } }),
    paragraph([muted("Professional Summary", { size: 15, bold: true, characterSpacing: 20 })], {
      keepNext: true,
      spacing: { after: 55, line: 220 },
    }),
    paragraph([text(textOf(data.candidate.professionalSummary), { size: 20 })], {
      keepNext: true,
      spacing: { after: 260, line: 384 },
    }),
    paragraph([muted("핵심 근거", { size: 16, bold: true })], {
      keepNext: true,
      spacing: { after: 70, line: 230 },
    }),
    fixedTable(
      [3454, 3454, 3455],
      [new TableRow({
        cantSplit: true,
        children: data.candidate.evidenceHighlights.map((item, index) => tableCell({
          width: index === 2 ? 3455 : 3454,
          borders: {
            ...NO_BORDERS,
            top: { color: "DFE0E3", style: BorderStyle.SINGLE, size: 4 },
            bottom: { color: "DFE0E3", style: BorderStyle.SINGLE, size: 4 },
            ...(index ? { left: { color: "E6E7E9", style: BorderStyle.SINGLE, size: 4 } } : {}),
          },
          margins: { top: 170, right: 150, bottom: 175, left: index ? 170 : 0 },
          children: [
            paragraph([strong(item.title, { size: 18 })], { keepNext: true, spacing: { after: 55, line: 255 } }),
            paragraph([text(item.detail, { size: 17, color: COLOR.body })], { spacing: { after: 0, line: 300 } }),
          ],
        })),
      })],
    ),
  ];
};

const companyHeading = (entry) => fixedTable([ICON_WIDTH, ICON_GAP, BODY_WIDTH], [new TableRow({
  cantSplit: true,
  children: [
    tableCell({
      width: ICON_WIDTH,
      verticalAlign: VerticalAlign.TOP,
      children: [paragraph([iconRun("▦")], { spacing: { after: 0, line: 280 } })],
    }),
    tableCell({ width: ICON_GAP, children: [paragraph([text("")])] }),
    tableCell({
      width: BODY_WIDTH,
      borders: { ...NO_BORDERS, bottom: { color: COLOR.softLine, style: BorderStyle.SINGLE, size: 4, space: 8 } },
      margins: { bottom: 80 },
      children: [
        paragraph([strong(entry.company, { size: 22 })], { keepNext: true, spacing: { after: 45, line: 270 } }),
        paragraph(metaRuns([entry.period, entry.department, entry.role, entry.status]), { spacing: { after: 0, line: 280 } }),
      ],
    }),
  ],
})]);

const scopeParagraph = (label, value, options = {}) => paragraph([
  muted(`${label}  `, { size: 18, bold: true }),
  text(value, { size: 18, color: COLOR.body }),
], {
  indent: { left: ITEM_INDENT },
  spacing: { after: options.after ?? 45, line: 315 },
  ...options,
});

const projectBullet = (label, value, { mutedText = false, emphasis = false, keepNext = false } = {}) => paragraph([
  muted("-  ", { size: 18, color: COLOR.body }),
  ...(label ? [strong(`${label}  `, { size: 18, color: COLOR.text })] : []),
  text(value, { size: 18, bold: emphasis, color: mutedText ? COLOR.muted : COLOR.body }),
], {
  keepNext,
  indent: { left: ITEM_INDENT, hanging: 190 },
  spacing: { after: 40, line: 324 },
});

const projectBullets = (label, value, options = {}) => textsOf(value)
  .map((item, index) => projectBullet(index ? null : label, item, options));

const technologyBlock = (technologies, keepNext = true) =>
  projectBullet("기술스택", technologies.join(", "), { keepNext });

const renderCaseStudy = (study) => {
  const children = [
    paragraph([strong(study.title, { size: 20 })], {
      keepNext: true,
      indent: { left: ITEM_INDENT },
      spacing: { before: 330, after: 45, line: 288 },
    }),
  ];
  if (study.period) {
    children.push(paragraph([text(study.period, { size: 19 })], {
      keepNext: true,
      indent: { left: ITEM_INDENT },
      spacing: { after: 145, line: 260 },
    }));
  }

  children.push(
    paragraph([
      muted("배경  ", { size: 17, bold: true }),
      muted(textOf(study.problem), { size: 18, color: COLOR.body }),
    ], {
      keepNext: true,
      indent: { left: ITEM_INDENT },
      spacing: { after: 105, line: 315 },
    }),
    projectBullet("역할", textOf(study.role), { keepNext: true }),
    ...projectBullets("주요 성과", study.verification, { emphasis: true, keepNext: true }),
    ...projectBullets("핵심 구현", study.decision, { keepNext: true }),
    technologyBlock(study.technologies),
    projectBullet("한계", textOf(study.limitation), { mutedText: true }),
  );
  return children;
};

const renderExperience = (entry) => {
  const children = [
    companyHeading(entry),
    paragraph([text(textOf(entry.context), { size: 18, color: COLOR.body })], {
      indent: { left: ITEM_INDENT },
      spacing: { before: 170, after: 75, line: 310 },
    }),
    scopeParagraph("담당", textOf(entry.contribution)),
  ];
  if (entry.team) children.push(scopeParagraph("팀", textOf(entry.team)));
  children.push(...entry.caseStudies.flatMap(renderCaseStudy));
  if (entry.additionalContributions?.length) {
    children.push(paragraph([strong(`${entry.company} · 추가 기여`, { size: 19 })], {
      keepNext: true,
      indent: { left: ITEM_INDENT },
      spacing: { before: 280, after: 90, line: 270 },
    }));
    children.push(...entry.additionalContributions.map((item) => projectBullet(null, textOf(item))));
  }
  return [
    paragraph([text("")], { spacing: { before: 0, after: 240, line: 1 } }),
    ...children,
  ];
};

const renderSelectedProjects = (data) => {
  const children = [sectionTitle("프로젝트")];
  for (const project of data.selectedProjects) {
    children.push(
      paragraph([
        strong(project.title, { size: 20 }),
        text(`  ·  ${project.subtitle}`, { size: 19, color: COLOR.body }),
      ], {
        keepNext: true,
        indent: { left: ITEM_INDENT },
        spacing: { before: 340, after: 45, line: 288 },
      }),
      paragraph(metaRuns([project.period, project.type], 18), {
        keepNext: true,
        indent: { left: ITEM_INDENT },
        spacing: { after: 145, line: 260 },
      }),
      paragraph([
        muted("배경  ", { size: 17, bold: true }),
        muted(textOf(project.problem), { size: 18, color: COLOR.body }),
      ], {
        keepNext: true,
        indent: { left: ITEM_INDENT },
        spacing: { after: 105, line: 315 },
      }),
      projectBullet("역할", textOf(project.role), { keepNext: true }),
      ...projectBullets("주요 성과", project.verification, { emphasis: true, keepNext: true }),
      ...projectBullets("핵심 구현", project.decision, { keepNext: true }),
      technologyBlock(project.technologies),
      projectBullet("한계", textOf(project.limitation), { mutedText: true }),
      paragraph([link(project.url, project.url, { size: 17 })], {
        indent: { left: ITEM_INDENT },
        spacing: { before: 60, after: 65, line: 250 },
      }),
    );
  }
  return children;
};

const iconRow = ({ symbol, title, meta, detail = null, round = false }) => fixedTable(
  [ICON_WIDTH, ICON_GAP, BODY_WIDTH],
  [new TableRow({
    cantSplit: true,
    children: [
      tableCell({ width: ICON_WIDTH, children: [paragraph([iconRun(symbol, { round })], { spacing: { after: 0, line: 280 } })] }),
      tableCell({ width: ICON_GAP, children: [paragraph([text("")])] }),
      tableCell({
        width: BODY_WIDTH,
        children: [
          paragraph([strong(title, { size: 21 })], { keepNext: true, spacing: { after: 38, line: 270 } }),
          paragraph(metaRuns(meta, 19), { keepNext: Boolean(detail), spacing: { after: detail ? 78 : 0, line: 270 } }),
          ...(detail ? [paragraph([muted(detail, { size: 18 })], { spacing: { after: 0, line: 280 } })] : []),
        ],
      }),
    ],
  })],
);

const renderEducation = (data) => [
  sectionTitle("학력"),
  paragraph([text("")], { spacing: { after: 230, line: 1 } }),
  ...data.education.flatMap((item) => [
    iconRow({
      symbol: "◇",
      title: item.school,
      meta: [item.period, item.status, item.major, item.degree],
    }),
  ]),
];

const renderSkills = (data) => {
  const skills = [...new Set(data.skills.flatMap((group) => group.items))];
  const runs = skills.flatMap((skill, index) => [
    ...(index ? [text("  ", { size: 18 })] : []),
    text(` ${skill} `, {
      size: 18,
      border: { color: "DDDFE2", style: BorderStyle.SINGLE, size: 4, space: 5 },
      shading: { fill: COLOR.white },
    }),
  ]);
  return [
    sectionTitle("스킬"),
    paragraph(runs, { spacing: { before: 245, after: 30, line: 420 } }),
  ];
};

const renderCredentials = (data) => {
  const rows = [
    ...data.training.map((item) => ({ ...item, kind: "교육", date: item.period, symbol: "☆" })),
    ...data.certifications.map((item) => ({ ...item, kind: "자격증", date: item.acquiredAt, symbol: "▣" })),
  ];
  return [
    sectionTitle("수상/자격증/기타"),
    paragraph([text("")], { spacing: { after: 180, line: 1 } }),
    fixedTable(
      [3454, 3454, 3455],
      [new TableRow({
        cantSplit: true,
        children: rows.map((item, index) => tableCell({
          width: index === 2 ? 3455 : 3454,
          margins: { right: 160, left: index ? 130 : 0 },
          children: [
            paragraph([iconRun(item.symbol, { round: true }), text("  "), strong(item.title, { size: 19 })], {
              keepNext: true,
              spacing: { after: 55, line: 285 },
            }),
            paragraph(metaRuns([item.date, item.kind], 18), {
              keepNext: true,
              spacing: { after: 55, line: 270 },
            }),
            paragraph([muted(item.detail, { size: 17 })], { spacing: { after: 0, line: 270 } }),
          ],
        })),
      })],
    ),
  ];
};

const renderLinks = (data) => [
  sectionTitle("링크"),
  paragraph([text("")], { spacing: { after: 135, line: 1 } }),
  fixedTable(
    [3454, 3454, 3455],
    [new TableRow({
      cantSplit: true,
      children: ["blog", "github", "portfolio"].map((key, index) => {
        const item = data.contacts[key];
        return tableCell({
          width: index === 2 ? 3455 : 3454,
          margins: { right: 160, left: index ? 130 : 0 },
          children: [
            paragraph([text("↗  ", { size: 18 }), strong(item.label, { size: 19 })], {
              keepNext: true,
              spacing: { after: 48, line: 270 },
            }),
            paragraph([link(item.value, item.url, { size: 17 })], { spacing: { after: 0, line: 260 } }),
          ],
        });
      }),
    })],
  ),
];

const normalizeDocx = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer);
  const fixedDate = new Date("2026-08-25T00:00:00.000Z");
  for (const file of Object.values(zip.files)) file.date = fixedDate;

  const corePath = "docProps/core.xml";
  if (zip.file(corePath)) {
    const core = await zip.file(corePath).async("string");
    zip.file(corePath, core.replace(/<dcterms:(created|modified)[^>]*>[^<]*<\/dcterms:\1>/g, (match, kind) =>
      `<dcterms:${kind} xsi:type="dcterms:W3CDTF">2026-08-25T00:00:00Z</dcterms:${kind}>`), { date: fixedDate });
  }

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    platform: "DOS",
  });
};

export const renderDocx = async (data, phone = null) => {
  const children = [
    ...header(data, phone),
    sectionTitle("경력", data.candidate.experienceLabel),
    ...data.experiences.flatMap(renderExperience),
    ...renderSelectedProjects(data),
    ...renderEducation(data),
    ...renderSkills(data),
    ...renderCredentials(data),
    ...renderLinks(data),
  ];

  const document = new Document({
    creator: data.candidate.name,
    title: data.meta.title,
    subject: data.candidate.role,
    description: "첨부 이력서의 단일 열 정보 구조를 따른 근거 기반 백엔드 개발자 이력서",
    styles: {
      default: {
        document: {
          run: baseRun,
          paragraph: { spacing: { line: 324 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: 16838 },
          margin: { top: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, header: 0, footer: 0, gutter: 0 },
        },
      },
      children,
    }],
  });

  return normalizeDocx(await Packer.toBuffer(document));
};
