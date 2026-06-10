"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { reconcileAction } from "@/app/actions/reconcile";

// Déclenche la réconciliation paresseuse au chargement du dashboard, une seule fois,
// puis rafraîchit pour afficher l'état à jour. Rendu invisible.
export function ReconcileOnMount() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void reconcileAction().then(() => router.refresh());
  }, [router]);

  return null;
}
