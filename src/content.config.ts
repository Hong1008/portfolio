import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const nullableUrl = z.string().url().nullable();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const status = z.enum([
  "completed",
  "ongoing",
  "archived",
  "cancelled",
  "unpublished",
]);

const commonEntryFields = {
  title: z.string(),
  slug,
  summary: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  datePrecision: z.enum(["month", "year"]),
  status,
  organization: z.object({
    name: z.string().nullable(),
    displayName: z.string().nullable(),
    url: nullableUrl,
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
  caseSummary: z
    .object({
      problem: z.string().optional(),
      decision: z.string().optional(),
      role: z.string().optional(),
      verification: z.string().optional(),
      limitation: z.string().optional(),
    })
    .optional(),
  limitations: z.array(z.string()).optional(),
  print: z.object({
    include: z.boolean(),
    priority: z.number().int().nullable(),
    detailLevel: z.enum(["summary", "standard", "detailed"]),
  }),
};

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/projects",
  }),
  schema: z.object({
    ...commonEntryFields,
    contentType: z.literal("project"),
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
  }),
});

const experience = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/experience",
  }),
  schema: z.object({
    ...commonEntryFields,
    contentType: z.literal("experience"),
    employment: z.object({
      type: z.enum(["full-time", "contract", "internship"]),
      department: z.string(),
      position: z.string(),
    }),
    operationStatus: z.enum([
      "production",
      "pre-release",
      "internal",
      "discontinued",
    ]),
    cases: z.array(
      z.object({
        id: slug,
        title: z.string(),
        featured: z.boolean(),
      }),
    ),
  }),
});

const sourceReference = z.string().min(1).superRefine((value, context) => {
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return;
  }

  if (!z.string().url().safeParse(value).success) {
    context.addIssue({
      code: "custom",
      message: "HTTP source must be a valid URL",
    });
  }
});

const evidence = defineCollection({
  loader: glob({
    pattern: "**/*.{yaml,yml}",
    base: "./src/data/evidence",
  }),
  schema: z
    .object({
      contentSlug: slug,
      lastReviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      facts: z.array(
        z.object({
          id: z.string().min(1),
          statement: z.string().min(1),
          sourceType: z.enum([
            "user-confirmed",
            "repository",
            "code",
            "benchmark",
            "resume",
            "retrospective",
          ]),
          source: sourceReference,
          scope: z.string().min(1),
          public: z.boolean(),
          confidence: z.enum(["confirmed", "partial", "uncertain"]),
          note: z.string().nullable(),
        }),
      ),
      metrics: z.array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          value: z.number(),
          unit: z.string().min(1),
          baseline: z.number().nullable().optional(),
          scope: z.string().min(1),
          environment: z.string().min(1),
          source: sourceReference,
          public: z.boolean(),
        }),
      ),
      contribution: z.object({
        mine: z.array(z.string()),
        team: z.array(z.string()),
        external: z.array(z.string()),
      }),
      publication: z.object({
        allowed: z.array(z.string()),
        anonymize: z.array(z.string()),
        prohibited: z.array(z.string()),
      }),
      risks: z.array(
        z.object({
          claim: z.string().min(1),
          reason: z.string().min(1),
          safeWording: z.string().min(1),
        }),
      ),
    })
    .superRefine((data, context) => {
      const metricIds = new Set<string>();

      for (const [index, metric] of data.metrics.entries()) {
        if (metricIds.has(metric.id)) {
          context.addIssue({
            code: "custom",
            message: `Duplicate metric ID: ${metric.id}`,
            path: ["metrics", index, "id"],
          });
        }

        metricIds.add(metric.id);
      }
    }),
});

const relations = defineCollection({
  loader: glob({
    pattern: "**/*.{yaml,yml}",
    base: "./src/data/relations",
  }),
  schema: z.object({
    relations: z.array(
      z.object({
        from: slug,
        to: slug,
        type: z.enum([
          "generalized-into",
          "follows-from",
          "explained-by",
          "benchmarked-by",
          "same-principle",
          "related-learning",
          "predecessor",
          "successor",
        ]),
        label: z.string().min(1),
      }),
    ),
  }),
});

export const collections = {
  projects,
  experience,
  evidence,
  relations,
};
