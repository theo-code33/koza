"use server";

import { reconcile } from "@/lib/period";
import { getCurrentUserId } from "@/lib/current-user";

export async function reconcileAction(): Promise<void> {
  await reconcile(await getCurrentUserId(), new Date());
}
