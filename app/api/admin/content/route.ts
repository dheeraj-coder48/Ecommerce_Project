import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSanityClient } from "@/lib/sanity/admin-client";

export const runtime = "nodejs";
const MAX_ADMIN_IMAGE_BYTES = 4 * 1024 * 1024;

const docType = z.enum(["product", "category", "banner", "order"]);
const idSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[\w.-]+$/);
const views = z.enum([
  "raw",
  "productRow",
  "recentOrder",
  "orderRow",
  "orderDetail",
  "categoryChoice",
  "productChoice",
]);
const pathFields: Record<string, Set<string>> = {
  product: new Set([
    "name",
    "slug",
    "description",
    "price",
    "stock",
    "fabric",
    "fit",
    "pattern",
    "colors",
    "size",
    "category",
    "featured",
    "images",
    "gender",
  ]),
  banner: new Set([
    "title",
    "subtitle",
    "ctaText",
    "displayOrder",
    "active",
    "image",
    "destinationType",
    "department",
    "category",
    "product",
    "customUrl",
  ]),
  order: new Set([
    "address.name",
    "address.line1",
    "address.line2",
    "address.city",
    "address.postcode",
    "address.country",
  ]),
  category: new Set(),
};

const safeValue = (path: string, value: unknown) => {
  if (
    [
      "name",
      "description",
      "fabric",
      "fit",
      "pattern",
      "subtitle",
      "ctaText",
      "customUrl",
      "gender",
      "address.name",
      "address.line1",
      "address.line2",
      "address.city",
      "address.postcode",
      "address.country",
    ].includes(path)
  )
    return z.string().max(5000).parse(value);
  if (["price", "stock", "displayOrder"].includes(path))
    return z.number().finite().min(0).max(10_000_000).parse(value);
  if (["featured", "active"].includes(path)) return z.boolean().parse(value);
  if (["colors", "size"].includes(path))
    return z.array(z.string().max(80)).max(100).nullable().parse(value);
  if (path === "slug")
    return z
      .object({ _type: z.literal("slug"), current: z.string().min(1).max(160) })
      .parse(value);
  if (["category", "product"].includes(path))
    return z
      .object({ _type: z.literal("reference"), _ref: idSchema })
      .nullable()
      .parse(value);
  if (path === "destinationType")
    return z.enum(["category", "product", "custom"]).parse(value);
  if (path === "department")
    return z.enum(["men", "women", "kids"]).nullable().parse(value);
  if (path === "images")
    return z
      .array(
        z.object({
          _type: z.literal("image"),
          _key: idSchema,
          asset: z.object({ _type: z.literal("reference"), _ref: idSchema }),
        }),
      )
      .max(20)
      .nullable()
      .parse(value);
  if (path === "image")
    return z
      .object({
        _type: z.literal("image"),
        asset: z.object({ _type: z.literal("reference"), _ref: idSchema }),
      })
      .nullable()
      .parse(value);
  throw new Error("Unsupported field");
};

type AdminDocument = Record<string, unknown> & {
  slug?: { current?: string };
  _category?: { title?: string; departments?: string[]; slug?: string } | null;
  images?: unknown[];
  items?: unknown[];
};

function withResolvedFields(view: z.infer<typeof views>, doc: AdminDocument) {
  if (view === "productRow")
    return {
      ...doc,
      slug: doc.slug?.current,
      category: doc._category,
      image: doc.images?.[0] ?? null,
    };
  if (view === "categoryChoice")
    return { title: doc.title, departments: doc.departments };
  if (view === "productChoice")
    return {
      name: doc.name,
      departments: doc._category?.departments,
      categorySlug: doc._category?.slug,
    };
  if (view === "recentOrder")
    return {
      orderNumber: doc.orderNumber,
      email: doc.email,
      total: doc.total,
      status: doc.status,
      createdAt: doc.createdAt,
    };
  if (view === "orderRow")
    return {
      orderNumber: doc.orderNumber,
      email: doc.email,
      customerPhone: doc.customerPhone,
      total: doc.total,
      status: doc.status,
      fulfillmentStatus: doc.fulfillmentStatus,
      createdAt: doc.createdAt,
      itemCount: doc.items?.length ?? 0,
    };
  if (view === "orderDetail") return doc;
  return doc;
}

function revalidateAdminMutation(type: string) {
  revalidatePath("/admin");
  if (type === "product" || type === "banner" || type === "category") {
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/products/[slug]", "page");
  }
}

async function readDocument(
  client: ReturnType<typeof getAdminSanityClient>,
  type: string,
  id: string,
  view: z.infer<typeof views>,
) {
  const query = `coalesce(*[_type == $type && _id == $draftId][0], *[_type == $type && _id == $id][0]){ ..., "_category": category->{title, departments, "slug": slug.current}, "image": image{..., "assetRef": asset._ref, "asset": asset->{_id, url}}, "images": coalesce(images, select(defined(image) => [image], []))[]{..., "assetRef": asset._ref, "asset": asset->{_id, url}}, "items": items[]{..., "image": image{..., "asset": asset->{_id, url}}, "product": product->{_id, name, "slug": slug.current, "image": coalesce(images[0], image){"asset": asset->{url}}}} }`;
  const document = await client.fetch<AdminDocument | null>(
    query,
    {
      type,
      id: id.replace(/^drafts\./, ""),
      draftId: `drafts.${id.replace(/^drafts\./, "")}`,
    },
    { perspective: "raw" },
  );
  if (!document) return null;
  return withResolvedFields(view, document);
}

function parseFilter(type: string, filter?: string) {
  if (!filter)
    return { where: "", params: {} as Record<string, string | number> };
  if (type === "product" && filter === "stock <= 5")
    return { where: " && stock <= 5", params: {} };
  if (type === "product") {
    const match = /^name match "\*([^*"\\]{1,100})\*"$/.exec(filter);
    if (match)
      return {
        where: " && name match $term",
        params: { term: `*${match[1]}*` },
      };
  }
  if (type === "order") {
    const status =
      /fulfillmentStatus == "([a-z-]+)" \|\| \(!defined\(fulfillmentStatus\) && status == "([a-z-]+)"\)/.exec(
        filter,
      );
    const search =
      /(?:orderNumber match "\*([^*"\\]{1,100})\*" \|\| email match "\*([^*"\\]{1,100})\*"|email match "\*([^*"\\]{1,100})\*")/.exec(
        filter,
      );
    let where = "";
    const params: Record<string, string> = {};
    if (status) {
      where +=
        " && (fulfillmentStatus == $fulfillment || (!defined(fulfillmentStatus) && status == $legacy))";
      params.fulfillment = status[1];
      params.legacy = status[2];
    }
    const term = search?.[1] ?? search?.[2] ?? search?.[3];
    if (term) {
      where += search?.[3]
        ? " && email match $term"
        : " && (orderNumber match $term || email match $term)";
      params.term = `*${term}*`;
    }
    if (where && (filter.includes("fulfillmentStatus") || search))
      return { where, params };
  }
  throw new Error("Invalid admin filter");
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const client = getAdminSanityClient();
    const params = request.nextUrl.searchParams;
    const operation = params.get("op");
    if (operation === "document") {
      const type = docType.parse(params.get("type"));
      const id = idSchema.parse(params.get("id"));
      const view = views.parse(params.get("view") ?? "raw");
      return NextResponse.json(await readDocument(client, type, id, view));
    }
    if (operation === "list") {
      const type = docType.parse(params.get("type"));
      const filter = parseFilter(type, params.get("filter") ?? undefined);
      const limit = z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .parse(params.get("limit"));
      const offset = z.coerce
        .number()
        .int()
        .min(0)
        .max(10_000)
        .default(0)
        .parse(params.get("offset"));
      const ordering = z
        .enum(["_createdAt", "title", "name", "displayOrder", "stock"])
        .default("_createdAt")
        .parse(params.get("order") ?? "_createdAt");
      const direction = z
        .enum(["asc", "desc"])
        .default("desc")
        .parse(params.get("direction") ?? "desc");
      const query = `*[_type == $type${filter.where}] | order(${ordering} ${direction}) [0...10000]{_id, _createdAt, title, name, displayOrder, stock}`;
      const rawRows = await client.fetch<
        (AdminDocument & {
          _id: string;
          _createdAt?: string;
          title?: string;
          name?: string;
          displayOrder?: number;
          stock?: number;
        })[]
      >(query, { type, ...filter.params }, { perspective: "raw" });
      const unique = new Map<string, (typeof rawRows)[number]>();
      for (const row of rawRows) {
        const baseId = row._id.replace(/^drafts\./, "");
        const previous = unique.get(baseId);
        if (!previous || row._id.startsWith("drafts.")) unique.set(baseId, row);
      }
      const rows = [...unique.values()]
        .sort((a, b) => {
          const left = a[ordering] ?? "";
          const right = b[ordering] ?? "";
          const compared =
            typeof left === "number" && typeof right === "number"
              ? left - right
              : String(left).localeCompare(String(right));
          return direction === "asc" ? compared : -compared;
        })
        .slice(offset, offset + limit + 1);
      const page = rows.slice(0, limit);
      let documents: (typeof page)[number][] = page;
      if (type !== "order" && page.length > 0) {
        const projection =
          type === "product"
            ? `{..., "_category": category->{title, departments, "slug": slug.current}, "images": coalesce(images, select(defined(image) => [image], []))[]{..., "assetRef": asset._ref, "asset": asset->{_id, url}}}`
            : type === "banner"
              ? `{..., "image": image{..., "asset": asset->{_id, _ref, url}}}`
              : `{..., "slug": slug.current, "image": image{..., "asset": asset->{_id, _ref, url}}}`;
        const hydrated = await client.fetch<
          (AdminDocument & { _id: string })[]
        >(
          `*[_type == $type && _id in $ids]${projection}`,
          { type, ids: page.map((document) => document._id) },
          { perspective: "raw" },
        );
        const hydratedById = new Map(hydrated.map((doc) => [doc._id, doc]));
        documents = page.map(
          (document) => hydratedById.get(document._id) ?? document,
        );
      }
      return NextResponse.json({
        rows: documents.map((document) => ({
          ...document,
          documentId: document._id.replace(/^drafts\./, ""),
          documentType: type,
        })),
        hasMore: rows.length > limit,
      });
    }
    if (operation === "count") {
      const type = docType.parse(params.get("type"));
      const filter = parseFilter(type, params.get("filter") ?? undefined);
      const count = await client.fetch<number>(
        `count(*[_type == $type${filter.where}])`,
        { type, ...filter.params },
        { perspective: "raw" },
      );
      return NextResponse.json({ count });
    }
    if (operation === "exists" || operation === "references") {
      const id = idSchema.parse(params.get("id"));
      const query =
        operation === "exists"
          ? `*[_id == $id][0]{_id}`
          : `*[_type == "order" && references($id)][0...101]{_id}`;
      return NextResponse.json(await client.fetch(query, { id }));
    }
    return NextResponse.json(
      { error: "Unsupported operation" },
      { status: 400 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SANITY_ADMIN_API_TOKEN is not configured"
    )
      return NextResponse.json(
        { error: "Admin content service is not configured" },
        { status: 503 },
      );
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid admin content request" },
        { status: 400 },
      );
    logSanitizedServiceError("read", error);
    return NextResponse.json(
      { error: "Admin content service failed. Retry the request." },
      { status: 502 },
    );
  }
}

const mutation = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    type: docType.exclude(["order", "category"]),
    id: idSchema,
    value: z.record(z.string(), z.unknown()).default({}),
  }),
  z.object({
    action: z.literal("set"),
    type: docType,
    id: idSchema,
    path: z.string().min(1).max(80),
    value: z.unknown(),
  }),
  z.object({
    action: z.enum(["publish", "discard", "delete"]),
    type: docType,
    id: idSchema,
  }),
]);

export async function POST(request: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = mutation.parse(await request.json());
    const client = getAdminSanityClient();
    if (body.action === "create") {
      const cleanValue = z.record(z.string(), z.unknown()).parse(body.value);
      const safeFields =
        body.type === "product" ? pathFields.product : pathFields.banner;
      for (const [path, value] of Object.entries(cleanValue)) {
        if (!safeFields.has(path)) throw new Error("Unsupported create field");
        safeValue(path, value);
      }
      const draftId = `drafts.${body.id}`;
      await client.createIfNotExists({
        _id: draftId,
        _type: body.type,
        ...cleanValue,
      });
      revalidateAdminMutation(body.type);
      return NextResponse.json({ ok: true });
    }
    if (!pathFields[body.type]) throw new Error("Unsupported document type");
    const baseId = body.id.replace(/^drafts\./, "");
    const draftId = `drafts.${baseId}`;
    if (body.action === "set") {
      if (!pathFields[body.type].has(body.path))
        throw new Error("Unsupported field");
      const value = safeValue(body.path, body.value);
      const existing = await client.fetch(
        `coalesce(*[_id == $draftId][0], *[_id == $baseId][0])`,
        { draftId, baseId },
        { perspective: "raw" },
      );
      if (!existing) throw new Error("Document not found");
      if (!existing._id.startsWith("drafts.")) {
        const draft = { ...existing, _id: draftId } as Record<string, unknown>;
        delete draft._rev;
        delete draft._createdAt;
        delete draft._updatedAt;
        await client.createIfNotExists(draft as never);
      }
      await client
        .patch(draftId)
        .set({ [body.path]: value })
        .commit();
    } else if (body.action === "discard") {
      await client.delete(draftId);
    } else if (body.action === "publish") {
      const draft = await client.fetch(
        `*[_id == $id][0]`,
        { id: draftId },
        { perspective: "raw" },
      );
      if (!draft) throw new Error("Draft not found");
      const fields = { ...draft } as Record<string, unknown>;
      delete fields._id;
      delete fields._rev;
      delete fields._createdAt;
      delete fields._updatedAt;
      await client
        .transaction()
        .createOrReplace({ ...fields, _id: baseId } as never)
        .delete(draftId)
        .commit();
    } else if (body.action === "delete") {
      if (body.type === "product") {
        const references = await client.fetch(
          `count(*[_type == "order" && references($id)])`,
          { id: baseId },
        );
        if (references > 0)
          return NextResponse.json(
            { error: "Product is referenced by orders" },
            { status: 409 },
          );
      }
      await client.transaction().delete(baseId).delete(draftId).commit();
    }
    revalidateAdminMutation(body.type);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SANITY_ADMIN_API_TOKEN is not configured"
    )
      return NextResponse.json(
        { error: "Admin content service is not configured" },
        { status: 503 },
      );
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid admin content request" },
        { status: 400 },
      );
    logSanitizedServiceError("write", error);
    return NextResponse.json(
      { error: "Admin content service failed. Retry the request." },
      { status: 502 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/"))
      return NextResponse.json(
        { error: "Choose a valid image file." },
        { status: 400 },
      );
    if (file.size > MAX_ADMIN_IMAGE_BYTES)
      return NextResponse.json(
        { error: "Image exceeds the 4 MB upload limit." },
        { status: 413 },
      );
    const asset = await getAdminSanityClient().assets.upload("image", file, {
      filename: file.name.slice(0, 200),
    });
    return NextResponse.json({ _id: asset._id });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SANITY_ADMIN_API_TOKEN is not configured"
    )
      return NextResponse.json(
        { error: "Admin content service is not configured" },
        { status: 503 },
      );
    logSanitizedServiceError("image upload", error);
    return NextResponse.json(
      {
        error:
          "Image upload service failed. Try again with an image under 4 MB.",
      },
      { status: 502 },
    );
  }
}

function logSanitizedServiceError(operation: string, error: unknown) {
  const candidate = error as {
    name?: unknown;
    statusCode?: unknown;
    code?: unknown;
  } | null;
  const code =
    typeof candidate?.code === "string" &&
    /^[a-z0-9_-]{1,40}$/i.test(candidate.code)
      ? candidate.code
      : undefined;
  console.error("[ADMIN CONTENT] service request failed", {
    operation,
    name:
      typeof candidate?.name === "string" &&
      /^[a-z]+error$/i.test(candidate.name)
        ? candidate.name
        : "Error",
    statusCode:
      typeof candidate?.statusCode === "number"
        ? candidate.statusCode
        : undefined,
    code,
  });
}
