import { z } from "zod";
import { DatasetVisibility } from "../entities/Dataset";

export const DatasetCreateDto = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(5000).optional().nullable(),
  visibility: z.nativeEnum(DatasetVisibility).optional(),
});

export type DatasetCreateInput = z.infer<typeof DatasetCreateDto>;

export const DatasetUpdateDto = z
  .object({
    name: z.string().min(3).max(255).optional(),
    description: z.string().max(5000).optional().nullable(),
    visibility: z.nativeEnum(DatasetVisibility).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Legalább egy mezőt módosítani kell",
  });

export type DatasetUpdateInput = z.infer<typeof DatasetUpdateDto>;

export const DatasetListQueryDto = z.object({
  visibility: z.nativeEnum(DatasetVisibility).optional(),
  search: z.string().max(255).optional(),
});

export type DatasetListQuery = z.infer<typeof DatasetListQueryDto>;

export const DatasetShareVisibilityDto = z.object({
  visibility: z.nativeEnum(DatasetVisibility).optional(),
});

export type DatasetShareVisibilityInput = z.infer<typeof DatasetShareVisibilityDto>;
