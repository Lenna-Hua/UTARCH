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
  title: z.string().min(1, "Required"),
  client: z.string().min(1, "Required"),
  subtitle: z.string().min(1, "Required"),
  category: z.string().optional(),
  role: z.string().min(1, "Required"),
  focus: z.string().min(1, "Required"),
  tools: z.string().min(1, "Required"),
  coverImage: z.string().nullable().optional(),
  heroImage: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  outcomes: z.string().nullable().optional(),
  highlightStats: z.array(z.object({
    label: z.string().min(1, "Required"),
    value: z.string().min(1, "Required"),
  })).optional(),
  methodologySteps: z.array(z.object({
    title: z.string().min(1, "Required"),
    description: z.string().min(1, "Required")
  })).optional(),
  galleryImages: z.array(z.string()).optional(),
  plans: z.array(z.object({
    title: z.string().min(1, "Required"),
    url: z.string().min(1, "Required"),
  })).optional(),
  sortOrder: z.coerce.number().optional(),
  published: z.boolean().optional(),
  startsOn: z.string().optional(),
  endsOn: z.string().optional(),
  phase: z.string().optional(),
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
