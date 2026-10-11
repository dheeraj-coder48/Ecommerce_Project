import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "next-sanity";
import { catalogCategories, catalogProducts, excludedImages } from "./kumar-catalog-products.mjs";

config({ path: ".env.local", quiet: true });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  throw new Error("Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN in .env.local.");
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-12-05",
  useCdn: false,
  token,
});
const root = process.cwd();
const backupDir = path.join(root, "backups");
const backupPath = path.join(backupDir, "kumar-catalog-preimport.json");
const ndjsonPath = path.join(root, "kumar-collection-products.ndjson");
const reviewPath = path.join(root, "generated-kumar-catalog-review.md");
const DEFAULT_PRICE_INR = 999;
const DEFAULT_STOCK = 10;

const lines = (docs) => `${docs.map((doc) => JSON.stringify(doc)).join("\n")}\n`;

// Preserve current product and category documents before any production writes.
await mkdir(backupDir, { recursive: true });
const existingSnapshot = await client.fetch('*[_type in ["product", "category"]]');
const backup = {
  capturedAt: new Date().toISOString(),
  projectId,
  dataset,
  scope: "all current product and category documents; no customer or order data",
  documents: existingSnapshot,
};
await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`, { flag: "wx" }).catch(async (error) => {
  if (error.code !== "EEXIST") throw error;
  const previous = JSON.parse(await readFile(backupPath, "utf8"));
  if (previous.dataset !== dataset || !Array.isArray(previous.documents)) {
    throw new Error(`Existing backup ${backupPath} is invalid or belongs to a different dataset.`);
  }
  console.log(`Keeping existing pre-import backup (${previous.documents.length} documents).`);
});
console.log(`Backed up ${existingSnapshot.length} product/category documents to ${path.relative(root, backupPath)}.`);

const liveProducts = existingSnapshot.filter((doc) => doc._type === "product");
const liveCategories = existingSnapshot.filter((doc) => doc._type === "category");
const categoryBySlug = new Map(liveCategories.map((doc) => [doc.slug?.current, doc]));
const productSlugs = new Set();
const sourceNames = new Set();
for (const product of catalogProducts) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) throw new Error(`Invalid URL slug: ${product.slug}`);
  if (productSlugs.has(product.slug)) throw new Error(`Duplicate catalog slug: ${product.slug}`);
  productSlugs.add(product.slug);
  if (sourceNames.has(product.name)) throw new Error(`Duplicate catalog product name: ${product.name}`);
  sourceNames.add(product.name);
  if (!product.images.length) throw new Error(`No images configured for ${product.name}`);
  if (!catalogCategories.some((category) => category.slug === product.category)) throw new Error(`Unknown catalog category ${product.category}`);
}

const categoryDocs = [];
const categoryIds = new Map();
for (const category of catalogCategories) {
  const existing = categoryBySlug.get(category.slug);
  if (existing) {
    if (!existing.departments?.includes("men")) throw new Error(`Existing category ${category.slug} is not assigned to the men's department; refusing to change it.`);
    categoryIds.set(category.slug, existing._id);
  } else {
    const doc = {
      _id: `kumar-category-${randomUUID()}`,
      _type: "category",
      title: category.title,
      slug: { _type: "slug", current: category.slug },
      departments: ["men"],
    };
    categoryDocs.push(doc);
    categoryIds.set(category.slug, doc._id);
  }
}

const sourceImages = [...new Set(catalogProducts.flatMap((product) => product.images))];
const imageMeta = await Promise.all(sourceImages.map(async (relativePath) => {
  const absolutePath = path.resolve(root, relativePath);
  const bytes = await readFile(absolutePath);
  return {
    relativePath,
    filename: path.basename(relativePath),
    sha1: createHash("sha1").update(bytes).digest("hex"),
    contentType: ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" })[path.extname(relativePath).toLowerCase()],
    absolutePath,
  };
}));
if (imageMeta.some((file) => !file.contentType)) throw new Error("Unsupported image type in catalog manifest.");

const fileHashes = [...new Set(imageMeta.map((file) => file.sha1))];
const existingAssets = await client.fetch(
  '*[_type == "sanity.imageAsset" && sha1hash in $hashes]{_id, sha1hash}',
  { hashes: fileHashes },
);
const assetByHash = new Map(existingAssets.map((asset) => [asset.sha1hash, asset._id]));
const uploadedByHash = new Map();
for (const file of imageMeta) {
  if (assetByHash.has(file.sha1)) continue;
  if (uploadedByHash.has(file.sha1)) {
    assetByHash.set(file.sha1, uploadedByHash.get(file.sha1));
    continue;
  }
  const asset = await client.assets.upload("image", createReadStream(file.absolutePath), {
    filename: file.filename,
    contentType: file.contentType,
  });
  uploadedByHash.set(file.sha1, asset._id);
  assetByHash.set(file.sha1, asset._id);
  console.log(`Uploaded image asset ${file.filename}: ${asset._id}`);
}

const shaByPath = new Map(imageMeta.map((file) => [file.relativePath, file.sha1]));
const productDocs = catalogProducts.map((product) => ({
  _id: `kumar-product-${randomUUID()}`,
  _type: "product",
  name: product.name,
  slug: { _type: "slug", current: product.slug },
  description: product.description,
  price: DEFAULT_PRICE_INR,
  stock: DEFAULT_STOCK,
  category: { _type: "reference", _ref: categoryIds.get(product.category) },
  gender: "men",
  colors: product.colors,
  pattern: product.pattern,
  featured: false,
  images: product.images.map((relativePath, index) => ({
    _key: `image-${index + 1}`,
    _type: "image",
    asset: { _type: "reference", _ref: assetByHash.get(shaByPath.get(relativePath)) },
  })),
}));

for (const doc of productDocs) {
  for (const image of doc.images) {
    if (!image.asset._ref) throw new Error(`Missing Sanity asset reference in ${doc.name}`);
  }
  if (!(doc.price > 0) || !Number.isInteger(doc.stock) || doc.stock < 0 || doc.gender !== "men") {
    throw new Error(`Invalid price, inventory, or department on ${doc.name}`);
  }
  if (!categoryIds.has(catalogProducts.find((product) => product.slug === doc.slug.current).category)) {
    throw new Error(`Missing men's category reference on ${doc.name}`);
  }
}

const newProductSlugs = new Set();
for (const product of catalogProducts) {
  if (newProductSlugs.has(product.slug)) throw new Error(`Duplicate product slug: ${product.slug}`);
  newProductSlugs.add(product.slug);
}
const documents = [...categoryDocs, ...productDocs];
const allIds = new Set();
for (const doc of documents) {
  if (allIds.has(doc._id)) throw new Error(`Duplicate _id: ${doc._id}`);
  allIds.add(doc._id);
}
const existingIds = new Set(existingSnapshot.map((doc) => doc._id));
for (const doc of documents) if (existingIds.has(doc._id)) throw new Error(`Generated ID collision: ${doc._id}`);

// Confirm the asset IDs returned/resolved above are real Sanity image assets.
const referencedAssetIds = [...new Set(productDocs.flatMap((doc) => doc.images.map((image) => image.asset._ref)))];
const verifiedAssetIds = await client.fetch(
  '*[_type == "sanity.imageAsset" && _id in $ids]._id',
  { ids: referencedAssetIds },
);
if (verifiedAssetIds.length !== referencedAssetIds.length) {
  throw new Error(`Asset verification failed: ${referencedAssetIds.length - verifiedAssetIds.length} image assets are missing.`);
}
const assetsCreatedForThisCatalog = await client.fetch(
  '*[_type == "sanity.imageAsset" && sha1hash in $hashes && _createdAt >= $backupTime]._id',
  { hashes: fileHashes, backupTime: backup.capturedAt },
);

await writeFile(ndjsonPath, lines(documents), "utf8");
const ndjsonDocuments = (await readFile(ndjsonPath, "utf8")).trim().split(/\r?\n/).map((line) => JSON.parse(line));
if (ndjsonDocuments.length !== documents.length) throw new Error("NDJSON line count mismatch.");

const groupRows = catalogProducts.map((product) => {
  const ids = product.images.map((file) => path.basename(file));
  const confidence = product.images.length > 1 ? "High grouping confidence" : "High garment-type confidence";
  return `| ${product.name} | ${product.category} | ${product.colors.join(", ")} | ${ids.map((name) => `\`${name}\``).join("<br>")} | ₹${DEFAULT_PRICE_INR} / ${DEFAULT_STOCK} | ${confidence}; visible attributes inferred from appearance. SKU identity, fabric, and sizes are unverified. Development defaults only. |`;
});
const excludedRows = excludedImages.map(({ file, reason }) => `| \`${file}\` | ${reason} |`);
const summary = `# Kumar Collection product catalog review

## Import status and pricing note

This is a development/demo catalog. **₹${DEFAULT_PRICE_INR} and stock ${DEFAULT_STOCK} are temporary development defaults, not verified retail prices or real inventory. Replace both with confirmed values before production sales.** The project Sanity dataset is \`${dataset}\`; the site can display and sell published products from this dataset.

Generated ${catalogProducts.length} unique men's ethnic product documents from ${sourceImages.length} useful image files. Related views are grouped into single products. Promotional artwork, bundle offers, and ads marked “Gents | Kids” are excluded. No fabric composition or available sizes are asserted because the source photos do not establish them.

The schema has a single description field, so short and detailed copy are combined in that field. It has no tags, separate occasion, or fit field. Product category references use the existing category schema and men's department. The four category records below are added only when a matching usable category does not already exist.

## Groups imported

| Product | Category | Color | Images grouped into one product | Price / stock | Confidence and notes |
|---|---|---|---|---|---|
${groupRows.join("\n")}

## Excluded images

| Image | Reason |
|---|---|
${excludedRows.join("\n")}

## Data quality and safeguards

- Source images scanned: 51
- Unique product groups prepared: ${catalogProducts.length}
- Images referenced by products: ${sourceImages.length}
- Promotional / non-catalog images excluded: ${excludedImages.length}
- Products using temporary ₹${DEFAULT_PRICE_INR} development price: ${productDocs.length}
- Products using temporary stock ${DEFAULT_STOCK}: ${productDocs.length}
- Duplicate-image groups merged into single product documents: ${catalogProducts.filter((product) => product.images.length > 1).length}
- Products with known size availability: 0
- Products with known fabric composition: 0
- Duplicate image bytes deduplicated to one Sanity asset: ${sourceImages.length - fileHashes.length}
- Sanity assets uploaded for this catalog preparation: ${assetsCreatedForThisCatalog.length}; previously existing identical assets reused: ${fileHashes.length - assetsCreatedForThisCatalog.length}
- Existing production products and categories backed up before any writes to \`backups/kumar-catalog-preimport.json\`; no existing product/category is replaced or deleted.
- Generated NDJSON: \`kumar-collection-products.ndjson\` (${categoryDocs.length} new categories and ${productDocs.length} products). Every image field contains a verified Sanity asset reference.

## Categories in this catalog

${catalogCategories.map((category) => `- ${category.title} (\`${category.slug}\`), men's department`).join("\n")}
`;
await writeFile(reviewPath, summary, "utf8");

console.log(JSON.stringify({
  dataset,
  backup: path.relative(root, backupPath),
  products: productDocs.length,
  categoriesToCreate: categoryDocs.length,
  sourceImages: sourceImages.length,
  uniqueImageBytes: fileHashes.length,
  uploadedAssets: uploadedByHash.size,
  reusedAssets: assetByHash.size - uploadedByHash.size,
  excludedImages: excludedImages.length,
  ndjson: path.relative(root, ndjsonPath),
  review: path.relative(root, reviewPath),
}, null, 2));
