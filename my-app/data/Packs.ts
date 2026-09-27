import { ProductsData } from "@/data/Products";

export type Product = (typeof ProductsData)[number];

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

export const PacksData: Pack[] = [
  {
    id: "pack-001",
    slug: "baqat-al-raha",
    name: "باقة الراحة",
    description: "اختيارات متناسقة للراحة والأناقة، مجمعة لك في باقة واحدة.",
    image: ProductsData[0].image,
    price: 1249,
    originalPrice: ProductsData[0].price + ProductsData[1].price,
    isActive: true,
    items: [
      { product: ProductsData[0], quantity: 1, productUrl: null },
      { product: ProductsData[1], quantity: 1, productUrl: null },
    ],
    colors: [],
  },
  {
    id: "pack-002",
    slug: "baqat-al-omouma-wa-al-raha",
    name: "باقة راحة وحماية الطفل",
    description: "مزيج متكامل من الراحة والحماية لطفلك مع ناموسية أطفال وكنبة استرخاء مريحة للأم.",
    image: ProductsData[2].image,
    price: 949,
    originalPrice: ProductsData[0].price + ProductsData[2].price, // 899 + 179 = 1078
    isActive: true,
    items: [
      { product: ProductsData[0], quantity: 1, productUrl: null }, // كنبة قابلة للنفخ
      { product: ProductsData[2], quantity: 1, productUrl: null }, // ناموسية أطفال
    ],
    colors: [],
  },
];

export function getActivePackBySlug(slug: string) {
  return PacksData.find((pack) => pack.slug === slug && pack.isActive);
}

export function getPackStock(pack: Pack) {
  return Math.min(...pack.items.map((item) => Math.floor(item.product.stock / item.quantity)));
}

export function getPackSavings(pack: Pack) {
  return Math.max(0, pack.originalPrice - pack.price);
}
