import { z } from "zod";

export const siteSettingsSchema = z.object({
  ownerName: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  subtitle: z.string().min(1, "Required"),
  heroImage: z.string().nullable().optional(),
  aboutHeading: z.string().min(1, "Required"),
  aboutBody: z.string().min(1, "Required"),
  infoItems: z.array(z.string()),
  location: z.string().min(1, "Required"),
  email: z.string().email(),
  phone: z.string().min(1, "Required"),
  linkedin: z.string().url(),
  archiveDateRange: z.string().min(1, "Required"),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  adminPassword: z
    .string()
    .refine((v) => !v || v.length >= 12, "Password must be at least 12 characters")
    .nullable()
    .optional(),
});

export const projectSchema = z.object({
  title: z.string().optional().default(""),
  client: z.string().optional().default(""),
  subtitle: z.string().optional().default(""),
  category: z.string().optional().default(""),
  role: z.string().optional().default(""),
  focus: z.string().optional().default(""),
  tools: z.string().optional().default(""),
  coverImage: z.string().nullable().optional().default(""),
  heroImage: z.string().nullable().optional().default(""),
  description: z.string().nullable().optional().default(""),
  outcomes: z.string().nullable().optional().default(""),
  highlightStats: z.array(z.object({
    label: z.string().optional().default(""),
    value: z.string().optional().default(""),
  })).optional().default([]),
  methodologySteps: z.array(z.object({
    title: z.string().optional().default(""),
    description: z.string().optional().default("")
  })).optional().default([]),
  galleryImages: z.array(z.string()).optional().default([]),
  plans: z.array(z.object({
    title: z.string().optional().default(""),
    url: z.string().optional().default(""),
  })).optional().default([]),
  sortOrder: z.coerce.number().optional().default(0),
  published: z.boolean().optional().default(true),
  startsOn: z.string().optional().default(""),
  endsOn: z.string().optional().default(""),
  phase: z.string().optional().default(""),
});

export const postSchema = z.object({
  title: z.string().min(1, "Required"),
  slug: z.string().min(1, "Required"),
  excerpt: z.string().nullable().optional(),
  content: z.string().min(1, "Required"),
  coverImage: z.string().nullable().optional(),
  published: z.boolean().optional()
});

export const skillSchema = z.object({
  name: z.string().min(1, "Required"),
  sortOrder: z.coerce.number().optional()
});
