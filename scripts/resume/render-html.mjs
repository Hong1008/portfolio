const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const textOf = (value) => typeof value === "string" ? value : value?.text;
const externalLink = (label, url) => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;

const sectionTitle = (title, kicker) => `
  <h2><span>${escapeHtml(title)}</span><small>${escapeHtml(kicker)}</small></h2>`;

const renderHeader = (data, phone, photo) => {
  const contacts = [
    externalLink(`Email ${data.contacts.email.value}`, data.contacts.email.url),
    externalLink(`GitHub ${data.contacts.github.value}`, data.contacts.github.url),
    externalLink(`Portfolio ${data.contacts.portfolio.value}`, data.contacts.portfolio.url),
  ];
  if (phone) contacts.push(`<span>Mobile ${escapeHtml(phone)}</span>`);

  return `
    <table class="layout-table header-table">
      <tbody><tr>
        <td class="identity">
          <h1>${escapeHtml(data.candidate.name)}</h1>
          <p class="role-line"><strong>${escapeHtml(data.candidate.role)}</strong><span>${escapeHtml(data.candidate.experienceLabel)}</span></p>
          <p class="education-summary">${escapeHtml(textOf(data.candidate.educationSummary))}</p>
          <div class="contacts">${contacts.join("<i>|</i>")}</div>
        </td>
        ${photo ? `<td class="photo-cell"><img class="portrait" src="${photo.dataUri}" alt="${escapeHtml(photo.alt)}" /></td>` : '<td class="photo-cell"></td>'}
      </tr></tbody>
    </table>`;
};

const renderProfile = (data) => `
  ${sectionTitle("프로필", "Profile")}
  <div class="profile-copy">
    <p class="headline">${escapeHtml(data.candidate.headline)}</p>
    ${data.candidate.summary.map((item) => `<p>${escapeHtml(textOf(item))}</p>`).join("")}
  </div>`;

const renderSkills = (data) => `
  ${sectionTitle("핵심 기술", "Skills")}
  <table class="layout-table label-table skills-table">
    <tbody>${data.skills.map((skill) => `
      <tr><th>${escapeHtml(skill.label)}</th><td>${escapeHtml(skill.items.join(" · "))}</td></tr>`).join("")}
    </tbody>
  </table>`;

const renderCaseStudy = (study) => `
  <section class="case-study">
    <h4>${escapeHtml(study.title)}</h4>
    <table class="layout-table case-table"><tbody>
      <tr><th>문제·제약</th><td>${escapeHtml(textOf(study.problem))}</td></tr>
      <tr><th>판단·구현</th><td>${escapeHtml(textOf(study.decision))}</td></tr>
      <tr><th>검증·결과</th><td>${escapeHtml(textOf(study.verification))}</td></tr>
      <tr><th>책임·한계</th><td>${escapeHtml(textOf(study.limitation))}</td></tr>
    </tbody></table>
  </section>`;

const renderExperience = (entry) => `
  <article class="experience${entry.presentation === "compact" ? " compact" : ""}">
    <table class="layout-table entry-heading">
      <tbody><tr>
        <td><h3>${escapeHtml(entry.company)} · ${escapeHtml(entry.department)}</h3></td>
        <td class="period">${escapeHtml(entry.period)}</td>
      </tr></tbody>
    </table>
    <p class="entry-role"><strong>${escapeHtml(entry.role)}</strong><span> · ${escapeHtml(entry.status)}</span></p>
    ${entry.team ? `<table class="layout-table label-table experience-meta"><tbody><tr><th>팀</th><td>${escapeHtml(textOf(entry.team))}</td></tr></tbody></table>` : ""}
    <p class="context">${escapeHtml(textOf(entry.context))}</p>
    <table class="layout-table label-table experience-meta"><tbody><tr><th>기여</th><td>${escapeHtml(textOf(entry.contribution))}</td></tr></tbody></table>
    ${(entry.caseStudies ?? []).map(renderCaseStudy).join("")}
    ${(entry.highlights ?? []).length ? `<ul class="highlights">${entry.highlights.map((item) => `<li>${escapeHtml(textOf(item))}</li>`).join("")}</ul>` : ""}
    ${(entry.additionalContributions ?? []).map((item) => `
      <table class="layout-table label-table additional"><tbody><tr><th>추가 기여</th><td>${escapeHtml(textOf(item))}</td></tr></tbody></table>`).join("")}
    <table class="layout-table label-table technologies"><tbody><tr><th>기술</th><td>${escapeHtml(entry.technologies.join(" · "))}</td></tr></tbody></table>
  </article>`;

const renderProjects = (data) => `
  ${sectionTitle("프로젝트", "Selected Projects")}
  <div class="projects">
    ${data.selectedProjects.map((project) => `
      <article>
        <table class="layout-table entry-heading project-heading"><tbody><tr>
          <td><h3>${escapeHtml(project.title)} · ${escapeHtml(project.subtitle)}</h3></td>
          <td class="period">${escapeHtml(project.period)} · ${escapeHtml(project.type)}</td>
        </tr></tbody></table>
        <ul>${project.highlights.map((highlight) => `<li>${escapeHtml(textOf(highlight))}</li>`).join("")}</ul>
        ${externalLink(project.url, project.url)}
      </article>`).join("")}
  </div>`;

const renderTrainingAndCertifications = (data) => `
  ${sectionTitle("교육 · 자격", "Training & Certification")}
  <table class="layout-table final-details">
    <tbody>
      ${data.training.map((item) => `
        <tr><th><span>교육</span>${escapeHtml(item.title)} · ${escapeHtml(item.detail)}</th><td>${escapeHtml(item.period)}</td></tr>`).join("")}
      ${data.certifications.map((item) => `
        <tr><th><span>자격</span>${escapeHtml(item.title)} · ${escapeHtml(item.detail)}</th><td>${escapeHtml(item.acquiredAt)}</td></tr>`).join("")}
    </tbody>
  </table>`;

export const renderResumeHtml = (data, phone = null, photo = null) => `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.meta.title)}</title>
  <style>
    @page { size: A4; margin: 16mm 17mm 17mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; color: #202322; font-family: Arial, "Noto Sans KR", "NanumGothic", sans-serif; }
    body { background: #e5e7e6; font-size: 9.8pt; line-height: 1.58; }
    main { width: 210mm; margin: 0 auto; padding: 16mm 17mm 17mm; background: #fff; }
    h1, h2, h3, h4, p, ul { margin-top: 0; }
    a { color: #4f5753; text-decoration: none; }
    p, ul { orphans: 3; widows: 3; }
    .layout-table { width: 100%; border: 0; border-collapse: collapse; table-layout: fixed; }
    .layout-table td, .layout-table th { padding: 0; border: 0; vertical-align: top; }
    .header-table { margin-bottom: 8mm; break-inside: avoid; }
    .identity { padding-right: 9mm !important; }
    .photo-cell { width: 30mm; text-align: right; }
    .portrait { display: inline-block; width: 30mm; height: 40mm; border: 0.25mm solid #d9dddb; border-radius: 1.5mm; object-fit: cover; }
    h1 { margin-bottom: 3mm; font-size: 25pt; line-height: 1; letter-spacing: -0.035em; }
    .role-line { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2.5mm; margin-bottom: 1.8mm; }
    .role-line strong { font-size: 11pt; }
    .role-line span { color: #656b68; font-size: 8.8pt; }
    .education-summary { margin-bottom: 2mm; font-size: 9pt; font-weight: 700; }
    .contacts { display: flex; flex-wrap: wrap; gap: 1.6mm; color: #747a77; font-size: 7.7pt; line-height: 1.55; }
    .contacts i { color: #c0c4c2; font-style: normal; }
    h2 { display: flex; align-items: baseline; gap: 2mm; margin: 9mm 0 4.2mm; padding-bottom: 2.1mm; border-bottom: 0.35mm solid #777d7a; color: #202322; font-size: 13.5pt; line-height: 1.2; break-after: avoid; }
    h2 small { color: #8a8f8d; font-size: 7.8pt; font-weight: 500; letter-spacing: 0.02em; }
    .profile-copy { max-width: 164mm; }
    .profile-copy p { margin-bottom: 1.8mm; font-size: 9.6pt; }
    .profile-copy .headline { margin-bottom: 2.2mm; font-size: 10.4pt; font-weight: 700; }
    .label-table th { width: 27mm; padding-right: 4mm; color: #555b58; font-size: 8.6pt; font-weight: 700; text-align: left; }
    .label-table td { font-size: 9.2pt; }
    .skills-table tr { break-inside: avoid; }
    .skills-table th { width: 35mm; }
    .skills-table th, .skills-table td { padding-bottom: 1.8mm; }
    .experience { margin-bottom: 10mm; }
    .entry-heading { margin-bottom: 0; break-inside: avoid; break-after: avoid; }
    .entry-heading td { padding-bottom: 1mm; }
    .entry-heading td:first-child { padding-right: 5mm; }
    .entry-heading .period { width: 43mm; color: #5f6562; font-size: 8.7pt; font-weight: 600; text-align: right; white-space: nowrap; }
    .entry-heading h3 { margin-bottom: 1mm; font-size: 11.5pt; line-height: 1.35; }
    .entry-role { margin-bottom: 3.8mm; padding-bottom: 3mm; border-bottom: 0.2mm solid #d8dcda; color: #333735; font-size: 8.8pt; break-after: avoid; }
    .entry-role span { color: #757b78; }
    .context { margin-bottom: 2.8mm; font-size: 9.5pt; }
    .experience-meta { margin-bottom: 4.5mm; }
    .experience-meta th, .experience-meta td { padding-bottom: 1.5mm; }
    .case-study { margin: 5mm 0 6mm; }
    .case-study h4 { margin-bottom: 2.3mm; font-size: 10.5pt; line-height: 1.4; break-after: avoid; }
    .case-table tr { break-inside: avoid; }
    .case-table th { width: 24mm; padding: 0 3mm 1.8mm 0; color: #555b58; font-size: 8.7pt; font-weight: 700; text-align: left; }
    .case-table td { padding-bottom: 1.8mm; font-size: 9.2pt; line-height: 1.56; }
    .highlights { margin: 3mm 0 4mm; padding-left: 5mm; }
    .highlights li { margin-bottom: 1.6mm; font-size: 9.2pt; line-height: 1.55; }
    .additional { margin: 3.5mm 0; }
    .technologies { margin-top: 4.5mm; border-top: 0.2mm solid #d8dcda; break-inside: avoid; }
    .technologies th, .technologies td { padding-top: 2.5mm; color: #6a706d; font-size: 8.3pt; }
    .experience.compact { margin-bottom: 8mm; break-inside: avoid; page-break-inside: avoid; }
    .projects article { margin-bottom: 7mm; break-inside: avoid; }
    .project-heading { margin-bottom: 2.5mm; border-bottom: 0.2mm solid #d8dcda; }
    .project-heading td { padding-bottom: 2.5mm; }
    .project-heading .period { width: 55mm; white-space: normal; }
    .project-heading h3 { margin-bottom: 0; font-size: 10.4pt; }
    .projects ul { margin: 0 0 2.2mm; padding-left: 5mm; }
    .projects li { margin-bottom: 1.5mm; font-size: 9.2pt; line-height: 1.55; }
    .projects a { font-size: 8.2pt; }
    .final-details { break-inside: avoid; }
    .final-details tr { break-inside: avoid; }
    .final-details th, .final-details td { padding-bottom: 2.6mm; font-size: 9.2pt; }
    .final-details th { padding-right: 5mm; font-weight: 700; text-align: left; }
    .final-details th span { display: inline-block; min-width: 13mm; color: #707673; font-size: 8.3pt; }
    .final-details td { width: 34mm; color: #666c69; text-align: right; white-space: nowrap; }
    @media print {
      body { background: white; }
      main { width: auto; margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <main>
    ${renderHeader(data, phone, photo)}
    ${renderProfile(data)}
    ${renderSkills(data)}
    ${sectionTitle("경력", "Professional Experience")}
    ${data.experiences.map(renderExperience).join("")}
    ${renderProjects(data)}
    ${renderTrainingAndCertifications(data)}
  </main>
</body>
</html>`;
