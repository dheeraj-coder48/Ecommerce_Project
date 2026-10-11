import { config } from "dotenv";
import { createClient } from "next-sanity";

config({ path: ".env.local", quiet: true });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  throw new Error(
    "Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN before seeding categories.",
  );
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-12-05",
  useCdn: false,
  perspective: "published",
  token,
});

const clothingCategories = [
  { title: "Ethnic Wear", slug: "ethnic-wear", departments: ["men"] },
  { title: "Kurtas", slug: "kurtas", departments: ["men"] },
  { title: "Kurta Sets", slug: "kurta-sets", departments: ["men"] },
  { title: "Sherwanis", slug: "sherwanis", departments: ["men"] },
  { title: "Nehru Jackets", slug: "nehru-jackets", departments: ["men"] },
  { title: "Indo-Western", slug: "indo-western", departments: ["men"] },
  { title: "Wedding Wear", slug: "wedding-wear", departments: ["men"] },
  { title: "Festive Wear", slug: "festive-wear", departments: ["men"] },
  { title: "Ethnic Accessories", slug: "ethnic-accessories", departments: ["men"] },
];

// Keep legacy documents and their references intact, but remove them from active
// storefront navigation and product eligibility by clearing their departments.
const retiredSlugs = [
  "t-shirts", "shirts", "jeans", "trousers", "pants", "track-pants",
  "shorts", "hoodies", "sweatshirts", "jackets",
  "activewear", "accessories", "boys", "girls", "kids-ethnic-wear",
  "kids-party-wear", "kids-casual-wear",
];

async function seedClothingCategories() {
  let created = 0;
  let updated = 0;

  for (const slug of retiredSlugs) {
    const matches = await client.fetch(
      `*[_type == "category" && slug.current == $slug]{_id, departments}`,
      { slug },
    );
    const existing = matches[0];
    if (existing?.departments?.length) {
      await client.patch(existing._id).set({ departments: [] }).commit();
      updated += 1;
    }
  }

  for (const category of clothingCategories) {
    const matches = await client.fetch(
      `*[_type == "category" && slug.current == $slug]{_id, departments}`,
      { slug: category.slug },
    );
    const existing = matches[0];

    if (existing) {
      const currentDepartments = [...(existing.departments ?? [])].sort();
      const nextDepartments = [...category.departments].sort();
      if (
        currentDepartments.length !== nextDepartments.length ||
        currentDepartments.some(
          (department, index) => department !== nextDepartments[index],
        )
      ) {
        await client
          .patch(existing._id)
          .set({ departments: category.departments })
          .commit();
        updated += 1;
      }
      continue;
    }

    await client.create({
      _type: "category",
      title: category.title,
      slug: { _type: "slug", current: category.slug },
      departments: category.departments,
    });
    created += 1;
  }

  const publishedSlugs = await client.fetch(
    `*[_type == "category" && defined(departments[0])].slug.current`,
  );
  const missingCategories = clothingCategories.filter(
    (category) => !publishedSlugs.includes(category.slug),
  );
  if (missingCategories.length > 0) {
    throw new Error(
      `Published category verification failed: ${missingCategories.map(({ slug }) => slug).join(", ")}`,
    );
  }

  console.log(
    `Published clothing categories verified in ${dataset}: ${created} created, ${updated} updated, ${clothingCategories.length - created - updated} unchanged.`,
  );
}

seedClothingCategories().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Failed to seed Sanity clothing categories:", message);
  process.exitCode = 1;
});


