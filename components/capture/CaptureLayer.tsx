"use client";

import { CaptureButton } from "./CaptureButton";
import { CaptureModal } from "./CaptureModal";
import { CaptureToast } from "./CaptureToast";

export function CaptureLayer() {
  return (
    <>
      <CaptureButton />
      <CaptureModal />
      <CaptureToast />
    </>
  );
}
