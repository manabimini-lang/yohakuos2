"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useCaptureStore } from "@/store/capture-store";
import { CaptureToast } from "./CaptureToast";

const CaptureModal = dynamic(
  () => import("./CaptureModal").then((module) => module.CaptureModal),
  { ssr: false },
);

export function CaptureLayer() {
  const isOpen = useCaptureStore((state) => state.isOpen);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasOpened(true);
    }
  }, [isOpen]);

  return (
    <>
      {hasOpened ? <CaptureModal /> : null}
      <CaptureToast />
    </>
  );
}
