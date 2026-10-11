import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "next-sanity";

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
const ndjsonPath = path.join(process.cwd(), "kumar-collection-products.ndjson");
const backupPath = path.join(process.cwd(), "backups", "kumar-catalog-preimport.json");
const reviewPath = path.join(process.cwd(), "generated-kumar-catalog-review.md");

const backup = JSON.parse(await readFile(backupPath, "utf8"));
if (backup.dataset !== dataset || !Array.isArray(backup.documents)) {
  throw new Error("A matching pre-import product/category backup is required before importing.");
}
const raw = (await readFile(ndjsonPath, "utf8")).trim();
if (!raw) throw new Error("The generated product NDJSON is empty.");
const docs = raw.split(/\r?\n/).map((line, index) => {
  try {
    return JSON.parse(line);
  } catch (error) {
    throw new Error(`Invalid NDJSON at line ${index + 1}: ${error.message}`);
  }
});
const categoryDocs = docs.filter((doc) => doc._type === "category");
const productDocs = docs.filter((doc) => doc._type === "product");
if (docs.length !== categoryDocs.length + productDocs.length || productDocs.length === 0) {
  throw new Error("NDJSON may contain only category and product documents and must include products.");
}

const ids = new Set();
const productSlugs = new Set();
const categorySlugs = new Set();
for (const doc of docs) {
  if (typeof doc._id !== "string" || !doc._id || ids.has(doc._id)) throw new Error(`Missing or duplicate _id: ${doc._id}`);
  ids.add(doc._id);
  if (doc._type === "category") {
    if (!doc.title || !doc.slug?.current || !Array.isArray(doc.departments) || !doc.departments.includes("men")) {
      throw new Error(`Invalid men's category document ${doc._id}`);
    }
    if (categorySlugs.has(doc.slug.current)) throw new Error(`Duplicate category slug ${doc.slug.current}`);
    categorySlugs.add(doc.slug.current);
    continue;
  }
  if (!doc.name || !doc.slug?.current || !doc.description) throw new Error(`Missing product detail on ${doc._id}`);
  if (productSlugs.has(doc.slug.current)) throw new Error(`Duplicate product slug ${doc.slug.current}`);
  productSlugs.add(doc.slug.current);
  if (typeof doc.price !== "number" || doc.price <= 0) throw new Error(`Invalid price on ${doc.name}`);
  if (!Number.isInteger(doc.stock) || doc.stock < 0) throw new Error(`Invalid stock on ${doc.name}`);
  if (doc.gender !== "men") throw new Error(`Non-men department on ${doc.name}`);
  if (!doc.category?._ref) throw new Error(`Missing category reference on ${doc.name}`);
  if (!Array.isArray(doc.images) || doc.images.length === 0) throw new Error(`Missing product images on ${doc.name}`);
  if (doc.colors && (!Array.isArray(doc.colors) || doc.colors.some((color) => typeof color !== "string"))) {
    throw new Error(`Invalid color list on ${doc.name}`);
  }
  if (doc.size || doc.fabric) throw new Error(`Unknown sizes/fabric must remain unset: ${doc.name}`);
  for (const image of doc.images) {
    if (image._type !== "image" || image.asset?._type !== "reference" || !image.asset._ref) {
      throw new Error(`Invalid Sanity image reference on ${doc.name}`);
    }
  }
}

const allowedCategories = new Set(["kurtas", "kurta-sets", "sherwanis", "nehru-jackets"]);
const categoriesById = new Map(categoryDocs.map((doc) => [doc._id, doc]));
for (const doc of productDocs) {
  const categoryDoc = categoriesById.get(doc.category._ref);
  if (categoryDoc) {
    if (!allowedCategories.has(categoryDoc.slug.current) || !categoryDoc.departments.includes("men")) {
      throw new Error(`Invalid men's ethnic category for ${doc.name}`);
    }
  }
}

const allIds = [...ids];
const existingIds = await client.fetch('*[_id in $ids]{_id, _type}', { ids: allIds });
const idToExistingType = new Map(existingIds.map((doc) => [doc._id, doc._type]));
for (const doc of docs) {
  const found = idToExistingType.get(doc._id);
  if (found && found !== doc._type) throw new Error(`ID ${doc._id} is already used by a ${found} document.`);
}

const liveCategories = await client.fetch(
  '*[_type == "category" && slug.current in $slugs]{_id, title, "slug": slug.current, departments}',
  { slugs: [...allowedCategories] },
);
const liveCategoryBySlug = new Map(liveCategories.map((doc) => [doc.slug, doc]));
for (const category of liveCategories) {
  if (!category.departments?.includes("men")) throw new Error(`Existing ${category.slug} category is not in men's department.`);
}
const categoryIdToSlug = new Map(categoryDocs.map((doc) => [doc._id, doc.slug.current]));
for (const doc of productDocs) {
  const newSlug = categoryIdToSlug.get(doc.category._ref);
  const currentSlug = newSlug ?? liveCategories.find((category) => category._id === doc.category._ref)?.slug;
  if (!currentSlug || !allowedCategories.has(currentSlug)) throw new Error(`Invalid category reference on ${doc.name}`);
  const existingCategory = liveCategoryBySlug.get(currentSlug);
  if (existingCategory) doc.category._ref = existingCategory._id;
}

const assetIds = [...new Set(productDocs.flatMap((doc) => doc.images.map((image) => image.asset._ref)))];
const verifiedAssets = await client.fetch('*[_type == "sanity.imageAsset" && _id in $ids]._id', { ids: assetIds });
if (verifiedAssets.length !== assetIds.length) {
  throw new Error(`Invalid image references: ${assetIds.length - verifiedAssets.length} Sanity image assets are missing.`);
}

const requestedSlugs = [...productSlugs];
const existingProducts = await client.fetch(
  '*[_type == "product" && slug.current in $slugs]{_id, name, "slug": slug.current, gender, "categorySlug": category->slug.current}',
  { slugs: requestedSlugs },
);
const existingProductsBySlug = new Map(existingProducts.map((doc) => [doc.slug, doc]));
for (const doc of productDocs) {
  const existing = existingProductsBySlug.get(doc.slug.current);
  if (!existing) continue;
  if (existing.name !== doc.name || existing.gender !== "men" || !allowedCategories.has(existing.categorySlug)) {
    throw new Error(`Product slug ${doc.slug.current} already belongs to an unrelated or non-men product (${existing.name}); refusing to overwrite it.`);
  }
}
const newProducts = productDocs.filter((doc) => !existingProductsBySlug.has(doc.slug.current));
const knownCategoryIds = new Set(liveCategories.map((doc) => doc._id));
const newCategories = categoryDocs.filter((doc) => !liveCategoryBySlug.has(doc.slug.current));
const categoriesToCreate = newCategories.filter((doc) => !knownCategoryIds.has(doc._id));

console.log(JSON.stringify({
  dataset,
  documentsInFile: docs.length,
  productDocuments: productDocs.length,
  newProducts: newProducts.length,
  existingProductSlugsSkipped: productDocs.length - newProducts.length,
  newCategories: categoriesToCreate.map(({ title, slug }) => ({ title, slug: slug.current })),
  imageAssetReferencesVerified: assetIds.length,
  price: "positive; temporary development defaults are clearly identified in review",
  department: "men only",
  ndjsonValid: true,
}, null, 2));

if (process.argv.includes("--validate-only")) process.exit(0);

if (categoriesToCreate.length || newProducts.length) {
  const transaction = client.transaction();
  for (const category of categoriesToCreate) transaction.create(category);
  for (const product of newProducts) transaction.create(product);
  const result = await transaction.commit();
  console.log(`Created ${categoriesToCreate.length} categories and ${newProducts.length} products (Sanity transaction ${result.transactionId}).`);
} else {
  console.log("No new products or categories to create; this catalog import is already applied.");
}

const importedSlugs = newProducts.map((doc) => doc.slug.current);
const verification = await client.fetch(
  '*[_type == "product" && slug.current in $slugs]{_id, name, "slug": slug.current, price, stock, gender, "category": category->{_id, title, "slug": slug.current, departments}, "images": images[]{"assetId": asset->_id, "assetUrl": asset->url}}',
  { slugs: requestedSlugs },
);
if (verification.length !== productDocs.length) throw new Error(`Post-import count mismatch: expected ${productDocs.length}, got ${verification.length}.`);
for (const product of verification) {
  if (product.gender !== "men" || !product.category?.departments?.includes("men") || !(product.price > 0) || !(product.stock > 0)) {
    throw new Error(`Post-import storefront eligibility check failed for ${product.name}`);
  }
  if (!product.images.length || product.images.some((image) => !image.assetId || !image.assetUrl)) {
    throw new Error(`Post-import image resolution check failed for ${product.name}`);
  }
}

let review = await readFile(reviewPath, "utf8");
review += `\n## Sanity import result\n\n- Imported at: ${new Date().toISOString()}\n- Dataset: \`${dataset}\`\n- Products created in this run: ${newProducts.length}\n- Existing matching product slugs skipped: ${productDocs.length - newProducts.length}\n- Categories created in this run: ${categoriesToCreate.length}\n- Products verified with live image assets, men's category, positive price, and positive stock: ${verification.length}\n- Import command: \`node scripts/import-kumar-catalog.mjs\`\n`;
await writeFile(reviewPath, review, "utf8");
