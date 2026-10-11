"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Suspense, use } from "react";
import {
  DeleteButton,
  ImageUploader,
  PublishButton,
  RevertButton,
} from "@/components/admin";
import {
  type DocumentHandle,
  useDocument,
  useDocumentProjection,
  useDocuments,
  useEditDocument,
} from "@/components/admin/admin-sanity";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  COLORS,
  FABRICS,
  FITS,
  PATTERNS,
  SIZES,
} from "@/lib/constants/filters";

// Field editor components
function NameEditor(handle: DocumentHandle) {
  const { data: name } = useDocument({ ...handle, path: "name" });
  const editName = useEditDocument({ ...handle, path: "name" });

  return (
    <Input
      value={(name as string) ?? ""}
      onChange={(e) => editName(e.target.value)}
      placeholder="Garment name"
    />
  );
}

function SlugEditor(handle: DocumentHandle) {
  const { data: slug } = useDocument({ ...handle, path: "slug" });
  const editSlug = useEditDocument({ ...handle, path: "slug" });
  const slugValue = (slug as { current?: string })?.current ?? "";

  return (
    <Input
      value={slugValue}
      onChange={(e) => editSlug({ _type: "slug", current: e.target.value })}
      placeholder="garment-slug"
    />
  );
}

function DescriptionEditor(handle: DocumentHandle) {
  const { data: description } = useDocument({ ...handle, path: "description" });
  const editDescription = useEditDocument({ ...handle, path: "description" });

  return (
    <Textarea
      value={(description as string) ?? ""}
      onChange={(e) => editDescription(e.target.value)}
      placeholder="Garment description, styling notes, care instructions..."
      rows={4}
    />
  );
}

function PriceEditor(handle: DocumentHandle) {
  const { data: price } = useDocument({ ...handle, path: "price" });
  const editPrice = useEditDocument({ ...handle, path: "price" });

  return (
    <Input
      type="number"
      step="1"
      min="0"
      value={(price as number) ?? ""}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        editPrice(parseFloat(e.target.value) || 0)
      }
      placeholder="1499"
    />
  );
}

function StockEditor(handle: DocumentHandle) {
  const { data: stock } = useDocument({ ...handle, path: "stock" });
  const editStock = useEditDocument({ ...handle, path: "stock" });

  return (
    <Input
      type="number"
      min="0"
      value={(stock as number) ?? 0}
      onChange={(e) => editStock(parseInt(e.target.value, 10) || 0)}
      placeholder="0"
    />
  );
}

function FabricEditor(handle: DocumentHandle) {
  const { data: fabric } = useDocument({ ...handle, path: "fabric" });
  const editFabric = useEditDocument({ ...handle, path: "fabric" });

  return (
    <Select
      value={(fabric as string) ?? ""}
      onValueChange={(value) => editFabric(value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select fabric" />
      </SelectTrigger>
      <SelectContent>
        {FABRICS.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FitEditor(handle: DocumentHandle) {
  const { data: fit } = useDocument({ ...handle, path: "fit" });
  const editFit = useEditDocument({ ...handle, path: "fit" });

  return (
    <Select
      value={(fit as string) ?? ""}
      onValueChange={(value) => editFit(value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select fit" />
      </SelectTrigger>
      <SelectContent>
        {FITS.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PatternEditor(handle: DocumentHandle) {
  const { data: pattern } = useDocument({ ...handle, path: "pattern" });
  const editPattern = useEditDocument({ ...handle, path: "pattern" });

  return (
    <Select
      value={(pattern as string) ?? ""}
      onValueChange={(value) => editPattern(value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select pattern" />
      </SelectTrigger>
      <SelectContent>
        {PATTERNS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ColorEditor(handle: DocumentHandle) {
  const { data: colors } = useDocument({ ...handle, path: "colors" });
  const { data: legacyColor } = useDocument({ ...handle, path: "color" });
  const editColors = useEditDocument({ ...handle, path: "colors" });
  const selected = Array.isArray(colors)
    ? (colors as string[])
    : typeof legacyColor === "string"
      ? [legacyColor]
      : [];
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((entry) => {
        const active = selected.includes(entry.value);
        return (
          <button
            key={entry.value}
            type="button"
            aria-pressed={active}
            onClick={() =>
              editColors(
                active
                  ? selected.filter((value) => value !== entry.value)
                  : [...selected, entry.value],
              )
            }
            className={`border px-3 py-2 text-xs uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526556] focus-visible:ring-offset-2 ${active ? "border-[#35483d] bg-[#35483d] text-white" : "border-zinc-300 hover:border-[#35483d]"}`}
          >
            {entry.label}
          </button>
        );
      })}
    </div>
  );
}

function SizeEditor(handle: DocumentHandle) {
  const { data: sizes } = useDocument({ ...handle, path: "size" });
  const editSizes = useEditDocument({ ...handle, path: "size" });
  const selected = Array.isArray(sizes) ? (sizes as string[]) : [];
  return (
    <div className="flex flex-wrap gap-2">
      {SIZES.map((entry) => {
        const active = selected.includes(entry.value);
        return (
          <button
            key={entry.value}
            type="button"
            aria-pressed={active}
            onClick={() =>
              editSizes(
                active
                  ? selected.filter((value) => value !== entry.value)
                  : [...selected, entry.value],
              )
            }
            className={`h-10 min-w-11 border px-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526556] focus-visible:ring-offset-2 ${active ? "border-[#35483d] bg-[#35483d] text-white" : "border-zinc-300 hover:border-[#35483d]"}`}
          >
            {entry.label}
          </button>
        );
      })}
    </div>
  );
}

function CategoryOption({
  department,
  ...handle
}: DocumentHandle & { department?: string }) {
  const { data } = useDocumentProjection<{
    title?: string;
    departments?: string[];
  }>({
    ...handle,
    projection: "{ title, departments }",
  });
  const categoryDepartments = data?.departments ?? [];
  const isClothingCategory = categoryDepartments.some(
    (value) => value === "men",
  );
  const isInDepartment =
    !department || categoryDepartments.includes(department);

  if (!data?.title || !isClothingCategory || !isInDepartment) {
    return null;
  }

  return (
    <SelectItem value={handle.documentId}>
      {data?.title ?? "Category"}
    </SelectItem>
  );
}

function CategoryEditor(handle: DocumentHandle) {
  const { data: categories } = useDocuments({
    documentType: "category",
    orderings: [{ field: "title", direction: "asc" }],
    batchSize: 100,
  });
  const { data: category } = useDocument({ ...handle, path: "category" });
  const { data: gender } = useDocument({ ...handle, path: "gender" });
  const editCategory = useEditDocument({ ...handle, path: "category" });
  const selectedRef = (category as { _ref?: string } | null)?._ref ?? "";
  return (
    <Select
      value={selectedRef}
      onValueChange={(value) =>
        editCategory({ _type: "reference", _ref: value })
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {categories?.map((categoryHandle) => (
          <CategoryOption
            key={categoryHandle.documentId}
            {...categoryHandle}
            department={gender as string | undefined}
          />
        ))}
      </SelectContent>
    </Select>
  );
}

function FeaturedEditor(handle: DocumentHandle) {
  const { data: featured } = useDocument({ ...handle, path: "featured" });
  const editFeatured = useEditDocument({ ...handle, path: "featured" });

  return (
    <Switch
      checked={(featured as boolean) ?? false}
      onCheckedChange={(checked: boolean) => editFeatured(checked)}
    />
  );
}

interface ProductSlugProjection {
  slug: {
    current: string;
  } | null;
}

function ProductStoreLink(handle: DocumentHandle) {
  const { data } = useDocumentProjection<ProductSlugProjection>({
    ...handle,
    projection: `{ slug }`,
  });

  const slug = data?.slug?.current;

  if (!slug) return null;

  return (
    <Link
      href={`/products/${slug}`}
      target="_blank"
      className="flex items-center justify-center gap-1 text-xs uppercase tracking-wider text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      View on storefront
      <ExternalLink className="h-3.5 w-3.5" />
    </Link>
  );
}

function ProductDetailContent({ handle }: { handle: DocumentHandle }) {
  const { data: name } = useDocument({ ...handle, path: "name" });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-normal tracking-wide text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {(name as string) || "New Garment"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Edit garment details and apparel attributes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteButton handle={handle} />
          <Suspense fallback={null}>
            <RevertButton {...handle} />
          </Suspense>
          <Suspense fallback={null}>
            <PublishButton {...handle} />
          </Suspense>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <div className="border border-[#dedbd3] bg-[#faf9f6] p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Garment Name</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <NameEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <SlugEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Suspense fallback={<Skeleton className="h-24" />}>
                  <DescriptionEditor {...handle} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="border border-[#dedbd3] bg-[#faf9f6] p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Pricing & Inventory
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹ INR)</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <PriceEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Units in Stock</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <StockEditor {...handle} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Clothing Attributes */}
          <div className="border border-[#dedbd3] bg-[#faf9f6] p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Garment Attributes
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <CategoryEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label>Fabric</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <FabricEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label>Fit Style</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <FitEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label>Pattern</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <PatternEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Available Colors</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <ColorEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Available Sizes</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <SizeEditor {...handle} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="border border-[#dedbd3] bg-[#faf9f6] p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Merchandising
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Featured Garment
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Feature on homepage hero carousel and editorial collections
                  </p>
                </div>
                <Suspense fallback={<Skeleton className="h-6 w-11" />}>
                  <FeaturedEditor {...handle} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Garment Lookbook Images
            </h2>
            <ImageUploader {...handle} />
            <div className="mt-4">
              <Suspense fallback={null}>
                <ProductStoreLink {...handle} />
              </Suspense>
            </div>
          </div>

          {/* Studio Link */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Studio Management
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Set categories, sizes, and additional fashion attributes in Sanity
              Studio.
            </p>
            <Link
              href={`/studio/structure/product;${handle.documentId}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
            >
              Open in Sanity Studio
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-7 w-48 sm:h-8" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const handle: DocumentHandle = {
    documentId: id,
    documentType: "product",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/inventory"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Inventory
      </Link>

      {/* Product Detail */}
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent handle={handle} />
      </Suspense>
    </div>
  );
}
