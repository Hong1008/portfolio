import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  ImageRun,
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
  text: "202322",
  muted: "666C69",
  light: "8A8F8D",
  border: "777D7A",
  softBorder: "D8DCDA",
};

const PAGE_WIDTH = 11906;
const PAGE_MARGIN = 964;
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);
const PHOTO_WIDTH = 1701;
const PERIOD_WIDTH = 2438;
const PROJECT_PERIOD_WIDTH = 3118;
const LABEL_WIDTH = 1531;
const SKILL_LABEL_WIDTH = 1984;
const CASE_LABEL_WIDTH = 1361;

const NIL_BORDER = { color: "FFFFFF", style: BorderStyle.NIL, size: 0 };
const NO_BORDERS = {
  top: NIL_BORDER,
  bottom: NIL_BORDER,
  left: NIL_BORDER,
  right: NIL_BORDER,
  insideHorizontal: NIL_BORDER,
  insideVertical: NIL_BORDER,
};

const baseRun = { font: "Malgun Gothic", size: 20, color: COLOR.text };
const textOf = (value) => typeof value === "string" ? value : value?.text;
const text = (value, options = {}) => new TextRun({ text: value, ...baseRun, ...options });
const muted = (value, options = {}) => text(value, { color: COLOR.muted, ...options });
const strong = (value, options = {}) => text(value, { bold: true, ...options });

const paragraph = (children, options = {}) => new Paragraph({
  keepLines: true,
  widowControl: true,
  spacing: { after: 70, line: 280 },
  ...options,
  children,
});

const spacer = (after = 80) => new Paragraph({
  spacing: { after, line: 1 },
  children: [text("", { size: 2 })],
});

const sectionTitle = (title, kicker = null) => new Paragraph({
  keepNext: true,
  spacing: { before: 320, after: 150, line: 260 },
  border: { bottom: { color: COLOR.border, style: BorderStyle.SINGLE, size: 6, space: 9 } },
  children: [
    strong(title, { size: 27 }),
    ...(kicker ? [muted(`  ${kicker}`, { size: 16, color: COLOR.light })] : []),
  ],
});

const link = (label, url, options = {}) => new ExternalHyperlink({
  link: url,
  children: [text(label, { color: COLOR.muted, underline: {}, ...options })],
});

const bulletParagraph = (value, options = {}) => new Paragraph({
  keepLines: true,
  widowControl: true,
  bullet: { level: 0 },
  indent: { left: 300, hanging: 160 },
  spacing: { after: 72, line: 280 },
  ...options,
  children: [text(value, { size: 18 })],
});

const tableCell = ({ children, width, borders = NO_BORDERS, margins = {}, verticalAlign = VerticalAlign.TOP }) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  borders,
  margins: { top: 0, right: 0, bottom: 0, left: 0, ...margins },
  verticalAlign,
  children,
});

const fixedTable = (columnWidths, rows) => new Table({
  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
  columnWidths,
  layout: TableLayoutType.FIXED,
  borders: NO_BORDERS,
  rows,
});

const labelValueTable = (rows, {
  labelWidth = LABEL_WIDTH,
  fontSize = 18,
  labelColor = COLOR.muted,
  bottom = 55,
  topBorder = false,
} = {}) => fixedTable([labelWidth, CONTENT_WIDTH - labelWidth], rows.map(([label, value]) => {
  const borders = topBorder
    ? { ...NO_BORDERS, top: { color: COLOR.softBorder, style: BorderStyle.SINGLE, size: 3, space: 0 } }
    : NO_BORDERS;
  return new TableRow({
    cantSplit: true,
    children: [
      tableCell({
        width: labelWidth,
        borders,
        margins: { right: 170, bottom },
        children: [paragraph([strong(label, { size: fontSize, color: labelColor })], { spacing: { after: 0, line: 260 } })],
      }),
      tableCell({
        width: CONTENT_WIDTH - labelWidth,
        borders,
        margins: { bottom },
        children: [paragraph([text(value, { size: fontSize })], { spacing: { after: 0, line: 280 } })],
      }),
    ],
  });
}));

const entryHeadingTable = ({
  title,
  period,
  titleSize = 23,
  periodSize = 17,
  periodWidth = PERIOD_WIDTH,
  bottomBorder = false,
}) => {
  const cellBorders = bottomBorder
    ? { ...NO_BORDERS, bottom: { color: COLOR.softBorder, style: BorderStyle.SINGLE, size: 3, space: 0 } }
    : NO_BORDERS;
  return fixedTable([CONTENT_WIDTH - periodWidth, periodWidth], [new TableRow({
    cantSplit: true,
    children: [
      tableCell({
        width: CONTENT_WIDTH - periodWidth,
        borders: cellBorders,
        margins: { right: 240, bottom: bottomBorder ? 130 : 30 },
        children: [
          paragraph([strong(title, { size: titleSize })], { keepNext: true, spacing: { after: 0, line: 280 } }),
        ],
      }),
      tableCell({
        width: periodWidth,
        borders: cellBorders,
        margins: { bottom: bottomBorder ? 130 : 30 },
        children: [paragraph([muted(period, { size: periodSize, bold: true })], {
          alignment: AlignmentType.RIGHT,
          spacing: { after: 0, line: 260 },
        })],
      }),
    ],
  })]);
};

const renderHeader = (data, phone, photo) => {
  const contacts = [
    link(`Email ${data.contacts.email.value}`, data.contacts.email.url, { size: 15 }),
    muted("  |  ", { size: 15, color: COLOR.light }),
    link(`GitHub ${data.contacts.github.value}`, data.contacts.github.url, { size: 15 }),
    muted("  |  ", { size: 15, color: COLOR.light }),
    link(`Portfolio ${data.contacts.portfolio.value}`, data.contacts.portfolio.url, { size: 15 }),
  ];
  if (phone) contacts.push(muted("  |  ", { size: 15, color: COLOR.light }), text(`Mobile ${phone}`, { size: 15 }));

  const leftWidth = CONTENT_WIDTH - PHOTO_WIDTH;
  const photoChildren = photo ? [new ImageRun({
    type: photo.type,
    data: photo.buffer,
    transformation: { width: 113, height: 151 },
    altText: {
      name: "hong-chulmin-portrait",
      title: photo.alt,
      description: photo.alt,
    },
  })] : [text("")];

  return [
    fixedTable([leftWidth, PHOTO_WIDTH], [new TableRow({
      cantSplit: true,
      children: [
        tableCell({
          width: leftWidth,
          margins: { right: 400 },
          children: [
            paragraph([strong(data.candidate.name, { size: 46 })], { keepNext: true, spacing: { after: 105, line: 460 } }),
            paragraph([
              strong(data.candidate.role, { size: 22 }),
              muted(`  ${data.candidate.experienceLabel}`, { size: 17 }),
            ], { keepNext: true, spacing: { after: 48, line: 260 } }),
            paragraph([strong(textOf(data.candidate.educationSummary), { size: 18 })], { keepNext: true, spacing: { after: 55, line: 260 } }),
            paragraph(contacts, { spacing: { after: 0, line: 235 } }),
          ],
        }),
        tableCell({
          width: PHOTO_WIDTH,
          verticalAlign: VerticalAlign.TOP,
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: photoChildren })],
        }),
      ],
    })]),
    spacer(150),
  ];
};

const renderProfile = (data) => [
  sectionTitle("프로필", "Profile"),
  paragraph([strong(data.candidate.headline, { size: 20 })], { spacing: { after: 70, line: 285 } }),
  ...data.candidate.summary.map((value) => paragraph([text(textOf(value), { size: 19 })], { spacing: { after: 65, line: 290 } })),
];

const renderSkills = (data) => [
  sectionTitle("핵심 기술", "Skills"),
  labelValueTable(data.skills.map((skill) => [skill.label, skill.items.join(" · ")]), {
    labelWidth: SKILL_LABEL_WIDTH,
    bottom: 65,
  }),
];

const renderCaseStudy = (study) => [
  paragraph([strong(study.title, { size: 21 })], {
    keepNext: true,
    spacing: { before: 160, after: 95, line: 285 },
  }),
  labelValueTable([
    ["문제·제약", textOf(study.problem)],
    ["판단·구현", textOf(study.decision)],
    ["검증·결과", textOf(study.verification)],
    ["책임·한계", textOf(study.limitation)],
  ], { labelWidth: CASE_LABEL_WIDTH, fontSize: 18, bottom: 75 }),
  spacer(60),
];

const renderExperience = (entry) => {
  const children = [
    entryHeadingTable({
      title: `${entry.company}  ·  ${entry.department}`,
      period: entry.period,
    }),
    paragraph([
      strong(entry.role, { size: 18 }),
      muted(`  ·  ${entry.status}`, { size: 16 }),
    ], {
      keepNext: true,
      border: { bottom: { color: COLOR.softBorder, style: BorderStyle.SINGLE, size: 3, space: 8 } },
      spacing: { after: 125, line: 250 },
    }),
  ];

  if (entry.team) children.push(labelValueTable([["팀", textOf(entry.team)]], { bottom: 65 }));
  children.push(paragraph([text(textOf(entry.context), { size: 19 })], { spacing: { after: 90, line: 290 } }));
  children.push(labelValueTable([["기여", textOf(entry.contribution)]], { bottom: 65 }));
  children.push(...(entry.caseStudies ?? []).flatMap(renderCaseStudy));
  children.push(...(entry.highlights ?? []).map((item) => bulletParagraph(textOf(item))));
  children.push(...(entry.additionalContributions ?? []).flatMap((item) => [
    spacer(35),
    labelValueTable([["추가 기여", textOf(item)]], { bottom: 50 }),
  ]));
  children.push(
    spacer(45),
    labelValueTable([["기술", entry.technologies.join(" · ")]], {
      fontSize: 16,
      labelColor: COLOR.muted,
      bottom: 55,
      topBorder: true,
    }),
    spacer(entry.presentation === "compact" ? 125 : 180),
  );
  return children;
};

const renderProjects = (data) => {
  const children = [sectionTitle("프로젝트", "Selected Projects")];
  for (const project of data.selectedProjects) {
    children.push(entryHeadingTable({
      title: `${project.title}  ·  ${project.subtitle}`,
      period: `${project.period}  ·  ${project.type}`,
      titleSize: 20,
      periodSize: 15,
      periodWidth: PROJECT_PERIOD_WIDTH,
      bottomBorder: true,
    }));
    children.push(spacer(45));
    children.push(...project.highlights.map((highlight) => bulletParagraph(textOf(highlight), {
      spacing: { after: 66, line: 280 },
    })));
    children.push(paragraph([link(project.url, project.url, { size: 16 })], { spacing: { after: 145, line: 240 } }));
  }
  return children;
};

const renderTrainingAndCertifications = (data) => {
  const rows = [
    ...data.training.map((item) => ["교육", `${item.title}  ·  ${item.detail}`, item.period]),
    ...data.certifications.map((item) => ["자격", `${item.title}  ·  ${item.detail}`, item.acquiredAt]),
  ];
  const leftWidth = CONTENT_WIDTH - PERIOD_WIDTH;

  return [
    sectionTitle("교육 · 자격", "Training & Certification"),
    fixedTable([leftWidth, PERIOD_WIDTH], rows.map(([kind, label, period]) => new TableRow({
      cantSplit: true,
      children: [
        tableCell({
          width: leftWidth,
          margins: { right: 240, bottom: 90 },
          children: [paragraph([
            muted(`${kind}  `, { size: 16, bold: true }),
            strong(label, { size: 18 }),
          ], { spacing: { after: 0, line: 270 } })],
        }),
        tableCell({
          width: PERIOD_WIDTH,
          margins: { bottom: 90 },
          children: [paragraph([muted(period, { size: 17 })], {
            alignment: AlignmentType.RIGHT,
            spacing: { after: 0, line: 270 },
          })],
        }),
      ],
    }))),
  ];
};

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

export const renderDocx = async (data, phone = null, photo = null) => {
  const children = [
    ...renderHeader(data, phone, photo),
    ...renderProfile(data),
    ...renderSkills(data),
    sectionTitle("경력", "Professional Experience"),
    ...data.experiences.flatMap(renderExperience),
    ...renderProjects(data),
    ...renderTrainingAndCertifications(data),
  ];

  const document = new Document({
    creator: "홍철민",
    title: data.meta.title,
    subject: "Java/Kotlin·Spring 백엔드 개발자 이력서",
    description: "근거 기반으로 생성한 경력 중심 백엔드 개발자 이력서",
    styles: {
      default: {
        document: {
          run: baseRun,
          paragraph: { spacing: { line: 280 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: 16838 },
          margin: { top: 907, right: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, header: 0, footer: 0, gutter: 0 },
        },
      },
      children,
    }],
  });

  return normalizeDocx(await Packer.toBuffer(document));
};
