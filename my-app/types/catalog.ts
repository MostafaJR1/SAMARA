export type ProductColor = {
  id: string;
  name: string;
  hex: string;
  image: string;
  galleryImages?: string[];
};

export type ProductMedia = {
  type: "image" | "video";
  url: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  image: string;
  media?: ProductMedia[];
  price: number;
  oldPrice: number;
  discount: number;
  rating: number;
  badge: string;
  description: string;
  colors: ProductColor[];
  features: string[];
  stock: number;
  shipping: string;
  isFeatured: boolean;
  is_featured: boolean;
  is_coupon_eligible: boolean;
};

export type PackItem = {
  product: Product;
  quantity: number;
  productUrl: string | null;
};

export type PackColor = {
  id: string;
  name: string;
  hex: string;
  image: string;
};

export type Pack = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  price: number;
  originalPrice: number;
  isActive: boolean;
  items: PackItem[];
  colors?: PackColor[];
};