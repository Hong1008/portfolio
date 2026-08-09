import { getCollection } from "astro:content";

async function getValidatedContent() {
  const [projects, experience, evidenceEntries, relationEntries] = await Promise.all([
    getCollection("projects"),
    getCollection("experience"),
    getCollection("evidence"),
    getCollection("relations"),
  ]);

  const entries = [...projects, ...experience];
  const entriesBySlug = new Map<string, (typeof entries)[number]>();
  const evidenceById = new Map(
    evidenceEntries.map((evidence) => [evidence.id, evidence]),
  );
  const evidenceSlugs = new Set<string>();
  const featuredOrders = new Set<number>();

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

    const availableEvidenceIds = new Set([
      ...evidence.data.facts.filter((fact) => fact.public).map((fact) => fact.id),
      ...evidence.data.metrics.filter((metric) => metric.public).map((metric) => metric.id),
    ]);

    for (const evidenceId of entry.data.evidenceHighlights) {
      if (!availableEvidenceIds.has(evidenceId)) {
        throw new Error(
          `Content "${entry.data.slug}" highlights missing or private evidence "${evidenceId}".`,
        );
      }
    }

    if (entry.data.featured) {
      const order = entry.data.featuredOrder;
      if (order === null) {
        throw new Error(`Featured content "${entry.data.slug}" is missing featuredOrder.`);
      }
      if (featuredOrders.has(order)) {
        throw new Error(`Duplicate featuredOrder "${order}".`);
      }
      featuredOrders.add(order);
    }
  }

  const sortedFeaturedOrders = [...featuredOrders].sort((a, b) => a - b);
  for (const [index, order] of sortedFeaturedOrders.entries()) {
    const expected = index + 1;
    if (order !== expected) {
      throw new Error(
        `Featured order must be contiguous from 1; expected "${expected}", received "${order}".`,
      );
    }
  }

  const relations = relationEntries.flatMap((entry) => entry.data.relations);

  for (const relation of relations) {
    if (!entriesBySlug.has(relation.from) || !entriesBySlug.has(relation.to)) {
      throw new Error(
        `Relation "${relation.from}" → "${relation.to}" references missing content.`,
      );
    }
  }

  return { projects, experience, evidenceEntries, relations };
}

export async function getPublicProjects() {
  const { projects } = await getValidatedContent();
  return projects.filter(({ data }) => data.visibility === "public");
}

export async function getPublicExperience() {
  const { experience } = await getValidatedContent();
  return experience.filter(({ data }) => data.visibility === "public");
}

export async function getPublicEntries() {
  const { projects, experience } = await getValidatedContent();
  return [...experience, ...projects].filter(
    ({ data }) => data.visibility === "public",
  );
}

export async function getPortfolioContent() {
  const { projects, experience, evidenceEntries } = await getValidatedContent();
  return {
    projects: projects.filter(({ data }) => data.visibility === "public"),
    experience: experience.filter(({ data }) => data.visibility === "public"),
    evidence: evidenceEntries,
  };
}

export async function getEvidenceForEntry(evidenceRef: string, contentSlug: string) {
  const { evidenceEntries } = await getValidatedContent();
  const evidence = evidenceEntries.find((entry) => entry.id === evidenceRef);

  if (!evidence || evidence.data.contentSlug !== contentSlug) {
    throw new Error(`Missing evidence "${evidenceRef}" for content "${contentSlug}".`);
  }

  return evidence;
}

export async function getEntryNavigation(slug: string, contentType: "experience" | "project") {
  const { projects, experience, relations } = await getValidatedContent();
  const publicEntries = [...experience, ...projects].filter(
    ({ data }) => data.visibility === "public",
  );
  const entriesBySlug = new Map(publicEntries.map((entry) => [entry.data.slug, entry]));
  const related = relations.flatMap((relation) => {
    if (relation.from === slug) {
      const entry = entriesBySlug.get(relation.to);
      return entry ? [{ entry, label: relation.label }] : [];
    }
    if (relation.to === slug) {
      const entry = entriesBySlug.get(relation.from);
      return entry ? [{ entry, label: relation.label }] : [];
    }
    return [];
  });
  const collection = (contentType === "experience" ? experience : projects)
    .filter(({ data }) => data.visibility === "public")
    .sort((a, b) => b.data.startDate.localeCompare(a.data.startDate));
  const index = collection.findIndex(({ data }) => data.slug === slug);

  return {
    related,
    previous: index > 0 ? collection[index - 1] : null,
    next: index >= 0 && index < collection.length - 1 ? collection[index + 1] : null,
  };
}
