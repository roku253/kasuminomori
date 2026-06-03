"use client";

import { useEffect } from "react";

const KN_FP_KEY = "signal_trace_kn_footprint_v2";

function knPurged() {
  try {
    const f = localStorage.getItem(KN_FP_KEY) || "";
    return f === "purged_delete" || f === "purged_keep";
  } catch {
    return false;
  }
}

function knApplyFootprint() {
  if (!knPurged()) return;
  document.querySelectorAll('[data-kn-story-clue="1"]').forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });
}

export function Footprint() {
  useEffect(() => {
    knApplyFootprint();
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KN_FP_KEY) return;
      const v = e.newValue;
      if (v !== "purged_delete" && v !== "purged_keep") return;
      knApplyFootprint();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
