const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-02-19',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

async function main() {
  const categories = await client.fetch('*[_type == "category"]');
  console.log("Categories in Sanity:", categories.map(c => ({ id: c._id, title: c.title, slug: c.slug?.current })));

  const p1 = await client.fetch('*[_id in ["fde3959b-1d29-4bf0-8e2c-b5538748423d", "drafts.fde3959b-1d29-4bf0-8e2c-b5538748423d"]]');
  console.log("Documents found for Kapda hu:", p1);
}

main().catch(console.error);
