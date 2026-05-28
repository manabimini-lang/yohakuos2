import { create } from 'zustand';

interface CaptureState {
  isOpen: boolean;
  toastMessage: string | null;
  openCapture: () => void;
  closeCapture: () => void;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  isOpen: false,
  toastMessage: null,
  openCapture: () => set({ isOpen: true }),
  closeCapture: () => set({ isOpen: false }),
  showToast: (message) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    set({ toastMessage: message });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 2600);
  },
  hideToast: () => set({ toastMessage: null }),
}));

