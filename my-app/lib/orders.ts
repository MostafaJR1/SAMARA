import { z } from "zod";

const productOrderItemSchema = z.object({
  type: z.literal("product"),
  productId: z.string().trim().min(1).max(120),
  productName: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1).max(100),
  unitPrice: z.number().int().nonnegative(),
});

const packOrderItemSchema = z.object({
  type: z.literal("pack"),
  packId: z.string().trim().min(1).max(120),
  packName: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1).max(100),
  unitPrice: z.number().int().nonnegative(),
  contents: z.array(z.object({
    productId: z.string().trim().min(1).max(120),
    quantity: z.number().int().min(1).max(100),
  })).min(1),
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().regex(/^\+?[0-9]{8,15}$/),
    city: z.string().trim().min(2).max(80),
  }),
  items: z.array(z.discriminatedUnion("type", [productOrderItemSchema, packOrderItemSchema])).min(1),
  coupon: z.string().trim().max(40).nullable(),
  subtotal: z.number().int().nonnegative(),
  discount: z.number().int().nonnegative(),
  shipping: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
