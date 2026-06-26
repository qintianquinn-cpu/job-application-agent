export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface Language {
  language: string;
  proficiency: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  website?: string;
  summary: string;
  education: Education[];
  workExperience: WorkExperience[];
  skills: string[];
  certifications: Certification[];
  languages: Language[];
}

// JD requirement type categories
export type RequirementType = "hard-skills" | "soft-skills" | "competencies-traits" | "preferred-skills";

export interface RequirementTypeLabel {
  key: RequirementType;
  label: string;
  labelZh: string;
  description: string;
  descriptionZh: string;
}

export const REQUIREMENT_TYPES: RequirementTypeLabel[] = [
  {
    key: "hard-skills",
    label: "Hard Skills",
    labelZh: "硬技能",
    description: "Job-specific technical abilities and professional fundamentals",
    descriptionZh: "崗位所需的專業基本功與技術能力",
  },
  {
    key: "soft-skills",
    label: "Soft Skills",
    labelZh: "軟技能",
    description: "Workplace communication, collaboration, and interpersonal abilities",
    descriptionZh: "職場通用力與人際協作能力",
  },
  {
    key: "competencies-traits",
    label: "Competencies & Traits",
    labelZh: "底層潛能與特質",
    description: "Personal qualities, mindset, and cultural fit",
    descriptionZh: "個性化契合度、思維模式與內在驅動力",
  },
  {
    key: "preferred-skills",
    label: "Preferred Skills",
    labelZh: "優先技能",
    description: "Nice-to-have qualifications that give an edge",
    descriptionZh: "加分項技能與額外優勢",
  },
];

export interface JdRequirement {
  requirementType: RequirementType;
  category: "must-have" | "nice-to-have" | "preferred";
  description: string;
  matched: boolean;
  userEvidence?: string;
}

export interface JdAnalysis {
  jobTitle: string;
  company: string;
  summary: string;
  requirements: JdRequirement[];
  matchScore: number;
  matchRate: number; // calculated: matched requirements / total * 100
  matchBreakdown: {
    skills: number;
    experience: number;
    education: number;
    overall: number;
  };
  suggestedHighlights: string[];
  missingGaps: string[];
}

// Extended response from /api/analyze (includes calculated fields)
export interface JdAnalysisResponse extends JdAnalysis {
  matchRate: number;
  mustHaveRate: number;
  totalRequirements: number;
  matchedRequirements: number;
  totalMustHaves: number;
  matchedMustHaves: number;
}

export type AppLanguage = "en" | "zh-TW";

export interface AppState {
  currentAnalysis: JdAnalysis | null;
  currentCvHtml: string | null;
  currentCoverLetter: string | null;
  language: AppLanguage;
}
