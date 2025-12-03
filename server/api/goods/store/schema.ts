import { z } from "zod";

export const createMaterialSchema = z.object({
  materialCode: z.string().min(1, "Material code is required"),
  materialName: z.string().min(1, "Material name is required"),
  spec: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  num: z.number().int().nonnegative(),
  threshold: z.number().int().nonnegative().default(0),
  type: z.string().optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial();

export const searchMaterialSchema = z.object({
  materialName: z.string().optional(),
  materialCode: z.string().optional(),
  type: z.string().optional(),
  supplier: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
});
