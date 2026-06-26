import { generateText, Output } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { z } from "zod";
import { NextResponse } from "next/server";

const parsedProfileSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedIn: z.string(),
  website: z.string(),
  summary: z.string(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  })),
  workExperience: z.array(z.object({
    company: z.string(),
    position: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    current: z.boolean(),
    description: z.string(),
    achievements: z.array(z.string()),
  })),
  skills: z.array(z.string()),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string(),
  })),
  languages: z.array(z.object({
    language: z.string(),
    proficiency: z.string(),
  })),
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const textContent = formData.get("text") as string | null;

    const resumeText = textContent?.trim();

    if (!resumeText || resumeText.length < 20) {
      return NextResponse.json(
        { error: "Please paste your CV content (at least 20 characters)." },
        { status: 400 }
      );
    }

    const { output } = await generateText({
      model: deepseek("deepseek-chat"),
      output: Output.object({ schema: parsedProfileSchema }),
      system: `You are a resume parser. Extract structured information from the resume text.
Rules:
- Extract ALL information accurately — do not invent or guess
- If a field is not found, leave it as an empty string or empty array
- For dates, use "YYYY-MM" or "YYYY" format
- For the summary, extract or synthesize a 2-3 sentence professional summary
- For work experience achievements, split them into separate array items
- Include ALL skills mentioned
- Recognize common certifications and qualifications
- Detect languages mentioned`,
      prompt: `Extract all structured profile information from this resume:\n\n${resumeText.slice(0, 8000)}`,
      temperature: 0.1,
    });

    return NextResponse.json({ profile: output });
  } catch (err) {
    console.error("Resume parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Resume parsing failed" },
      { status: 500 }
    );
  }
}
