import { create } from 'zustand';

/**
 * Example Zustand store — the template convention for CLIENT state
 * (server state belongs in TanStack Query, never here).
 *
 * Replace `onboardingDone` with your app's real UI state. Keep stores small
 * and per-domain (`use-cart-store.ts`, `use-filters-store.ts`, ...) rather
 * than one global blob.
 */
type AppState = {
  onboardingDone: boolean;
  setOnboardingDone: (done: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  onboardingDone: false,
  setOnboardingDone: (done) => set({ onboardingDone: done }),
}));
