const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const textOf = (value) => typeof value === "string" ? value : value?.text;
const textsOf = (value) => (Array.isArray(value) ? value : [value]).map(textOf).filter(Boolean);
const externalLink = (label, url, className = "") =>
  `<a${className ? ` class="${className}"` : ""} href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;

const icon = (kind) => {
  const paths = {
    company: '<path d="M5 21V5.8A1.8 1.8 0 0 1 6.8 4h7.4A1.8 1.8 0 0 1 16 5.8V21M9 8h3M9 12h3M9 16h3M16 10h2.2A1.8 1.8 0 0 1 20 11.8V21M3 21h19"/>',
    education: '<path d="m3 8.5 9-5 9 5-9 5-9-5Zm3 2.2v5.1c2.7 2.3 9.3 2.3 12 0v-5.1M21 9v6"/>',
    award: '<circle cx="12" cy="9" r="5"/><path d="m8.5 13-1 8 4.5-2.4 4.5 2.4-1-8"/>',
    certificate: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M9 16h6M12 14v4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M7 3h3l1.5 5-2 1.5a15 15 0 0 0 5 5L16 12.5l5 1.5v3c0 2.2-1.8 4-4 4C9.3 21 3 14.7 3 7c0-2.2 1.8-4 4-4Z"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[kind]}</svg>`;
};

const sectionHeading = (title, meta = "") => `
  <header class="section-heading">
    <h2>${escapeHtml(title)}${meta ? `<span>${escapeHtml(meta)}</span>` : ""}</h2>
  </header>`;

const renderEvidenceHighlights = (items) => `
  <section class="evidence-highlights" aria-label="핵심 근거">
    <h2>핵심 근거</h2>
    <div class="evidence-grid">
      ${items.map((item) => `
        <article>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.detail)}</p>
        </article>`).join("")}
    </div>
  </section>`;

const renderHeader = (data, phone) => {
  const contacts = [];
  if (phone) contacts.push(`<span>${icon("phone")}${escapeHtml(phone)}</span>`);
  contacts.push(`<span>${icon("mail")}${externalLink(data.contacts.email.value, data.contacts.email.url)}</span>`);

  return `
    <header class="resume-header">
      <h1>${escapeHtml(data.candidate.name)}</h1>
      <div class="top-contacts">${contacts.join("")}</div>
      <p class="summary-label">Professional Summary</p>
      <p class="professional-summary">${escapeHtml(textOf(data.candidate.professionalSummary))}</p>
      ${renderEvidenceHighlights(data.candidate.evidenceHighlights)}
    </header>`;
};

const renderRow = (label, value, className = "") => `
  <li${className ? ` class="${className}"` : ""}>
    <span class="bullet-mark">-</span>
    <strong>${escapeHtml(label)}</strong>
    <span class="row-copy">${escapeHtml(value)}</span>
  </li>`;

const renderRows = (label, value, className = "") => textsOf(value)
  .map((item, index) => renderRow(index ? "" : label, item, `${className}${index ? " continuation" : ""}`.trim()))
  .join("");

const renderTechnology = (technologies) =>
  renderRow("기술스택", technologies.join(", "), "technology-block");

const renderCaseStudy = (study) => {
  return `
    <section class="project-block">
      <h4>${escapeHtml(study.title)}</h4>
      ${study.period ? `<p class="project-period">${escapeHtml(study.period)}</p>` : ""}
      <p class="case-context"><strong>배경</strong>${escapeHtml(textOf(study.problem))}</p>
      <ul class="project-highlights">
        ${renderRow("역할", textOf(study.role))}
        ${renderRows("주요 성과", study.verification, "result")}
        ${renderRows("핵심 구현", study.decision)}
        ${renderTechnology(study.technologies)}
        ${renderRow("한계", textOf(study.limitation), "limitation")}
      </ul>
    </section>`;
};

const renderExperience = (entry) => `
  <article class="experience">
    <header class="company-heading">
      <span class="entry-icon">${icon("company")}</span>
      <div class="company-copy">
        <h3>${escapeHtml(entry.company)}</h3>
        <p>${escapeHtml(entry.period)}<i>|</i>${escapeHtml(entry.department)}<i>|</i>${escapeHtml(entry.role)}<i>|</i>${escapeHtml(entry.status)}</p>
      </div>
    </header>
    <div class="company-details">
      <p class="company-context">${escapeHtml(textOf(entry.context))}</p>
      <dl class="scope-summary">
        <div><dt>담당</dt><dd>${escapeHtml(textOf(entry.contribution))}</dd></div>
        ${entry.team ? `<div><dt>팀</dt><dd>${escapeHtml(textOf(entry.team))}</dd></div>` : ""}
      </dl>
      ${(entry.caseStudies ?? []).map(renderCaseStudy).join("")}
      ${(entry.additionalContributions ?? []).length ? `
        <section class="additional-work">
          <h4>${escapeHtml(entry.company)} · 추가 기여</h4>
          <ul class="project-highlights">${entry.additionalContributions.map((item) => `<li><span class="bullet-mark">-</span>${escapeHtml(textOf(item))}</li>`).join("")}</ul>
        </section>` : ""}
    </div>
  </article>`;

const renderSelectedProject = (project) => `
  <article class="project-block selected-project">
    <h3>${escapeHtml(project.title)} <span>· ${escapeHtml(project.subtitle)}</span></h3>
    <p class="project-period">${escapeHtml(project.period)}<i>|</i>${escapeHtml(project.type)}</p>
    <p class="case-context"><strong>배경</strong>${escapeHtml(textOf(project.problem))}</p>
    <ul class="project-highlights">
      ${renderRow("역할", textOf(project.role))}
      ${renderRows("주요 성과", project.verification, "result")}
      ${renderRows("핵심 구현", project.decision)}
      ${renderTechnology(project.technologies)}
      ${renderRow("한계", textOf(project.limitation), "limitation")}
    </ul>
    ${externalLink(project.url, project.url, "project-link")}
  </article>`;

const renderEducation = (data) => `
  <section class="education-section">
  ${sectionHeading("학력")}
  <div class="section-content education-list">
    ${data.education.map((item) => `
      <article class="icon-row">
        <span class="entry-icon">${icon("education")}</span>
        <div>
          <h3>${escapeHtml(item.school)}</h3>
          <p>${escapeHtml(item.period)}<i>|</i>${escapeHtml(item.status)}<i>|</i>${escapeHtml(item.major)}<i>|</i>${escapeHtml(item.degree)}</p>
        </div>
      </article>`).join("")}
  </div>
  </section>`;

const renderSkills = (data) => {
  const skills = [...new Set(data.skills.flatMap((group) => group.items))];
  return `
    <section class="skills-section">
    ${sectionHeading("스킬")}
    <div class="section-content skill-list">${skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div>
    </section>`;
};

const renderCredentials = (data) => {
  const rows = [
    ...data.training.map((item) => ({ ...item, kind: "교육", date: item.period, icon: "award" })),
    ...data.certifications.map((item) => ({ ...item, kind: "자격증", date: item.acquiredAt, icon: "certificate" })),
  ];
  return `
    <section class="credentials-section">
    ${sectionHeading("수상/자격증/기타")}
    <div class="section-content credential-list">
      ${rows.map((item) => `
        <article class="icon-row credential-row">
          <span class="entry-icon round">${icon(item.icon)}</span>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="credential-meta">${escapeHtml(item.date)}<i>|</i>${escapeHtml(item.kind)}</p>
            <p class="credential-detail">${escapeHtml(item.detail)}</p>
          </div>
        </article>`).join("")}
    </div>
    </section>`;
};

const renderLinks = (data) => `
  <section class="links-section">
  ${sectionHeading("링크")}
  <div class="section-content link-list">
    ${["blog", "github", "portfolio"].map((key) => {
      const item = data.contacts[key];
      return `
        <article class="link-row">
          <span>${icon("link")}</span>
          <div><h3>${escapeHtml(item.label)}</h3>${externalLink(item.value, item.url)}</div>
        </article>`;
    }).join("")}
  </div>
  </section>`;

export const renderResumeHtml = (data, phone = null) => `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.meta.title)}</title>
  <style>
    @page { size: A4; margin: 13.6mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; color: #171719; font-family: "Noto Sans KR", "Malgun Gothic", Arial, sans-serif; }
    body { background: #eef0f2; font-size: 9pt; font-weight: 500; line-height: 1.75; letter-spacing: 0.006em; word-break: keep-all; overflow-wrap: break-word; }
    main { width: 210mm; margin: 0 auto; padding: 13.6mm; background: #fff; }
    h1, h2, h3, h4, p, ul, dl, dd { margin: 0; }
    a { color: inherit; text-decoration: none; }
    svg { display: block; width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
    p, li { orphans: 3; widows: 3; }

    .resume-header { padding-top: 1.2mm; }
    h1 { font-size: 18pt; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }
    .top-contacts { display: flex; flex-wrap: wrap; gap: 4.5mm; margin-top: 4.2mm; color: #7d7e82; font-size: 8.4pt; line-height: 1.4; }
    .top-contacts span { display: inline-flex; align-items: center; gap: 1.4mm; }
    .top-contacts svg { width: 3.4mm; height: 3.4mm; color: #a7a8ac; }
    .summary-label { margin-top: 9mm; color: #77787c; font-size: 7.7pt; font-weight: 700; letter-spacing: 0.06em; }
    .professional-summary { margin-top: 2.2mm; max-width: 100%; font-size: 10.2pt; font-weight: 500; line-height: 1.85; letter-spacing: 0; }
    .evidence-highlights { margin-top: 6.5mm; break-inside: avoid; }
    .evidence-highlights > h2 { margin-bottom: 2.2mm; color: #66676b; font-size: 8.6pt; line-height: 1.45; }
    .evidence-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 0.2mm solid #dfe0e3; border-bottom: 0.2mm solid #dfe0e3; }
    .evidence-grid article { min-width: 0; padding: 3.8mm 3.6mm 4mm 0; }
    .evidence-grid article + article { padding-left: 3.3mm; border-left: 0.2mm solid #e6e7e9; }
    .evidence-grid h3 { margin-bottom: 1.4mm; font-size: 9pt; line-height: 1.45; letter-spacing: 0; }
    .evidence-grid p { color: #55565a; font-size: 8.7pt; line-height: 1.65; }

    .section-heading { margin-top: 18mm; padding-bottom: 3.2mm; border-bottom: 0.28mm solid #171719; break-after: avoid; }
    .section-heading h2 { display: flex; align-items: baseline; gap: 2.4mm; font-size: 12pt; line-height: 1.25; letter-spacing: -0.005em; }
    .section-heading h2 span { color: #8b8c90; font-size: 9pt; font-weight: 500; }
    .section-content { margin-top: 8.5mm; }

    .experience { margin-top: 10.5mm; }
    .company-heading, .icon-row { display: grid; grid-template-columns: 9.6mm minmax(0, 1fr); column-gap: 4mm; break-after: avoid; }
    .entry-icon { display: grid; place-items: center; width: 8.5mm; height: 8.5mm; padding: 1.8mm; border: 0.2mm solid #ebecef; border-radius: 2.2mm; background: #f7f7f8; color: #55565a; }
    .company-copy { padding-bottom: 4.2mm; border-bottom: 0.2mm solid #e8e8e9; }
    .company-copy h3, .icon-row h3 { margin-bottom: 1.2mm; font-size: 10.8pt; line-height: 1.4; letter-spacing: 0; }
    .company-copy p, .icon-row p { display: flex; flex-wrap: wrap; align-items: center; color: #2e2f33; font-size: 9.6pt; line-height: 1.5; }
    .company-copy i, .icon-row i, .selected-project .project-period i { display: inline-block; margin: 0 2.8mm; color: #d8d9dc; font-style: normal; }
    .company-details { margin-left: 13.6mm; }
    .company-context { margin-top: 5.5mm; color: #48494c; font-size: 9.1pt; line-height: 1.75; }
    .scope-summary { margin-top: 2.8mm; color: #48494c; font-size: 8.8pt; line-height: 1.7; }
    .scope-summary div { display: grid; grid-template-columns: 11mm minmax(0, 1fr); }
    .scope-summary dt { color: #77787c; font-weight: 700; }
    .scope-summary dd { margin: 0; }

    .project-block { margin-top: 8.5mm; }
    .project-block h4, .selected-project h3 { font-size: 10.4pt; font-weight: 700; line-height: 1.5; letter-spacing: 0; break-after: avoid; }
    .selected-project h3 span { color: #48494c; font-weight: 500; }
    .project-period { margin-top: 1.1mm; color: #2f3034; font-size: 9.6pt; line-height: 1.5; break-after: avoid; }
    .case-context { margin-top: 2.7mm; color: #66676b; font-size: 9pt; line-height: 1.65; break-inside: avoid; break-after: avoid; }
    .case-context strong { margin-right: 2mm; color: #77787c; font-size: 8.6pt; }
    .project-highlights { margin-top: 3mm; padding: 0; list-style: none; color: #48494c; font-size: 9pt; line-height: 1.68; }
    .project-highlights li { display: grid; grid-template-columns: 3.5mm 15mm minmax(0, 1fr); align-items: start; padding-left: 0; break-inside: avoid; }
    .project-highlights .bullet-mark { color: #68696d; }
    .project-highlights li + li { margin-top: 0.8mm; }
    .project-highlights strong { color: #2e2f33; font-size: 8.6pt; }
    .project-highlights .result .row-copy { color: #26272a; font-weight: 600; }
    .project-highlights .limitation { color: #68696d; }
    .technology-block { break-inside: avoid; }
    .technology-block .row-copy { color: #3f4044; }
    .additional-work { margin-top: 8.5mm; break-inside: avoid; }
    .additional-work h4 { font-size: 9.6pt; }
    .additional-work .project-highlights li { display: block; padding-left: 3.5mm; text-indent: -3.5mm; }
    .additional-work .bullet-mark { display: inline-block; width: 3.5mm; }

    .selected-projects { margin-left: 13.6mm; }
    .selected-project { margin-top: 9mm; }
    .selected-project .project-period { display: flex; align-items: center; }
    .project-link { display: inline-block; margin-top: 3mm; color: #85868a; font-size: 8.6pt; }

    .education-list .icon-row { break-inside: avoid; }
    .education-section .section-heading,
    .skills-section .section-heading,
    .credentials-section .section-heading { margin-top: 12mm; }
    .education-section .section-content,
    .skills-section .section-content,
    .credentials-section .section-content { margin-top: 6mm; }
    .icon-row > div { padding-top: 0.4mm; }
    .skill-list { display: flex; flex-wrap: wrap; gap: 2.2mm 2.5mm; }
    .skill-list span { display: inline-block; padding: 1.3mm 3mm; border: 0.2mm solid #dddfe2; border-radius: 2.8mm; background: #fff; font-size: 9pt; line-height: 1.25; }

    .credential-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4mm; }
    .credentials-section .section-heading { break-after: auto; }
    .credential-row { break-inside: avoid; break-after: auto; }
    .credential-row + .credential-row { margin-top: 0; }
    .entry-icon.round { border: 0; border-radius: 50%; }
    .credential-meta { color: #2f3034 !important; }
    .credential-detail { margin-top: 2.1mm !important; color: #67686c !important; font-size: 8.8pt !important; }

    .links-section .section-heading { margin-top: 12mm; }
    .links-section .section-content { margin-top: 4mm; }
    .link-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4mm; }
    .link-row { display: grid; grid-template-columns: 4.8mm minmax(0, 1fr); column-gap: 2.3mm; break-inside: avoid; }
    .link-row > span { width: 3.8mm; height: 3.8mm; margin-top: 0.3mm; color: #171719; }
    .link-row h3 { margin-bottom: 1.2mm; font-size: 9.6pt; line-height: 1.35; }
    .link-row a { color: #8b8c90; font-size: 8.4pt; }

    @media print {
      body { background: #fff; }
      main { width: auto; margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <main>
    ${renderHeader(data, phone)}
    ${sectionHeading("경력", data.candidate.experienceLabel)}
    ${data.experiences.map(renderExperience).join("")}
    ${sectionHeading("프로젝트")}
    <div class="selected-projects">${data.selectedProjects.map(renderSelectedProject).join("")}</div>
    ${renderEducation(data)}
    ${renderSkills(data)}
    ${renderCredentials(data)}
    ${renderLinks(data)}
  </main>
</body>
</html>`;
