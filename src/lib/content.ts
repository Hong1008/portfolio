import { getCollection } from "astro:content";

async function getValidatedContent() {
  const [projects, experience, evidenceEntries] = await Promise.all([
    getCollection("projects"),
    getCollection("experience"),
    getCollection("evidence"),
  ]);

  const entries = [...projects, ...experience];
  const entriesBySlug = new Map<string, (typeof entries)[number]>();
  const evidenceById = new Map(
    evidenceEntries.map((evidence) => [evidence.id, evidence]),
  );
  const evidenceSlugs = new Set<string>();

  for (const entry of entries) {
    if (entriesBySlug.has(entry.data.slug)) {
      throw new Error(`Duplicate content slug "${entry.data.slug}".`);
    }

    entriesBySlug.set(entry.data.slug, entry);
  }

  for (const evidence of evidenceEntries) {
    if (!entriesBySlug.has(evidence.data.contentSlug)) {
      throw new Error(
        `Evidence "${evidence.id}" references missing content slug "${evidence.data.contentSlug}".`,
      );
    }

    if (evidenceSlugs.has(evidence.data.contentSlug)) {
      throw new Error(
        `Multiple evidence files reference content slug "${evidence.data.contentSlug}".`,
      );
    }

    evidenceSlugs.add(evidence.data.contentSlug);
  }

  for (const entry of entries.filter(
    ({ data }) => data.visibility === "public",
  )) {
    const evidence = evidenceById.get(entry.data.evidenceRef);

    if (!evidence) {
      throw new Error(
        `Public content "${entry.data.slug}" references missing evidence "${entry.data.evidenceRef}".`,
      );
    }

    if (evidence.data.contentSlug !== entry.data.slug) {
      throw new Error(
        `Evidence "${evidence.id}" belongs to "${evidence.data.contentSlug}", not "${entry.data.slug}".`,
      );
    }
  }

  return { projects, experience };
}

export async function getPublicProjects() {
  const { projects } = await getValidatedContent();
  return projects.filter(({ data }) => data.visibility === "public");
}

export async function getPublicExperience() {
  const { experience } = await getValidatedContent();
  return experience.filter(({ data }) => data.visibility === "public");
}
