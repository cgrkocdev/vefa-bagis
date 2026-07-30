import { z } from "zod";

export function parseExcludedProjectNumbers(value: string) {
  const parts = value.split(",").map((item) => item.trim()).filter(Boolean);
  const invalid = parts.filter((item) => !/^[1-9]\d*$/.test(item));
  if (invalid.length) return { values: [], invalid };
  return { values: [...new Set(parts.map(Number))], invalid: [] };
}

export const posterSchema = z.object({
  name: z.string().trim().min(2).max(160),
  orientation: z.enum(["LANDSCAPE", "PORTRAIT"]),
  yearId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  typeId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  destinationCountryId: z.string().nullable().optional(),
  partnerId: z.string().nullable().optional(),
  destinationRegionId: z.string().nullable().optional(),
  firstProjectNumber: z.number().int().positive().nullable().optional(),
  lastProjectNumber: z.number().int().positive().nullable().optional(),
  excludedProjectNumbers: z.array(z.number().int().positive()).default([]),
  projectIds: z.array(z.string()).min(1),
  associationIds: z.array(z.string()).default([]),
  mainAssociationId: z.string().nullable().optional(),
  showEmptyShares: z.boolean().default(true),
  shareholderNameFormat: z.enum(["FULL", "INITIALS"]).default("FULL"),
  footerNote: z.string().max(500).nullable().optional(),
});

export const associationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  shortName: z.string().trim().min(1).max(60),
  logoDataUrl: z.string().max(2_800_000).nullable().optional(),
  logoAlt: z.string().max(160).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  website: z.string().max(200).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
}).superRefine((value, context) => {
  if (value.logoDataUrl && !/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(value.logoDataUrl)) {
    context.addIssue({ code: "custom", path: ["logoDataUrl"], message: "Logo PNG, JPG, WEBP veya SVG olmalıdır." });
  }
});
