"use client";

import { Loader2, Package, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import {
  AdminSearch,
  ProductRow,
  ProductRowSkeleton,
  ProductTableHeader,
  useProductSearchFilter,
} from "@/components/admin";
import {
  createDocument,
  createDocumentHandle,
  useApplyDocumentActions,
  useDocuments,
} from "@/components/admin/admin-sanity";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody } from "@/components/ui/table";

interface ProductListContentProps {
  filter?: string;
  onCreateProduct: () => void;
  isCreating: boolean;
}

function ProductListContent({
  filter,
  onCreateProduct,
  isCreating,
}: ProductListContentProps) {
  const {
    data: products,
    hasMore,
    loadMore,
    isPending,
    error,
  } = useDocuments({
    documentType: "product",
    filter,
    orderings: [
      { field: "stock", direction: "asc" },
      { field: "name", direction: "asc" },
    ],
    batchSize: 20,
  });

  if (isPending && !products) return <ProductListSkeleton />;

  if (error) {
    return (
      <p
        role="alert"
        className="border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        Could not load inventory: {error}
      </p>
    );
  }

  if (!products) return <ProductListSkeleton />;

  if (products && products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={filter ? "No products found" : "No products yet"}
        description={
          filter
            ? "Try adjusting your search terms."
            : "Get started by adding your first product."
        }
        action={
          !filter
            ? {
                label: "Add Product",
                onClick: onCreateProduct,
                disabled: isCreating,
                icon: isCreating ? Loader2 : Plus,
              }
            : undefined
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden border border-[#dedbd3] bg-[#faf9f6] dark:border-zinc-800 dark:bg-zinc-900">
        <Table>
          <ProductTableHeader />
          <TableBody>
            {products.map((handle) => (
              <ProductRow key={handle.documentId} {...handle} />
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => loadMore()}
            disabled={isPending}
          >
            {isPending ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </>
  );
}

function ProductListSkeleton() {
  return (
    <div className="overflow-hidden border border-[#dedbd3] bg-[#faf9f6] dark:border-zinc-800 dark:bg-zinc-900">
      <Table>
        <ProductTableHeader />
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <ProductRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InventoryContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const { filter, isSearching } = useProductSearchFilter(searchQuery);
  const apply = useApplyDocumentActions();

  const handleCreateProduct = () => {
    startTransition(async () => {
      const newDocHandle = createDocumentHandle({
        documentId: crypto.randomUUID(),
        documentType: "product",
      });
      try {
        const result = await apply(
          createDocument(newDocHandle, { gender: "men" } as never),
        );
        await result.submitted();
        router.push(`/admin/inventory/${newDocHandle.documentId}`);
      } catch (error) {
        console.error("Failed to create Sanity product draft", error);
      }
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-wide text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Manage your product stock and pricing
          </p>
        </div>
        <Button
          onClick={handleCreateProduct}
          disabled={isPending}
          className="w-full bg-[#35483d] text-white hover:bg-[#26372d] sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Product
        </Button>
      </div>

      {/* Search */}
      <AdminSearch
        placeholder="Search products..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="w-full sm:max-w-sm"
      />

      {/* Product List */}
      {isSearching ? (
        <ProductListSkeleton />
      ) : (
        <Suspense fallback={<ProductListSkeleton />}>
          <ProductListContent
            filter={filter}
            onCreateProduct={handleCreateProduct}
            isCreating={isPending}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return <InventoryContent />;
}
