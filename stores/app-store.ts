import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppState, AppLanguage, JdAnalysis, JobApplicationRecord } from "@/types";

interface AppStore extends AppState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  jdLanguage: AppLanguage | null; // auto-detected from JD text
  setAnalysis: (analysis: JdAnalysis | null) => void;
  setCvHtml: (html: string | null) => void;
  setCoverLetter: (text: string | null) => void;
  setLanguage: (lang: AppLanguage) => void;
  setJdLanguage: (lang: AppLanguage) => void;
  resetAnalysis: () => void;
  addApplicationRecord: (record: JobApplicationRecord) => void;
  removeApplicationRecord: (id: string) => void;
  clearRecords: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentAnalysis: null,
      currentCvHtml: null,
      currentCoverLetter: null,
      language: "zh-TW",
      jdLanguage: null,
      applicationRecords: [],
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      setCvHtml: (html) => set({ currentCvHtml: html }),
      setCoverLetter: (text) => set({ currentCoverLetter: text }),
      setLanguage: (language) => set({ language }),
      setJdLanguage: (jdLanguage) => set({ jdLanguage }),
      resetAnalysis: () =>
        set({
          currentAnalysis: null,
          currentCvHtml: null,
          currentCoverLetter: null,
          jdLanguage: null,
        }),

      addApplicationRecord: (record) =>
        set((s) => ({
          applicationRecords: [...s.applicationRecords, record],
        })),
      removeApplicationRecord: (id) =>
        set((s) => ({
          applicationRecords: s.applicationRecords.filter((r) => r.id !== id),
        })),
      clearRecords: () => set({ applicationRecords: [] }),
    }),
    {
      name: "job-app-store",
      partialize: (state) => ({
        applicationRecords: state.applicationRecords,
        language: state.language,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
