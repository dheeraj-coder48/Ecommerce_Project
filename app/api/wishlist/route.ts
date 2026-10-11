import { createHash } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { client, writeClient } from "@/sanity/lib/client";

const PRODUCT_FILTER = `
  _type == "product"
  && "men" in category->departments
  && category->slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]
  && gender == "men"
`;
const PRODUCT_PROJECTION = `{
  _id, name, "slug": slug.current, price,
  "images": images[0...4]{ _key, asset->{ _id, url } },
  "category": category->{ _id, title, "slug": slug.current },
  fabric,
  "colors": coalesce(colors, select(defined(color) => [color], [])),
  gender, size, fit, pattern, stock
}`;
const productIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._-]+$/, "Invalid product ID");
const requestSchema = z.object({ productId: productIdSchema });

function getWishlistId(userId: string) {
  const hash = createHash("sha256").update(userId).digest("hex");
  return `wishlist-${hash}`;
}

async function getUserId() {
  const { userId } = await auth();
  return userId;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json(
        { error: "Sign in to view your wishlist." },
        { status: 401 },
      );

    const wishlist = await client.fetch<{ products: unknown[] } | null>(
      `*[_type == "wishlist" && _id == $wishlistId][0]{
        "products": *[
          _id in ^.items[]._ref
          && ${PRODUCT_FILTER}
        ] ${PRODUCT_PROJECTION}
      }`,
      { wishlistId: getWishlistId(userId) },
    );
    // Keep malformed or unresolved references out of the client store. The
    // correlated query above normally excludes them; this enforces the API shape.
    const products = (wishlist?.products ?? []).filter(
      (product): product is { _id: string } =>
        typeof product === "object" &&
        product !== null &&
        "_id" in product &&
        typeof product._id === "string",
    );
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Wishlist load failed", error);
    return NextResponse.json(
      { error: "Your wishlist could not be loaded." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return updateWishlist(request, "add");
}

export async function DELETE(request: Request) {
  return updateWishlist(request, "remove");
}

async function updateWishlist(request: Request, operation: "add" | "remove") {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json(
        { error: "Sign in to manage your wishlist." },
        { status: 401 },
      );

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "A valid product is required." },
        { status: 400 },
      );
    }
    const { productId } = parsed.data;
    if (operation === "add") {
      const product = await client.fetch<{ _id: string } | null>(
        `*[${PRODUCT_FILTER} && _id == $productId][0]{ _id }`,
        { productId },
      );
      if (!product)
        return NextResponse.json(
          { error: "This product is no longer available." },
          { status: 404 },
        );
    }
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Wishlist storage is not configured." },
        { status: 503 },
      );
    }

    const wishlistId = getWishlistId(userId);
    await writeClient.createIfNotExists({
      _id: wishlistId,
      _type: "wishlist",
      clerkUserId: userId,
      items: [],
      updatedAt: new Date().toISOString(),
    });

    // Retry revision conflicts so simultaneous requests cannot overwrite another
    // tab's change. Setting a de-duplicated reference list makes adds idempotent.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await client.fetch<{
        _rev: string;
        items: Array<{ _key?: string; _ref: string }>;
      }>(
        `*[_type == "wishlist" && _id == $wishlistId][0]{ _rev, "items": items[]{ _key, "_ref": @->._id } }`,
        { wishlistId },
      );
      const refs = current?.items ?? [];
      const nextIds = [
        ...new Set(refs.map((item) => item._ref).filter(Boolean)),
      ];
      const updatedIds =
        operation === "add"
          ? [...new Set([...nextIds, productId])]
          : nextIds.filter((id) => id !== productId);
      const nextItems = updatedIds.map((id) => ({
        _key: createHash("sha1").update(id).digest("hex").slice(0, 12),
        _type: "reference" as const,
        _ref: id,
      }));

      try {
        await writeClient
          .patch(wishlistId)
          .ifRevisionId(current._rev)
          .set({ items: nextItems, updatedAt: new Date().toISOString() })
          .commit();
        return NextResponse.json({ success: true, productId });
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
    return NextResponse.json(
      { error: "Wishlist update could not be saved." },
      { status: 409 },
    );
  } catch (error) {
    console.error("Wishlist update failed", error);
    return NextResponse.json(
      { error: "Your wishlist could not be updated." },
      { status: 500 },
    );
  }
}
