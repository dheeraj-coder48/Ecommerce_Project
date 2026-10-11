"use client";

import { ImagePlus, Loader2, Plus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  createDocument,
  createDocumentHandle,
  type DocumentHandle,
  deleteDocument,
  useApplyDocumentActions,
  useClient,
  useDocument,
  useDocuments,
  useEditDocument,
} from "@/components/admin/admin-sanity";
import { PublishButton } from "@/components/admin/PublishButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type BannerCardProps = {
  documentId: string;
  categories: DocumentHandle[];
  products: DocumentHandle[];
};
const storefrontCategorySlugs = [
  "kurtas",
  "kurta-sets",
  "sherwanis",
  "ethnic-wear",
  "nehru-jackets",
  "indo-western",
  "wedding-wear",
  "festive-wear",
  "ethnic-accessories",
];
function BannerCard({ documentId, categories, products }: BannerCardProps) {
  const handle: DocumentHandle = { documentId, documentType: "banner" };
  const { data: title } = useDocument({ ...handle, path: "title" });
  const { data: subtitle } = useDocument({ ...handle, path: "subtitle" });
  const { data: ctaText } = useDocument({ ...handle, path: "ctaText" });
  const { data: image } = useDocument({ ...handle, path: "image" });
  const { data: active } = useDocument({ ...handle, path: "active" });
  const { data: order } = useDocument({ ...handle, path: "displayOrder" });
  const { data: destinationType } = useDocument({
    ...handle,
    path: "destinationType",
  });
  const { data: department } = useDocument({ ...handle, path: "department" });
  const { data: category } = useDocument({ ...handle, path: "category" });
  const { data: product } = useDocument({ ...handle, path: "product" });
  const { data: customUrl } = useDocument({ ...handle, path: "customUrl" });
  const setTitle = useEditDocument({ ...handle, path: "title" });
  const setSubtitle = useEditDocument({ ...handle, path: "subtitle" });
  const setCtaText = useEditDocument({ ...handle, path: "ctaText" });
  const setOrder = useEditDocument({ ...handle, path: "displayOrder" });
  const setActive = useEditDocument({ ...handle, path: "active" });
  const setImage = useEditDocument({ ...handle, path: "image" });
  const setDestinationType = useEditDocument({
    ...handle,
    path: "destinationType",
  });
  const setCategory = useEditDocument({ ...handle, path: "category" });
  const setProduct = useEditDocument({ ...handle, path: "product" });
  const setCustomUrl = useEditDocument({ ...handle, path: "customUrl" });
  const client = useClient({ apiVersion: "2025-12-05" });
  const apply = useApplyDocumentActions();
  const [uploading, setUploading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const imageUrl = (image as { asset?: { url?: string } } | null)?.asset?.url;
  const edit = async (
    setter: (value: unknown) => Promise<boolean>,
    value: unknown,
  ) => {
    if (!(await setter(value))) {
      window.alert(
        "Banner changes could not be saved. The saved value has been restored.",
      );
    }
  };

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const asset = await client.assets.upload("image", file, {
        filename: file.name,
      });
      const saved = await setImage({
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      });
      if (!saved) {
        window.alert("Image uploaded, but the banner could not be updated.");
      } else {
        window.alert("Image uploaded and saved to this banner.");
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? `Image upload failed: ${error.message}`
          : "Image upload failed. Check the file and try again.",
      );
    } finally {
      setUploading(false);
    }
  }
  async function remove() {
    if (window.confirm("Delete this banner?")) {
      const result = await apply(deleteDocument(handle));
      await result.submitted();
    }
  }

  return (
    <article className="overflow-hidden border border-zinc-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 text-xs font-medium text-zinc-700">
              <span>Title</span>
              <Input
                value={String(title ?? "")}
                onChange={(e) => void edit(setTitle, e.target.value)}
                placeholder="Festive Collection"
              />
            </div>
            <div className="space-y-1.5 text-xs font-medium text-zinc-700">
              <span>Display order</span>
              <Input
                type="number"
                min={0}
                aria-label="Display order"
                value={Number(order ?? 1)}
                onChange={(e) => void edit(setOrder, Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5 text-xs font-medium text-zinc-700 sm:col-span-2">
              <span>Subtitle</span>
              <Input
                value={String(subtitle ?? "")}
                onChange={(e) => void edit(setSubtitle, e.target.value)}
                placeholder="Traditional styles for every occasion"
              />
            </div>
            <div className="space-y-1.5 text-xs font-medium text-zinc-700 sm:col-span-2">
              <span>Button text</span>
              <Input
                value={String(ctaText ?? "")}
                onChange={(e) => void edit(setCtaText, e.target.value)}
                placeholder="Shop the collection"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 text-xs font-medium text-zinc-700">
              <span>Destination type</span>
              <Select
                value={String(destinationType ?? "category")}
                onValueChange={(value) => void edit(setDestinationType, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="custom">Custom link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {destinationType !== "product" && destinationType !== "custom" && (
              <div className="space-y-1.5 text-xs font-medium text-zinc-700 sm:col-span-2">
                <span>Category</span>
                <Select
                  value={(category as { _ref?: string } | null)?._ref ?? ""}
                  onValueChange={(value) =>
                    void edit(setCategory, { _type: "reference", _ref: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((item) => (
                      <CategoryChoice
                        key={item.documentId}
                        handle={item}
                        department={String(department ?? "")}
                      />
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {destinationType === "product" && (
              <div className="space-y-2 sm:col-span-2">
                <div className="space-y-1.5 text-xs font-medium text-zinc-700">
                  <span>Select product</span>
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                  />
                </div>
                <Select
                  value={(product as { _ref?: string } | null)?._ref ?? ""}
                  onValueChange={(value) =>
                    void edit(setProduct, { _type: "reference", _ref: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {(products ?? []).map((item) => (
                      <ProductChoice
                        key={item.documentId}
                        handle={item}
                        search={productSearch}
                      />
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {destinationType === "custom" && (
              <div className="space-y-1.5 text-xs font-medium text-zinc-700 sm:col-span-2">
                <span>Custom URL</span>
                <Input
                  type="url"
                  value={String(customUrl ?? "")}
                  onChange={(e) => void edit(setCustomUrl, e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Switch
                aria-label="Active on homepage"
                checked={Boolean(active)}
                onCheckedChange={(value) => void edit(setActive, value)}
              />
              {active ? "Active on homepage" : "Inactive"}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PublishButton {...handle} size="sm" />
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 border px-3 text-sm">
                <Upload className="h-4 w-4" />
                {uploading
                  ? "Uploading..."
                  : imageUrl
                    ? "Change image"
                    : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
              </label>
              <Button
                variant="outline"
                size="icon"
                aria-label="Delete banner"
                onClick={remove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <aside className="border-t bg-zinc-50 p-4 lg:border-l lg:border-t-0">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">
            Preview
          </p>
          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-200 text-white">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt="Banner preview"
                fill
                sizes="320px"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
            <div className="absolute inset-x-4 bottom-4">
              <p className="font-serif text-2xl leading-tight">
                {String(title || "Banner title")}
              </p>
              <p className="mt-1 text-xs">
                {String(subtitle || "Banner subtitle")}
              </p>
              {Boolean(ctaText) && (
                <span className="mt-3 inline-block bg-white px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-zinc-900">
                  {String(ctaText)}
                </span>
              )}
            </div>
            {!imageUrl && (
              <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 text-sm text-zinc-600">
                <ImagePlus />
                Add banner image
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function CategoryChoice({
  handle,
  department,
}: {
  handle: DocumentHandle & {
    title?: string;
    departments?: string[];
    slug?: string;
  };
  department: string;
}) {
  if (
    !handle.title ||
    !storefrontCategorySlugs.includes(handle.slug ?? "") ||
    !handle.departments?.some(
      (value) => value === "men" && (!department || value === department),
    )
  )
    return null;
  return <SelectItem value={handle.documentId}>{handle.title}</SelectItem>;
}
function ProductChoice({
  handle,
  search,
}: {
  handle: DocumentHandle & {
    name?: string;
    _category?: { departments?: string[]; slug?: string } | null;
  };
  search: string;
}) {
  const isClothingProduct =
    handle._category?.departments?.includes("men") &&
    storefrontCategorySlugs.includes(handle._category?.slug ?? "");
  return handle.name &&
    isClothingProduct &&
    (!search || handle.name.toLowerCase().includes(search.toLowerCase())) ? (
    <SelectItem value={handle.documentId}>{handle.name}</SelectItem>
  ) : null;
}

export default function BannersPage() {
  const { data, isPending, error } = useDocuments({
    documentType: "banner",
    orderings: [{ field: "displayOrder", direction: "asc" }],
    batchSize: 100,
  });
  const { data: categories } = useDocuments({
    documentType: "category",
    orderings: [{ field: "title", direction: "asc" }],
    batchSize: 100,
  });
  const { data: products } = useDocuments({
    documentType: "product",
    orderings: [{ field: "name", direction: "asc" }],
    batchSize: 100,
  });
  const apply = useApplyDocumentActions();
  const [creating, setCreating] = useState(false);
  async function add() {
    setCreating(true);
    try {
      const handle = createDocumentHandle({
        documentId: crypto.randomUUID(),
        documentType: "banner",
      });
      const result = await apply(
        createDocument(handle, {
          active: true,
          displayOrder: (data?.length ?? 0) + 1,
          destinationType: "category",
        } as never),
      );
      await result.submitted();
    } catch {
      window.alert("Could not create banner.");
    } finally {
      setCreating(false);
    }
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-zinc-600">
            Storefront content
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Homepage banners</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Manage campaign images, destinations, visibility, and order.
          </p>
        </div>
        <Button
          onClick={add}
          disabled={creating}
          className="bg-zinc-950 text-white hover:bg-zinc-800"
        >
          {creating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Banner
        </Button>
      </header>
      {isPending ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          Loading banners...
        </p>
      ) : error ? (
        <p role="alert" className="py-12 text-center text-sm text-red-700">
          Banners could not be loaded: {error} Refresh to try again.
        </p>
      ) : data?.length ? (
        <div className="space-y-4">
          {data.map((doc) => (
            <BannerCard
              key={doc.documentId}
              documentId={doc.documentId}
              categories={categories ?? []}
              products={products ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="border border-dashed bg-white px-6 py-14 text-center">
          <ImagePlus className="mx-auto h-8 w-8 text-zinc-400" />
          <h2 className="mt-3 font-medium">No banners yet</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Upload a wide campaign image to feature it on the homepage.
          </p>
          <Button onClick={add} className="mt-5" variant="outline">
            Add your first banner
          </Button>
        </div>
      )}
    </div>
  );
}
