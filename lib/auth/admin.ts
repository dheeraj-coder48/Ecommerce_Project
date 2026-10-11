import { auth, currentUser } from "@clerk/nextjs/server";

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const role = user?.publicMetadata?.role;
  return role === "admin" ? userId : null;
}
