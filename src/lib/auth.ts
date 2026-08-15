import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, verifySession } from "@/lib/auth-shared";

export async function getSessionUser() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return "";
    return await verifySession(token);
  } catch {
    return "";
  }
}

/** Defense-in-depth for sensitive server components (middleware already gates pages). */
export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
