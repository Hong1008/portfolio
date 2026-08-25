import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  PageBreak,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";
import JSZip from "jszip";

const COLOR = {
  text: "17211D",
  muted: "5E6761",
  accent: "075F4E",
  border: "B7C6BE",
  surface: "EEF3F0",
};

const baseRun = { font: "Malgun Gothic", size: 20, color: COLOR.text };
const text = (value, options = {}) => new TextRun({ text: value, ...baseRun, ...options });
const muted = (value, options = {}) => text(value, { color: COLOR.muted, ...options });
const strong = (value, options = {}) => text(value, { bold: true, ...options });

const sectionTitle = (title, kicker = null) => new Paragraph({
  spacing: { before: 120, after: 80 },
  border: { bottom: { color: COLOR.border, style: BorderStyle.SINGLE, size: 6, space: 5 } },
  children: [
    strong(title, { size: 26, color: COLOR.accent }),
    ...(kicker ? [muted(`  ${kicker}`, { size: 16 })] : []),
  ],
});

const compactParagraph = (children, options = {}) => new Paragraph({
  spacing: { after: 40, line: 230 },
  ...options,
  children,
});

const bulletParagraph = (value) => new Paragraph({
  bullet: { level: 0 },
  indent: { left: 260, hanging: 160 },
  spacing: { after: 46, line: 225 },
  children: [text(value, { size: 18 })],
});

const link = (label, url, options = {}) => new ExternalHyperlink({
  link: url,
  children: [text(label, { color: COLOR.accent, underline: {}, ...options })],
});

const rightTabParagraph = ({ left, right, leftOptions = {}, rightOptions = {}, after = 35 }) => new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: 10000 }],
  spacing: { after, line: 220 },
  children: [
    text(left, leftOptions),
    text("\t"),
    text(right, rightOptions),
  ],
});

const renderHeader = (data, phone) => {
  const contacts = [
    link(`Email ${data.contacts.email.value}`, data.contacts.email.url, { size: 16 }),
    muted("  |  ", { size: 16 }),
    link(`GitHub ${data.contacts.github.value}`, data.contacts.github.url, { size: 16 }),
    muted("  |  ", { size: 16 }),
    link(`Portfolio ${data.contacts.portfolio.value}`, data.contacts.portfolio.url, { size: 16 }),
  ];
  if (phone) contacts.push(muted("  |  ", { size: 16 }), text(`Mobile ${phone}`, { size: 16 }));

  return [
    new Paragraph({
      spacing: { after: 20 },
      children: [strong(data.candidate.name, { size: 42, color: COLOR.text })],
    }),
    rightTabParagraph({
      left: data.candidate.role,
      right: data.candidate.experienceLabel,
      leftOptions: { bold: true, size: 23, color: COLOR.accent },
      rightOptions: { bold: true, size: 18, color: COLOR.accent },
      after: 60,
    }),
    new Paragraph({ spacing: { after: 90, line: 215 }, children: contacts }),
  ];
};

const renderEducation = (data) => {
  const paragraphs = [sectionTitle("학력 · 교육 · 자격", "Education & Certification")];
  for (const item of data.education) {
    paragraphs.push(rightTabParagraph({
      left: `${item.label}  ${item.title}  ·  ${item.detail}`,
      right: item.period,
      leftOptions: { size: 17, bold: true },
      rightOptions: { size: 16, color: COLOR.muted },
      after: 28,
    }));
  }
  for (const item of data.certifications) {
    paragraphs.push(rightTabParagraph({
      left: `자격  ${item.title}  ·  ${item.detail}`,
      right: item.acquiredAt,
      leftOptions: { size: 17, bold: true },
      rightOptions: { size: 16, color: COLOR.muted },
      after: 28,
    }));
  }
  return paragraphs;
};

const renderProfile = (data) => [
  sectionTitle("프로필", "Profile"),
  compactParagraph([strong(data.candidate.headline, { size: 20 })], { spacing: { after: 45, line: 235 } }),
  ...data.candidate.summary.map((value) => compactParagraph([text(value, { size: 18 })], { spacing: { after: 34, line: 230 } })),
];

const renderSkills = (data) => [
  sectionTitle("핵심 기술", "Skills"),
  ...data.skills.map((skill) => compactParagraph([
    strong(`${skill.label}  `, { size: 17, color: COLOR.accent }),
    text(skill.items.join(" · "), { size: 17 }),
  ], { spacing: { after: 25, line: 210 } })),
];

const renderCareerSummary = (data) => {
  const paragraphs = [sectionTitle("경력 요약", "Career Highlights")];
  for (const career of data.careerSummary) {
    paragraphs.push(rightTabParagraph({
      left: `${career.company}  ·  ${career.role}`,
      right: career.period,
      leftOptions: { bold: true, size: 19 },
      rightOptions: { size: 16, color: COLOR.muted },
      after: 16,
    }));
    paragraphs.push(compactParagraph([text(career.achievement, { size: 17 })], {
      indent: { left: 120 },
      spacing: { after: 45, line: 210 },
    }));
  }
  return paragraphs;
};

const renderExperience = (entry) => {
  const paragraphs = [
    rightTabParagraph({
      left: `${entry.company}  ·  ${entry.department}`,
      right: entry.period,
      leftOptions: { bold: true, size: 25, color: COLOR.text },
      rightOptions: { bold: true, size: 17, color: COLOR.muted },
      after: 16,
    }),
    compactParagraph([
      strong(entry.role, { size: 18, color: COLOR.accent }),
      muted(`  ·  ${entry.status}`, { size: 16 }),
    ], { spacing: { after: 42, line: 210 } }),
    compactParagraph([text(entry.context, { size: 18 })], { spacing: { after: 35, line: 230 } }),
    compactParagraph([
      strong("기여  ", { size: 17, color: COLOR.accent }),
      text(entry.contribution, { size: 17 }),
    ], { spacing: { after: 42, line: 215 } }),
    ...entry.bullets.map((bullet) => bulletParagraph(bullet.text)),
    compactParagraph([
      strong("기술  ", { size: 16, color: COLOR.accent }),
      muted(entry.technologies.join(" · "), { size: 16 }),
    ], {
      border: { top: { color: COLOR.border, style: BorderStyle.SINGLE, size: 3, space: 4 } },
      spacing: { before: 30, after: 100, line: 205 },
    }),
  ];
  return paragraphs;
};

const renderProjects = (data) => {
  const paragraphs = [sectionTitle("프로젝트", "Selected Projects")];
  for (const project of data.projects) {
    paragraphs.push(rightTabParagraph({
      left: `${project.title}  ·  ${project.subtitle}`,
      right: `${project.period}  ·  ${project.type}`,
      leftOptions: { bold: true, size: 19 },
      rightOptions: { size: 15, color: COLOR.muted },
      after: 20,
    }));
    paragraphs.push(...project.sentences.map((sentence) => bulletParagraph(sentence.text)));
    paragraphs.push(new Paragraph({
      spacing: { after: 55 },
      children: [link(project.url, project.url, { size: 15 })],
    }));
  }
  return paragraphs;
};

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

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
  const page2 = data.experiencePages.find((page) => page.page === 2);
  const page3 = data.experiencePages.find((page) => page.page === 3);
  const children = [
    ...renderHeader(data, phone),
    ...renderEducation(data),
    ...renderProfile(data),
    ...renderSkills(data),
    ...renderCareerSummary(data),
    pageBreak(),
    sectionTitle("경력 상세", "Professional Experience"),
    ...page2.entries.flatMap(renderExperience),
    pageBreak(),
    sectionTitle("경력 상세 · 계속", "Professional Experience"),
    ...page3.entries.flatMap(renderExperience),
    ...renderProjects(data),
  ];

  const document = new Document({
    creator: "홍철민",
    title: data.meta.title,
    subject: "Java/Kotlin·Spring 백엔드 개발자 이력서",
    description: "근거 기반으로 생성한 3쪽 백엔드 개발자 이력서",
    styles: {
      default: {
        document: {
          run: baseRun,
          paragraph: { spacing: { line: 230 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 650, right: 800, bottom: 650, left: 800, header: 0, footer: 0, gutter: 0 },
        },
      },
      children,
    }],
  });

  return normalizeDocx(await Packer.toBuffer(document));
};
