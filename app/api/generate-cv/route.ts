import { generateText, Output } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { z } from "zod";
import { NextResponse } from "next/server";

const cvSchema = z.object({
  cvHtml: z.string(),
});

export async function POST(req: Request) {
  try {
    const { profile, analysis, language } = await req.json();

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
      output: Output.object({ schema: cvSchema }),
      system: `You are a professional CV/resume writer who specializes in creating tailored, ATS-friendly CVs.
Output language: ${lang}

Rules:
- Generate a COMPLETE, semantic HTML CV.
- IMPORTANT: Wrap the ENTIRE CV content in <div class="cv-page">...</div>. Do NOT use <body> or <html> tags — use .cv-page as the outermost wrapper. The CSS padding/margins rely on this class.
- SECTION ORDER: Header → Education → Certifications/Qualifications → Professional Experience → Skills. Education MUST come before Professional Experience.

- Contact line format: <p class="contact"><strong>Email:</strong> ... | <strong>Phone:</strong> ... | <strong>Location:</strong> ...<br><strong>LinkedIn:</strong> ... | <strong>Portfolio:</strong> ...</p>

- Professional Experience entry HTML structure (use EXACTLY these classes):
  <div class="entry">
    <div class="entry-header">
      <span class="entry-title">Position Title</span>
      <span class="entry-date">Start – End</span>
    </div>
    <div class="entry-sub">Company Name</div>
    <ul>
      <li><strong><span class="tag">Competency Tag</span>:</strong> Achievement description.</li>
    </ul>
  </div>
  The .entry-title is the job position (rendered bold + 14px by CSS).
  The .entry-sub is the company name (rendered italic by CSS).
  The .entry-date is the date range (rendered italic by CSS).

- Education entry HTML structure:
  <div class="entry">
    <div class="entry-header">
      <span class="entry-title">Degree, Field</span>
      <span class="entry-date">Start – End</span>
    </div>
    <div class="entry-sub">Institution</div>
  </div>

- CRITICAL: Reorder work experience — put the MOST RELEVANT roles first based on JD analysis.
- For each work entry, list 2-3 bullet points with bold competency tags.
- EVERY bullet MUST start with <strong><span class="tag">Short Tag</span>:</strong> followed by the achievement. The tag should be a 2-5 word capability label matching a JD requirement. Pick the most RELEVANT tag for each bullet. Examples:
  * <strong><span class="tag">AI Curriculum Design</span>:</strong> Co-designed and delivered AI and robotics lessons across multiple partner schools.
  * <strong><span class="tag">Stakeholder Collaboration</span>:</strong> Partnered with 5 schools to adapt STEM content for diverse learner needs.
- Use the "suggestedHighlights" from the analysis to guide tag selection.
- Skills section: group related skills under BOLD sub-headings using <strong> labels (e.g. <strong>Programming:</strong> Python, Scratch; <strong>AI & EdTech:</strong> ChatGPT, Tinkercad). Use free-form paragraph text, NOT a table.
- Keep it concise — aim for 1 page.
- Use clean semantic HTML: <section>, <h2>, <ul>, <li>, <strong>, <span>, <p>, <div>.
- NO inline styles, NO color attributes — I will add CSS separately.
- ${isChinese ? "Use Traditional Chinese (繁體中文) for all section headers and content" : "Use English for all content"}
- Important: ONLY output the CV HTML, no explanations or markdown wrappers`,
      prompt: `Create a tailored CV for this candidate based on the JD analysis:

=== CANDIDATE PROFILE ===
${JSON.stringify(profile, null, 2)}

=== JD ANALYSIS ===
- Job Title: ${analysis.jobTitle}
- Company: ${analysis.company}
- Match Score: ${analysis.matchScore}%
- Key Requirements: ${analysis.requirements.filter((r: { matched: boolean }) => r.matched).map((r: { description: string }) => r.description).join(", ")}
- Suggested Highlights: ${analysis.suggestedHighlights.join("; ")}
- Missing Gaps: ${analysis.missingGaps.join("; ")}

Section order: Header → Education → Certs → Professional Experience → Skills.
Reorder work experience so the most relevant roles are listed first.
Use the EXACT HTML class structure: .entry-title for position titles, .entry-sub for company/institution names, .entry-date for dates.`,
      temperature: 0.3,
    });

    return NextResponse.json({ cvHtml: output.cvHtml });
  } catch (err) {
    console.error("CV generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "CV generation failed" },
      { status: 500 }
    );
  }
}
