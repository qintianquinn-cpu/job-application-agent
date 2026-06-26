import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types";

const emptyProfile: UserProfile = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedIn: "",
  website: "",
  summary: "",
  education: [],
  workExperience: [],
  skills: [],
  certifications: [],
  languages: [],
};

interface ProfileStore {
  profile: UserProfile;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  updateField: <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => void;
  addEducation: (edu: UserProfile["education"][0]) => void;
  removeEducation: (id: string) => void;
  updateEducation: (id: string, edu: Partial<UserProfile["education"][0]>) => void;
  addWorkExperience: (exp: UserProfile["workExperience"][0]) => void;
  removeWorkExperience: (id: string) => void;
  updateWorkExperience: (id: string, exp: Partial<UserProfile["workExperience"][0]>) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addCertification: (cert: UserProfile["certifications"][0]) => void;
  removeCertification: (id: string) => void;
  addLanguage: (lang: UserProfile["languages"][0]) => void;
  removeLanguage: (lang: string) => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: emptyProfile,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      updateField: (key, value) =>
        set((s) => ({ profile: { ...s.profile, [key]: value } })),

      addEducation: (edu) =>
        set((s) => ({
          profile: { ...s.profile, education: [...s.profile.education, edu] },
        })),

      removeEducation: (id) =>
        set((s) => ({
          profile: {
            ...s.profile,
            education: s.profile.education.filter((e) => e.id !== id),
          },
        })),

      updateEducation: (id, edu) =>
        set((s) => ({
          profile: {
            ...s.profile,
            education: s.profile.education.map((e) =>
              e.id === id ? { ...e, ...edu } : e
            ),
          },
        })),

      addWorkExperience: (exp) =>
        set((s) => ({
          profile: {
            ...s.profile,
            workExperience: [...s.profile.workExperience, exp],
          },
        })),

      removeWorkExperience: (id) =>
        set((s) => ({
          profile: {
            ...s.profile,
            workExperience: s.profile.workExperience.filter((e) => e.id !== id),
          },
        })),

      updateWorkExperience: (id, exp) =>
        set((s) => ({
          profile: {
            ...s.profile,
            workExperience: s.profile.workExperience.map((e) =>
              e.id === id ? { ...e, ...exp } : e
            ),
          },
        })),

      addSkill: (skill) =>
        set((s) => ({
          profile: {
            ...s.profile,
            skills: [...s.profile.skills, skill],
          },
        })),

      removeSkill: (skill) =>
        set((s) => ({
          profile: {
            ...s.profile,
            skills: s.profile.skills.filter((sk) => sk !== skill),
          },
        })),

      addCertification: (cert) =>
        set((s) => ({
          profile: {
            ...s.profile,
            certifications: [...s.profile.certifications, cert],
          },
        })),

      removeCertification: (id) =>
        set((s) => ({
          profile: {
            ...s.profile,
            certifications: s.profile.certifications.filter((c) => c.id !== id),
          },
        })),

      addLanguage: (lang) =>
        set((s) => ({
          profile: {
            ...s.profile,
            languages: [...s.profile.languages, lang],
          },
        })),

      removeLanguage: (language) =>
        set((s) => ({
          profile: {
            ...s.profile,
            languages: s.profile.languages.filter((l) => l.language !== language),
          },
        })),

      resetProfile: () => set({ profile: emptyProfile }),
    }),
    {
      name: "job-app-profile",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
