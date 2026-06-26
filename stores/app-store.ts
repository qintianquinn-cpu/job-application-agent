import { create } from "zustand";
import type { AppState, AppLanguage, JdAnalysis } from "@/types";

interface AppStore extends AppState {
  jdLanguage: AppLanguage | null; // auto-detected from JD text
  setAnalysis: (analysis: JdAnalysis | null) => void;
  setCvHtml: (html: string | null) => void;
  setCoverLetter: (text: string | null) => void;
  setLanguage: (lang: AppLanguage) => void;
  setJdLanguage: (lang: AppLanguage) => void;
  resetAnalysis: () => void;
}

export const useAppStore = create<AppStore>()((set) => ({
  currentAnalysis: null,
  currentCvHtml: null,
  currentCoverLetter: null,
  language: "zh-TW",
  jdLanguage: null,

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
}));
