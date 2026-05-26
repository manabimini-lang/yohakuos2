"use client";

import { useSession } from "next-auth/react";
import { CaptureButton } from "./CaptureButton";
import { CaptureModal } from "./CaptureModal";
import { CaptureToast } from "./CaptureToast";

export function CaptureLayer() {
  const { data: session } = useSession();

  // Only show the capture layer for authenticated users
  if (!session) {
    return null;
  }

  return (
    <>
      <CaptureButton />
      <CaptureModal />
      <CaptureToast />
    </>
  );
}
