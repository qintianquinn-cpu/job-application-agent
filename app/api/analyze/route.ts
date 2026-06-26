import { generateText, Output } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { z } from "zod";
import { NextResponse } from "next/server";

const requirementSchema = z.object({
  requirementType: z.enum([
    "hard-skills",
    "soft-skills",
    "competencies-traits",
    "preferred-skills",
  ]),
  category: z.enum(["must-have", "nice-to-have", "preferred"]),
  description: z.string(),
  matched: z.boolean(),
  userEvidence: z.string().optional(),
});

const analysisSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  summary: z.string(),
  requirements: z.array(requirementSchema),
  matchScore: z.number().min(0).max(100),
  matchBreakdown: z.object({
    skills: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    education: z.number().min(0).max(100),
    overall: z.number().min(0).max(100),
  }),
  suggestedHighlights: z.array(z.string()),
  missingGaps: z.array(z.string()),
});

const TYPE_DEFINITIONS = `
Requirement Type (requirementType) — classify EVERY requirement into ONE of these four:

1. "hard-skills" (硬技能/專業基本功):
   Concrete, teachable technical skills required for the job.
   Examples: Python programming, curriculum design, data analysis, classroom management, Scratch, robotics, lesson planning, assessment design, video editing, LMS platforms, subject-matter knowledge (math, science, etc.)

2. "soft-skills" (軟技能/職場通用力):
   Interpersonal and communication abilities needed in any workplace.
   Examples: communication skills, teamwork, collaboration, stakeholder management, parent communication, presentation skills, mentoring, conflict resolution, adaptability

3. "competencies-traits" (底層潛能與特質):
   Personal qualities, mindset, values alignment, inner drive — not "teachable" but observable.
   Examples: passion for education, creativity, patience, growth mindset, cultural sensitivity, attention to detail, proactive attitude, leadership potential, genuine interest in STEM/AI, curiosity

4. "preferred-skills" (優先技能/加分項):
   Nice-to-have qualifications explicitly listed as "preferred", "bonus", "advantage", or "a plus" in the JD.
   Examples: "Master's degree preferred", "Cantonese is a plus", "experience with Arduino preferred", "published curriculum is an advantage"
`;

export async function POST(req: Request) {
  try {
    const { jdText, profile, language } = await req.json();

    if (!jdText || !profile) {
      return NextResponse.json(
        { error: "Missing jdText or profile" },
        { status: 400 }
      );
    }

    const lang = language === "zh-TW" ? "Traditional Chinese" : "English";

    const { output } = await generateText({
      model: deepseek("deepseek-chat"),
      output: Output.object({ schema: analysisSchema }),
      system: `You are a professional career coach and recruiter with 20 years of experience.
Your task is to analyze job descriptions against a candidate's profile and provide a detailed, honest match assessment.

Output language: ${lang}

---
${TYPE_DEFINITIONS}
---

CRITICAL MATCHING RULES — follow these strictly:

1. SEMANTIC MATCHING, NOT KEYWORD MATCHING: Do NOT match by keyword alone. Understand the MEANING behind each requirement and infer whether the candidate's experience COVERS the capability. Examples:
   - "Project-based learning / PBL frameworks" ← "Designed and delivered workshops using hands-on projects in schools" = MATCH
   - "Teaching certification / state teaching qualification" ← "National Teacher Qualification Certificate" = MATCH
   - "Block-based coding / visual programming" ← "Scratch, MakeCode, micro:bit" = MATCH
   - "Experience working with schools" ← "Delivered on-site support to partner schools" = MATCH
   - "Curriculum development" ← "Edited nationally distributed textbook, designed lesson plans" = MATCH

2. INFER CAPABILITIES FROM CONTEXT: Look at the candidate's work descriptions holistically. If they "designed and delivered AI workshops at partner schools using project-based activities", they have BOTH AI teaching experience AND PBL experience AND school collaboration experience — even if "PBL" is not explicitly mentioned as a keyword in the profile.

3. When a match exists, provide SPECIFIC evidence from the profile. When it DOESN'T exist, honestly mark it as unmatched — but don't miss indirect matches.

4. For each requirement, ask yourself: "Does this candidate have the FUNCTIONAL capability this requirement is asking for?" rather than "Do the exact same words appear in the profile?"

5. Be generous with INFERENCE in favor of the candidate when the evidence supports it, but do not fabricate evidence that doesn't exist.

SCORING RULES for matchScore:
- matchScore is your holistic 0-100 judgment of overall fit, considering ALL factors
- Start from 50, then adjust up/down based on evidence
- For every "must-have" requirement that is matched, add points proportionally
- For every "must-have" requirement that is NOT matched, subtract points heavily
- "nice-to-have" and "preferred" matches add smaller bonuses
- If 80%+ of must-haves are matched, score should be at least 70
- If there are more than 2 unmatched must-haves, score should be below 60
- CALIBRATE: 90-100 = exceptional fit; 70-89 = strong fit; 50-69 = partial fit; 30-49 = weak fit; <30 = poor fit

matchBreakdown:
- skills: how well the candidate's HARD skills match (0-100)
- experience: how well the candidate's work history aligns with the role's level and scope (0-100)
- education: how well the candidate's degrees/certs match the role's educational requirements (0-100)
- overall: same as matchScore

Other rules:
- Extract ALL requirements from the JD
- Classify every requirement into exactly one requirementType
- Give an honest match score, not an inflated one
- Highlight specific experiences/skills the candidate should emphasize
- List genuine gaps the candidate should address`,
      prompt: `Analyze this job description against the candidate's profile:

=== JOB DESCRIPTION ===
${jdText.slice(0, 5000)}

=== CANDIDATE PROFILE ===
${JSON.stringify(profile, null, 2)}

IMPORTANT:
- Classify each requirement into exactly one requirementType: hard-skills, soft-skills, competencies-traits, or preferred-skills.
- Do semantic matching, not keyword matching. Deeply analyze whether the candidate's experience FUNCTIONALLY covers each requirement.
- Provide specific evidence when matched.
- Carefully calibrate your matchScore using the scoring rules.

Provide a thorough analysis including match score, requirement-by-requirement assessment (with requirementType), suggested highlights, and missing gaps.`,
      temperature: 0.2,
    });

    // Calculate algorithmic match rate: matched requirements / total * 100
    const totalReqs = output.requirements.length;
    const matchedReqs = output.requirements.filter((r) => r.matched).length;
    const matchRate =
      totalReqs > 0 ? Math.round((matchedReqs / totalReqs) * 100) : 0;

    // Weighted: must-have matches matter more
    const mustHaveReqs = output.requirements.filter(
      (r) => r.category === "must-have"
    );
    const matchedMustHaves = mustHaveReqs.filter((r) => r.matched).length;
    const mustHaveRate =
      mustHaveReqs.length > 0
        ? Math.round((matchedMustHaves / mustHaveReqs.length) * 100)
        : 100;

    return NextResponse.json({
      analysis: {
        ...output,
        matchRate,
        mustHaveRate,
        totalRequirements: totalReqs,
        matchedRequirements: matchedReqs,
        totalMustHaves: mustHaveReqs.length,
        matchedMustHaves,
      },
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
