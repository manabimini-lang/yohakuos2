"use client";

import { useEffect } from "react";
import { recordMemoryInteraction } from "@/app/actions/memory-interaction";

export function InteractionTracker({ itemId, type }: { itemId: string; type: "view" | "click" }) {
  useEffect(() => {
    if (type === "view") {
      recordMemoryInteraction(itemId, "view").catch(console.error);
    }
  }, [itemId, type]);

  return null;
}
