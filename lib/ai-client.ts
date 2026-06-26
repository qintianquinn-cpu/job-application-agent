import type { UserProfile, JdAnalysis, AppLanguage } from "@/types";

export async function analyzeJd(
  jdText: string,
  profile: UserProfile,
  language: AppLanguage
): Promise<JdAnalysis> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jdText, profile, language }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.analysis;
}

export async function generateCv(
  profile: UserProfile,
  analysis: JdAnalysis,
  language: AppLanguage
): Promise<string> {
  const res = await fetch("/api/generate-cv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, analysis, language }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.cvHtml;
}

export async function generateCoverLetter(
  profile: UserProfile,
  analysis: JdAnalysis,
  language: AppLanguage,
  jobTitle: string,
  company: string
): Promise<string> {
  const res = await fetch("/api/generate-cover-letter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, analysis, language, jobTitle, company }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.coverLetter;
}
