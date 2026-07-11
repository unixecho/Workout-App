"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { asLocale, LOCALE_COOKIE } from "./index";

/** Persist the viewer's language choice (Profile → Language). */
export async function setLocale(value: string) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, asLocale(value), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
