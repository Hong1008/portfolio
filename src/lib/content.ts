import { getCollection } from "astro:content";

export async function getPublicProjects() {
  const [projects, evidenceEntries] = await Promise.all([
    getCollection("projects"),
    getCollection("evidence"),
  ]);

  const projectsBySlug = new Map(
    projects.map((project) => [project.data.slug, project]),
  );
  const evidenceById = new Map(
    evidenceEntries.map((evidence) => [evidence.id, evidence]),
  );
  const evidenceSlugs = new Set<string>();

  for (const evidence of evidenceEntries) {
    if (!projectsBySlug.has(evidence.data.contentSlug)) {
      throw new Error(
        `Evidence "${evidence.id}" references missing project slug "${evidence.data.contentSlug}".`,
      );
    }

    if (evidenceSlugs.has(evidence.data.contentSlug)) {
      throw new Error(
        `Multiple evidence files reference project slug "${evidence.data.contentSlug}".`,
      );
    }

    evidenceSlugs.add(evidence.data.contentSlug);
  }

  const publicProjects = projects.filter(
    ({ data }) => data.visibility === "public",
  );

  for (const project of publicProjects) {
    const evidence = evidenceById.get(project.data.evidenceRef);

    if (!evidence) {
      throw new Error(
        `Public project "${project.data.slug}" references missing evidence "${project.data.evidenceRef}".`,
      );
    }

    if (evidence.data.contentSlug !== project.data.slug) {
      throw new Error(
        `Evidence "${evidence.id}" belongs to "${evidence.data.contentSlug}", not "${project.data.slug}".`,
      );
    }
  }

  return publicProjects;
}
