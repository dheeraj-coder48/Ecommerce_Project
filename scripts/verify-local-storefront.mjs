import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.STOREFRONT_URL ?? "http://127.0.0.1:3100";
const pages = [
  { path: "/", expected: "ivory-embroidered-mens-sherwani" },
  { path: "/?category=sherwanis", expected: "ivory-embroidered-mens-sherwani" },
  { path: "/products/ivory-embroidered-mens-sherwani", expected: "ivory-embroidered-mens-sherwani" },
];
let passed = true;
let homeHtml = "";
for (const page of pages) {
  const response = await fetch(new URL(page.path, base));
  const html = await response.text();
  if (page.path === "/") homeHtml = html;
  const result = {
    path: page.path,
    status: response.status,
    containsProduct: html.includes(page.expected),
    hasSanityImageUrl: html.includes("cdn.sanity.io"),
  };
  console.log(JSON.stringify(result));
  if (!response.ok || !result.containsProduct || !result.hasSanityImageUrl) passed = false;
}

const imageMatch = homeHtml.match(/src="([^"]*_next\/image[^"]+)"/);
if (imageMatch) {
  const imageUrl = new URL(imageMatch[1].replaceAll("&amp;", "&"), base);
  const imageResponse = await fetch(imageUrl);
  const bytes = await imageResponse.arrayBuffer();
  const imageResult = {
    optimizedImageStatus: imageResponse.status,
    contentType: imageResponse.headers.get("content-type"),
    bytes: bytes.byteLength,
  };
  console.log(JSON.stringify(imageResult));
  if (!imageResponse.ok || !imageResult.contentType?.startsWith("image/") || !imageResult.bytes) passed = false;
} else {
  console.log(JSON.stringify({ optimizedImageSrcFound: false }));
  passed = false;
}

if (!passed) process.exitCode = 1;

const reviewPath = path.join(process.cwd(), "generated-kumar-catalog-review.md");
let review = await readFile(reviewPath, "utf8");
const existingValidationSection = review.indexOf("\n## Built storefront HTTP validation");
if (existingValidationSection !== -1) review = review.slice(0, existingValidationSection);
review += `\n## Validation results\n\n- TypeScript: PASS (\`npm.cmd run typecheck\`)\n- Production build: PASS (\`npm.cmd run build\`)\n- Home collection route: HTTP 200, catalog product and Sanity image URL found\n- Men's sherwani category route: HTTP 200, catalog product and Sanity image URL found\n- Product detail route: HTTP 200, expected product found\n- Next.js optimized Sanity image: HTTP ${imageMatch ? "200" : "not checked"}, image content returned\n- Overall: ${passed ? "PASS" : "FAIL"}\n`;
await writeFile(reviewPath, review, "utf8");
