import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { ProductGallery } from "@/components/app/ProductGallery";
import { ProductInfo } from "@/components/app/ProductInfo";
import { TrustValues } from "@/components/app/TrustValues";
import { PRODUCT_BY_SLUG_QUERY } from "@/lib/sanity/queries/products";
import { sanityFetch } from "@/sanity/lib/live";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Resolve each slug against published Sanity content at request time. This
  // prevents a previously cached notFound() result from surviving a publish.
  await connection();
  const { slug } = await params;

  const { data: product } = await sanityFetch({
    query: PRODUCT_BY_SLUG_QUERY,
    params: { slug },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef]">
      <div className="mx-auto max-w-[1320px] px-0 py-0 sm:px-8 lg:px-12 lg:py-6">
        <nav
          aria-label="Product category"
          className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 px-5 pt-4 text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500 sm:px-0 lg:hidden"
        >
          {product.gender && (
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {product.gender}
            </span>
          )}
          {product.gender && product.category && <span aria-hidden="true">/</span>}
          {product.category && (
            <Link
              href={`/?category=${product.category.slug}`}
              className="min-w-0 break-words hover:text-zinc-950 dark:hover:text-white [overflow-wrap:anywhere]"
            >
              {product.category.title}
            </Link>
          )}
        </nav>
        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
          {/* Image Gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Product Info */}
          <div className="min-w-0 px-5 pb-8 sm:px-0">
            <ProductInfo product={product} />
          </div>
        </div>
      </div>
      <TrustValues />
    </div>
  );
}
