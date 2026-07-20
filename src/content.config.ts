import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const nullableUrl = z.string().url().nullable();

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/projects",
  }),

  schema: z.object({
    title: z.string(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),

    contentType: z.literal("project"),
    summary: z.string(),

    startDate: z.string().regex(/^\d{4}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
    datePrecision: z.enum(["month", "year"]),
    status: z.enum([
      "completed",
      "ongoing",
      "archived",
      "cancelled",
      "unpublished",
    ]),

    organization: z.object({
      name: z.string().nullable(),
      displayName: z.string().nullable(),
      url: nullableUrl,
    }),

    projectType: z.object({
      kind: z.enum([
        "company",
        "personal",
        "team",
        "education",
        "open-source",
        "article",
      ]),
      operationStatus: z.enum([
        "production",
        "pre-release",
        "prototype",
        "study",
        "not-applicable",
      ]),
    }),

    team: z.object({
      size: z.number().int().positive().nullable(),
      composition: z.array(
        z.object({
          role: z.string(),
          count: z.number().int().positive(),
        }),
      ),
      note: z.string().nullable(),
    }),

    role: z.object({
      title: z.string(),
      responsibilities: z.array(z.string()),
      contributionSummary: z.string(),
    }),

    technologies: z.object({
      primary: z.array(z.string()),
      secondary: z.array(z.string()),
    }),

    themes: z.array(z.string()),

    featured: z.boolean(),
    visibility: z.enum(["public", "private-draft"]),
    confidentialityNote: z.string().nullable(),

    links: z.object({
      repository: nullableUrl,
      demo: nullableUrl,
      retrospective: nullableUrl,
      article: nullableUrl,
      external: z.array(
        z.object({
          label: z.string(),
          url: z.string().url(),
        }),
      ),
    }),

    evidenceRef: z.string(),

    print: z.object({
      include: z.boolean(),
      priority: z.number().int().nullable(),
      detailLevel: z.enum(["summary", "standard", "detailed"]),
    }),
  }),
});

export const collections = {
  projects,
};