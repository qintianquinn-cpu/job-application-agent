import { generateText, Output } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { z } from "zod";
import { NextResponse } from "next/server";

const clSchema = z.object({
  coverLetter: z.string(),
});

export async function POST(req: Request) {
  try {
    const { profile, analysis, language, jobTitle, company } =
      await req.json();

    if (!profile || !analysis) {
      return NextResponse.json(
        { error: "Missing profile or analysis" },
        { status: 400 }
      );
    }

    const lang = language === "zh-TW" ? "Traditional Chinese" : "English";
    const isChinese = language === "zh-TW";

    const { output } = await generateText({
      model: deepseek("deepseek-chat"),
      output: Output.object({ schema: clSchema }),
      system: `You are a professional career coach who writes compelling, authentic cover letters.
Output language: ${lang}

Rules:
- Write a professional cover letter in standard business letter format
- Address the hiring team or hiring manager (use "Dear Hiring Team" if specific name unknown)
- Opening: Express interest in the role and the company
- Body (2-3 paragraphs): Connect the candidate's specific experiences to the JD requirements
  - Use the "suggestedHighlights" from the analysis
  - Address the "missingGaps" honestly but constructively (turn weaknesses into eagerness to learn, if applicable)
- Closing: Call to action, thank the reader
- Keep it concise (250-350 words)
- Make it sound HUMAN, not like AI-generated text — vary sentence structure, use natural phrasing
- ${isChinese ? "Use Traditional Chinese (繁體中文) for the entire letter" : "Use English for the entire letter"}
- Include a proper sign-off with the candidate's full name`,
      prompt: `Write a tailored cover letter for this candidate:

=== JOB ===
Title: ${jobTitle || analysis.jobTitle}
Company: ${company || analysis.company}

=== JD ANALYSIS ===
Match Score: ${analysis.matchScore}%
Key Requirements: ${analysis.requirements.filter((r: { matched: boolean }) => r.matched).map((r: { description: string }) => r.description).join(", ")}
Suggested Highlights: ${analysis.suggestedHighlights.join("; ")}
Missing Gaps: ${analysis.missingGaps.join("; ")}

=== CANDIDATE PROFILE ===
${JSON.stringify(profile, null, 2)}

Make it sound genuine and specific to this candidate's background. Don't use generic phrases like "I am writing to express my interest." Be more direct and personal.`,
      temperature: 0.5,
    });

    return NextResponse.json({ coverLetter: output.coverLetter });
  } catch (err) {
    console.error("Cover letter error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cover letter generation failed" },
      { status: 500 }
    );
  }
}
