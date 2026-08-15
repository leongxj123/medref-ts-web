import { cookies } from "next/headers";
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
