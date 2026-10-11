import "server-only";

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

/** A dedicated token with only the Sanity content permissions needed by admins. */
export function getAdminSanityClient() {
  const token = process.env.SANITY_ADMIN_API_TOKEN;
  if (!token) throw new Error("SANITY_ADMIN_API_TOKEN is not configured");
  return createClient({ projectId, dataset, apiVersion, useCdn: false, token });
}
