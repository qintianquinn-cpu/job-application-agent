import { generateText, Output } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { z } from "zod";
import { NextResponse } from "next/server";

const refineSchema = z.object({
  refinedContent: z.string(),
  explanation: z.string(),
});

export async function POST(req: Request) {
  try {
    const { currentContent, contentType, userRequest, language, profile } =
      await req.json();

    if (!currentContent || !userRequest) {
      return NextResponse.json(
        { error: "Missing currentContent or userRequest" },
        { status: 400 }
      );
    }

    const lang = language === "zh-TW" ? "Traditional Chinese" : "English";
    const isCV = contentType === "cv";
    const contentLabel = isCV ? "CV HTML" : "cover letter";
    const formatNote = isCV
      ? "The content is HTML. Return ONLY the complete revised HTML — do not add markdown wrappers or explanations outside the HTML element."
      : "Return ONLY the revised cover letter text — no markdown wrappers, no extra commentary.";

    const { output } = await generateText({
      model: deepseek("deepseek-chat"),
      output: Output.object({ schema: refineSchema }),
      system: `You are a professional CV/resume and cover letter editor.
Your task is to refine content based on specific user feedback.

Output language: ${lang}

CRITICAL RULES:
- ${formatNote}
- Make ONLY the changes the user requested — preserve everything else exactly as-is
- If the user asks to rewrite a specific point, only change that point
- If the user asks to add something, weave it in naturally
- If the user asks to shorten, remove the least impactful content
- Maintain the same HTML structure and formatting
- In "explanation", note what you changed in 1-2 sentences`,
      prompt: `Current ${contentLabel}:

=== ${contentType.toUpperCase()} CONTENT ===
${currentContent.slice(0, 10000)}

=== CANDIDATE PROFILE (for context) ===
${JSON.stringify(profile, null, 2).slice(0, 3000)}

=== USER'S REFINEMENT REQUEST ===
${userRequest}

Refine the ${contentLabel} based on the user's request. Only change what they asked.`,
      temperature: 0.3,
    });

    return NextResponse.json({
      refinedContent: output.refinedContent,
      explanation: output.explanation || "",
    });
  } catch (err) {
    console.error("Refine error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refinement failed" },
      { status: 500 }
    );
  }
}
