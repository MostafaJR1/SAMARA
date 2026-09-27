import { notFound } from "next/navigation";
import { PackDetails } from "@/components/PackDetails";
import { PacksData } from "@/data/Packs";
import { getPacksFromDatabase } from "@/lib/packs-server";
import { getProductsFromDatabase } from "@/lib/products-server";

export function generateStaticParams() {
  return PacksData.filter((pack) => pack.isActive).map((pack) => ({ slug: pack.slug }));
}

type PackPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PackPage({ params }: PackPageProps) {
  const { slug } = await params;
  const products = await getProductsFromDatabase();
  const pack = (await getPacksFromDatabase(products)).find((candidate) => candidate.slug === slug && candidate.isActive);
  if (!pack) notFound();

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <PackDetails pack={pack} />
    </div>
  );
}
