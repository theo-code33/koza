"use server";

import { reconcile } from "@/lib/period";

export async function reconcileAction(): Promise<void> {
  await reconcile(new Date());
}
