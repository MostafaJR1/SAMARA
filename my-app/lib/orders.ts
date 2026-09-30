import { z } from "zod";

const productOrderItemSchema = z.object({
  type: z.literal("product"),
  productId: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(100),
});

const packOrderItemSchema = z.object({
  type: z.literal("pack"),
  packId: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(100),
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().regex(/^\+?[0-9]{8,15}$/),
    city: z.string().trim().min(2).max(80),
  }),
  items: z.array(z.discriminatedUnion("type", [productOrderItemSchema, packOrderItemSchema])).min(1),
  coupon: z.string().trim().max(40).nullable(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
