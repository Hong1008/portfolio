const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const externalLink = (label, url) => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;

const sectionTitle = (title, kicker) => `
  <h2><span>${escapeHtml(title)}</span><small>${escapeHtml(kicker)}</small></h2>`;

const renderHeader = (data, phone) => {
  const contacts = [
    externalLink(`Email ${data.contacts.email.value}`, data.contacts.email.url),
    externalLink(`GitHub ${data.contacts.github.value}`, data.contacts.github.url),
    externalLink(`Portfolio ${data.contacts.portfolio.value}`, data.contacts.portfolio.url),
  ];
  if (phone) contacts.push(`<span>Mobile ${escapeHtml(phone)}</span>`);

  return `
    <header class="resume-header">
      <h1>${escapeHtml(data.candidate.name)}</h1>
      <div class="role-line"><strong>${escapeHtml(data.candidate.role)}</strong><b>${escapeHtml(data.candidate.experienceLabel)}</b></div>
      <div class="contacts">${contacts.join("<i>|</i>")}</div>
    </header>`;
};

const renderEducation = (data) => `
  ${sectionTitle("학력 · 교육 · 자격", "Education & Certification")}
  <div class="compact-list">
    ${data.education.map((item) => `
      <p><strong>${escapeHtml(item.label)} ${escapeHtml(item.title)} · ${escapeHtml(item.detail)}</strong><time>${escapeHtml(item.period)}</time></p>`).join("")}
    ${data.certifications.map((item) => `
      <p><strong>자격 ${escapeHtml(item.title)} · ${escapeHtml(item.detail)}</strong><time>${escapeHtml(item.acquiredAt)}</time></p>`).join("")}
  </div>`;

const renderProfile = (data) => `
  ${sectionTitle("프로필", "Profile")}
  <p class="headline">${escapeHtml(data.candidate.headline)}</p>
  ${data.candidate.summary.map((item) => `<p class="summary">${escapeHtml(item)}</p>`).join("")}`;

const renderSkills = (data) => `
  ${sectionTitle("핵심 기술", "Skills")}
  <div class="skills">
    ${data.skills.map((skill) => `<p><strong>${escapeHtml(skill.label)}</strong>${escapeHtml(skill.items.join(" · "))}</p>`).join("")}
  </div>`;

const renderCareerSummary = (data) => `
  ${sectionTitle("경력 요약", "Career Highlights")}
  <div class="career-summary">
    ${data.careerSummary.map((career) => `
      <article>
        <h3><span>${escapeHtml(career.company)} · ${escapeHtml(career.role)}</span><time>${escapeHtml(career.period)}</time></h3>
        <p>${escapeHtml(career.achievement)}</p>
      </article>`).join("")}
  </div>`;

const renderExperience = (entry) => `
  <article class="experience">
    <h3><span>${escapeHtml(entry.company)} · ${escapeHtml(entry.department)}</span><time>${escapeHtml(entry.period)}</time></h3>
    <p class="role"><strong>${escapeHtml(entry.role)}</strong><em>· ${escapeHtml(entry.status)}</em></p>
    <p>${escapeHtml(entry.context)}</p>
    <p class="contribution"><strong>기여</strong>${escapeHtml(entry.contribution)}</p>
    <ul>${entry.bullets.map((bullet) => `<li>${escapeHtml(bullet.text)}</li>`).join("")}</ul>
    <p class="technologies"><strong>기술</strong>${escapeHtml(entry.technologies.join(" · "))}</p>
  </article>`;

const renderProjects = (data) => `
  ${sectionTitle("프로젝트", "Selected Projects")}
  <div class="projects">
    ${data.projects.map((project) => `
      <article>
        <h3><span>${escapeHtml(project.title)} · ${escapeHtml(project.subtitle)}</span><time>${escapeHtml(project.period)} · ${escapeHtml(project.type)}</time></h3>
        <ul>${project.sentences.map((sentence) => `<li>${escapeHtml(sentence.text)}</li>`).join("")}</ul>
        ${externalLink(project.url, project.url)}
      </article>`).join("")}
  </div>`;

export const renderResumeHtml = (data, phone = null) => {
  const page2 = data.experiencePages.find((page) => page.page === 2);
  const page3 = data.experiencePages.find((page) => page.page === 3);

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.meta.title)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #dfe4e1; color: #17211d; font-family: Arial, "Noto Sans KR", "NanumGothic", sans-serif; }
    body { font-size: 10pt; line-height: 1.42; }
    .page { width: 210mm; height: 297mm; margin: 0 auto; padding: 14mm 16mm 12mm; overflow: hidden; background: white; break-after: page; }
    .page:last-child { break-after: auto; }
    h1, h2, h3, p, ul { margin-top: 0; }
    h1 { margin-bottom: 1.8mm; font-size: 25pt; line-height: 1; letter-spacing: -0.04em; }
    h2 { display: flex; align-items: baseline; gap: 2mm; margin: 3.5mm 0 2mm; padding-bottom: 1.2mm; border-bottom: 0.4mm solid #b7c6be; font-size: 13.5pt; color: #075f4e; }
    h2 small { color: #5e6761; font-size: 8pt; font-weight: 500; letter-spacing: 0.02em; }
    h3 { display: flex; justify-content: space-between; gap: 5mm; margin-bottom: 1.2mm; font-size: 11pt; line-height: 1.3; }
    h3 time { flex: none; color: #5e6761; font-size: 8.5pt; font-weight: 600; }
    a { color: #075f4e; text-decoration: none; }
    .resume-header { margin-bottom: 2.2mm; }
    .role-line { display: flex; justify-content: space-between; align-items: baseline; color: #075f4e; }
    .role-line strong { font-size: 12pt; }
    .role-line b { font-size: 9pt; }
    .contacts { display: flex; flex-wrap: wrap; gap: 1.6mm; margin-top: 2mm; font-size: 8pt; }
    .contacts i { color: #96a19b; font-style: normal; }
    .compact-list p { display: flex; justify-content: space-between; gap: 5mm; margin-bottom: 0.9mm; font-size: 8.8pt; }
    .compact-list time { flex: none; color: #5e6761; }
    .headline { margin-bottom: 1.1mm; font-weight: 700; font-size: 10pt; }
    .summary { margin-bottom: 0.8mm; font-size: 8.8pt; }
    .skills p { margin-bottom: 0.7mm; font-size: 8.5pt; }
    .skills strong, .contribution strong, .technologies strong { display: inline-block; min-width: 28mm; margin-right: 2mm; color: #075f4e; }
    .career-summary article { margin-bottom: 1.8mm; }
    .career-summary h3 { margin-bottom: 0.6mm; font-size: 9.7pt; }
    .career-summary p { margin: 0 0 0 2mm; font-size: 8.35pt; line-height: 1.35; }
    .experience { margin-bottom: 4mm; }
    .experience > p { margin-bottom: 1.3mm; font-size: 9pt; }
    .experience .role { margin-bottom: 1.5mm; color: #075f4e; }
    .experience .role em { margin-left: 1.5mm; color: #5e6761; font-size: 8.2pt; font-style: normal; }
    .experience ul, .projects ul { margin: 1.3mm 0 1.6mm; padding-left: 4.8mm; }
    .experience li, .projects li { margin-bottom: 1.3mm; padding-left: 0.5mm; font-size: 8.8pt; }
    .technologies { margin-top: 1.6mm !important; padding-top: 1.1mm; border-top: 0.25mm solid #d4ddd8; color: #5e6761; font-size: 8pt !important; }
    .projects { font-size: 8pt; }
    .projects article { margin-bottom: 2.2mm; }
    .projects h3 { font-size: 9pt; }
    .projects li { margin-bottom: 0.9mm; font-size: 8pt; }
    .projects a { font-size: 7.3pt; }
  </style>
</head>
<body>
  <main>
    <section class="page" data-page="1">
      ${renderHeader(data, phone)}
      ${renderEducation(data)}
      ${renderProfile(data)}
      ${renderSkills(data)}
      ${renderCareerSummary(data)}
    </section>
    <section class="page" data-page="2">
      ${sectionTitle("경력 상세", "Professional Experience")}
      ${page2.entries.map(renderExperience).join("")}
    </section>
    <section class="page" data-page="3">
      ${sectionTitle("경력 상세 · 계속", "Professional Experience")}
      ${page3.entries.map(renderExperience).join("")}
      ${renderProjects(data)}
    </section>
  </main>
</body>
</html>`;
};
