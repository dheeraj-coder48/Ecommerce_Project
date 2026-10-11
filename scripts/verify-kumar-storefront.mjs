import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "next-sanity";

config({ path: ".env.local", quiet: true });
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-12-05",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
const slugs = (await readFile(path.join(process.cwd(), "kumar-collection-products.ndjson"), "utf8"))
  .trim().split(/\r?\n/).map((line) => JSON.parse(line)).filter((doc) => doc._type === "product").map((doc) => doc.slug.current);
const ndjsonDocs = (await readFile(path.join(process.cwd(), "kumar-collection-products.ndjson"), "utf8"))
  .trim().split(/\r?\n/).map((line) => JSON.parse(line));
const backup = JSON.parse(await readFile(path.join(process.cwd(), "backups", "kumar-catalog-preimport.json"), "utf8"));
const allowedCategories = ["kurtas", "kurta-sets", "sherwanis", "nehru-jackets", "ethnic-wear", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"];

const [collection, categories, categoryCounts, searchResults, orangeProducts, detailPages, cartProducts, adminProducts] = await Promise.all([
  client.fetch('*[_type == "product" && slug.current in $slugs && gender == "men" && "men" in category->departments && category->slug.current in $allowed && stock > 0]{_id, name, "slug": slug.current, price, stock, "category": category->{title, "slug": slug.current}, "cardImage": images[0].asset->{_id, url}}', { slugs, allowed: allowedCategories }),
  client.fetch('*[_type == "category" && slug.current in ["kurtas", "kurta-sets", "sherwanis", "nehru-jackets"] && "men" in departments]{_id, title, "slug": slug.current, departments}'),
  client.fetch('*[_type == "category" && slug.current in ["kurtas", "kurta-sets", "sherwanis", "nehru-jackets"] && "men" in departments]{"slug": slug.current, "products": count(*[_type == "product" && gender == "men" && category._ref == ^._id && stock > 0])}'),
  client.fetch('*[_type == "product" && slug.current in $slugs && gender == "men" && "men" in category->departments && stock > 0 && (name match $query + "*" || description match $query + "*")]{_id, name, "slug": slug.current}', { slugs, query: "Peacock" }),
  client.fetch('*[_type == "product" && slug.current in $slugs && "orange" in colors && gender == "men" && stock > 0]{_id, name, "slug": slug.current}', { slugs }),
  client.fetch('*[_type == "product" && slug.current in $slugs && gender == "men"]{_id, name, "slug": slug.current, "category": category->{title, "slug": slug.current, departments}, "images": images[]{"assetId": asset->_id, "url": asset->url}}', { slugs }),
  client.fetch('*[_type == "product" && slug.current in $slugs]{_id, name, price, stock, "image": images[0].asset->{_id, url}}', { slugs }),
  client.fetch('*[_type == "product" && slug.current in $slugs]{_id, name, price, stock, gender, "slug": slug.current}', { slugs }),
]);

const checks = {
  collectionProducts: collection.length === slugs.length && collection.every((p) => p.cardImage?._id && p.cardImage.url),
  categories: categories.length === 4 && categories.every((c) => c.departments.includes("men")),
  categoryPages: categoryCounts.length === 4 && categoryCounts.every((c) => c.products > 0),
  search: searchResults.length > 0,
  colorFilter: orangeProducts.length > 0,
  productDetails: detailPages.length === slugs.length && detailPages.every((p) => p.category?.departments?.includes("men") && p.images.length > 0 && p.images.every((i) => i.assetId && i.url)),
  cartLookup: cartProducts.length === slugs.length && cartProducts.every((p) => p.image?._id && p.price > 0 && p.stock > 0),
  adminInventory: adminProducts.length === slugs.length,
};
const report = {
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  counts: { expectedProducts: slugs.length, collection: collection.length, categories: categories.length, searchMatches: searchResults.length, orangeFilterMatches: orangeProducts.length, detailPages: detailPages.length, cartProducts: cartProducts.length, adminInventory: adminProducts.length, resolvedProductImages: detailPages.reduce((sum, p) => sum + p.images.filter((i) => i.assetId && i.url).length, 0) },
  categoryCounts,
  checks,
  passed: Object.values(checks).every(Boolean),
};
const expectedAssetIds = [...new Set(ndjsonDocs.filter((doc) => doc._type === "product").flatMap((doc) => doc.images.map((image) => image.asset._ref)))];
const assetDocs = await client.fetch('*[_id in $ids]{_id, _createdAt}', { ids: expectedAssetIds });
const newAssetUploads = assetDocs.filter((asset) => Date.parse(asset._createdAt) >= Date.parse(backup.capturedAt)).length;
report.counts.newAssetsUploadedForThisBuild = newAssetUploads;
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
const reviewPath = path.join(process.cwd(), "generated-kumar-catalog-review.md");
let review = await readFile(reviewPath, "utf8");
const existingValidationSection = review.indexOf("\n## Storefront query validation");
if (existingValidationSection !== -1) review = review.slice(0, existingValidationSection);
review = review.replace(
  /- Sanity assets uploaded for this catalog preparation: \d+; previously existing identical assets reused: \d+/,
  `- Sanity assets uploaded for this catalog build: ${newAssetUploads}; previously existing identical assets reused: ${expectedAssetIds.length - newAssetUploads}`,
);
review += `\n## Storefront query validation\n\n- Dataset: \`${report.dataset}\`\n- Collection results: ${collection.length}/${slugs.length}\n- Men's categories found and populated: ${categories.length}/4 (${categoryCounts.map((c) => `${c.slug}: ${c.products}`).join(", ")})\n- Search query “Peacock” results: ${searchResults.length}\n- Color filter “orange” results: ${orangeProducts.length}\n- Product detail documents with category and resolved gallery images: ${detailPages.length}/${slugs.length}\n- Cart lookup results with first image, price, and stock: ${cartProducts.length}/${slugs.length}\n- Admin inventory document results: ${adminProducts.length}/${slugs.length}\n- All query checks passed: ${report.passed ? "YES" : "NO"}\n`;
await writeFile(reviewPath, review, "utf8");
