"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/profile-store";
import { useAppStore } from "@/stores/app-store";
import { analyzeJd } from "@/lib/ai-client";
import { detectJdLanguage } from "@/lib/detect-language";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { REQUIREMENT_TYPES, type RequirementType } from "@/types";

const typeColors: Record<RequirementType, string> = {
  "hard-skills": "border-l-blue-500",
  "soft-skills": "border-l-green-500",
  "competencies-traits": "border-l-purple-500",
  "preferred-skills": "border-l-amber-500",
};

const typeBadgeColors: Record<RequirementType, string> = {
  "hard-skills": "bg-blue-100 text-blue-700",
  "soft-skills": "bg-green-100 text-green-700",
  "competencies-traits": "bg-purple-100 text-purple-700",
  "preferred-skills": "bg-amber-100 text-amber-700",
};

export default function JdAnalysisPage() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const { _hasHydrated: profileHydrated } = useProfileStore();
  const { currentAnalysis, setAnalysis, setCvHtml, setCoverLetter, setJdLanguage, language, addApplicationRecord, _hasHydrated: appHydrated } = useAppStore();

  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = (en: string, zh: string) => (language === "zh-TW" ? zh : en);

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    setLoading(true); setError("");
    try {
      const jdLang = detectJdLanguage(jdText);
      const result = await analyzeJd(jdText, profile, jdLang);
      setAnalysis(result);
      setJdLanguage(jdLang);
      setCvHtml(null);
      setCoverLetter(null);
      // Auto-save application record
      addApplicationRecord({
        id: crypto.randomUUID(),
        jobTitle: result.jobTitle,
        company: result.company,
        matchScore: result.matchScore,
        matchBreakdown: result.matchBreakdown,
        suggestions: result.suggestedHighlights,
        missingGaps: result.missingGaps,
        appliedAt: new Date().toISOString(),
        jdSummary: jdText.slice(0, 300),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (!profileHydrated || !appHydrated) return <div className="py-20 text-center text-gray-400">Loading...</div>;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return t("Exceptional Fit", "極佳匹配");
    if (score >= 70) return t("Strong Fit", "高度匹配");
    if (score >= 50) return t("Partial Fit", "部分匹配");
    return t("Weak Fit", "匹配較低");
  };

  // Group requirements by type
  const groupedReqs = REQUIREMENT_TYPES.map((rt) => ({
    ...rt,
    items: currentAnalysis?.requirements.filter((r) => r.requirementType === rt.key) || [],
  })).filter((g) => g.items.length > 0);

  // Cast the extended fields from API response
  const analysis = currentAnalysis as (typeof currentAnalysis & {
    matchRate?: number;
    mustHaveRate?: number;
    totalRequirements?: number;
    matchedRequirements?: number;
    totalMustHaves?: number;
    matchedMustHaves?: number;
  }) | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("Analyze Job Description", "Job Description 分析")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("Paste a job description below. AI will analyze how well your profile matches.", "貼上 Job Description，AI 將分析你與崗位的匹配度。")}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Label className="mb-2 block">{t("Job Description (JD)", "Job Description（JD）")}</Label>
          <Textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder={t("Paste the full job description here...", "在此貼上完整 JD...")}
            rows={8}
            className="mb-4"
          />
          <div className="flex gap-3">
            <Button onClick={handleAnalyze} disabled={loading || !jdText.trim()}>
              {loading ? t("Analyzing...", "分析中...") : t("Analyze JD", "開始分析")}
            </Button>
            {currentAnalysis && (
              <Button variant="outline" onClick={() => { setAnalysis(null); setJdText(""); setJdLanguage("en"); }}>
                {t("Reset", "重新分析")}
              </Button>
            )}
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
            </div>
            <p className="text-gray-400 mt-6 text-sm">{t("AI is analyzing your match...", "AI 正在分析匹配度...")}</p>
          </CardContent>
        </Card>
      )}

      {currentAnalysis && (
        <>
          {/* ── Match Score Card ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("Match Results", "匹配結果")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 flex-wrap">
                {/* Big score */}
                <div className="text-center shrink-0">
                  <div className={`text-5xl font-bold ${getScoreColor(analysis?.matchScore ?? 0)}`}>
                    {analysis?.matchScore ?? 0}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{getScoreLabel(analysis?.matchScore ?? 0)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t("AI holistic score", "AI 綜合評分")}</p>
                </div>

                {/* Score explanation */}
                <div className="flex-1 min-w-[250px] space-y-2 text-xs text-gray-500">
                  {analysis?.matchRate !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>{t("Requirement Match Rate", "要求匹配率")}</span>
                      <span className="font-semibold">
                        {analysis?.matchedRequirements}/{analysis?.totalRequirements} = {analysis?.matchRate}%
                      </span>
                    </div>
                  )}
                  {analysis?.mustHaveRate !== undefined && (analysis?.totalMustHaves ?? 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <span>{t("Must-Have Requirements Met", "必須要求滿足率")}</span>
                      <span className="font-semibold">
                        {analysis?.matchedMustHaves}/{analysis?.totalMustHaves} = {analysis?.mustHaveRate}%
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    {t(
                      "How scores work: The AI score is a holistic judgment by the model. Requirement match rate is calculated from how many JD requirements your profile covers (including inferred matches).",
                      "評分說明：AI 綜合評分是模型對整體匹配度的判斷。要求匹配率則是根據你的檔案覆蓋了多少條 JD 要求計算得出（包含語義推論匹配）。"
                    )}
                  </p>
                </div>
              </div>

              {/* Breakdown bars */}
              <div className="grid grid-cols-3 gap-4 text-center">
                {(["skills", "experience", "education"] as const).map((k) => (
                  <div key={k}>
                    <p className="text-xs text-gray-500 mb-1">
                      {t(
                        k[0].toUpperCase() + k.slice(1),
                        k === "skills" ? "技能" : k === "experience" ? "經驗" : "學歷"
                      )}
                    </p>
                    <Progress value={currentAnalysis.matchBreakdown[k]} className="h-2 mb-1" />
                    <span className="text-xs font-semibold">{currentAnalysis.matchBreakdown[k]}%</span>
                  </div>
                ))}
              </div>

              {/* Job info */}
              <div>
                <p className="text-sm font-semibold">{currentAnalysis.jobTitle}{currentAnalysis.company ? ` @ ${currentAnalysis.company}` : ""}</p>
                <p className="text-xs text-gray-500 mt-1">{currentAnalysis.summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* ── Requirements by Category ── */}
          {groupedReqs.map((group) => {
            const matchedInGroup = group.items.filter((r) => r.matched).length;
            return (
              <Card key={group.key}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${typeBadgeColors[group.key]}`}>
                          {language === "zh-TW" ? group.labelZh : group.label}
                        </Badge>
                        <CardTitle className="text-sm">{language === "zh-TW" ? group.labelZh : group.label}</CardTitle>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {language === "zh-TW" ? group.descriptionZh : group.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {matchedInGroup}/{group.items.length} {t("matched", "匹配")}
                    </Badge>
                  </div>
                  {/* Mini progress bar for this category */}
                  <Progress
                    value={group.items.length > 0 ? (matchedInGroup / group.items.length) * 100 : 0}
                    className="h-1.5 mt-2"
                  />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.items.map((req, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 border-l-4 pl-3 py-2 rounded-r ${typeColors[group.key]} ${req.matched ? "bg-green-50/50" : "bg-red-50/30"}`}
                      >
                        <span className={`mt-0.5 text-base shrink-0 ${req.matched ? "text-green-500" : "text-red-400"}`}>
                          {req.matched ? "✓" : "✗"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm">{req.description}</span>
                          {req.matched && req.userEvidence && (
                            <p className="text-xs text-green-700 mt-1 bg-green-50 rounded px-2 py-1">
                              💡 {req.userEvidence}
                            </p>
                          )}
                          {!req.matched && (
                            <p className="text-xs text-red-500 mt-0.5">{t("Not found in profile", "檔案中未找到對應")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Highlights + Gaps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm text-green-700">{t("Suggested Highlights", "建議強調")}</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {currentAnalysis.suggestedHighlights.map((h, i) => (
                    <li key={i} className="text-xs text-gray-600">{h}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm text-red-600">{t("Missing Gaps", "待補強")}</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {currentAnalysis.missingGaps.map((g, i) => (
                    <li key={i} className="text-xs text-gray-600">{g}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Separator />
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => router.push("/cv-generator")}>{t("Generate CV →", "生成履歷 →")}</Button>
            <Button variant="outline" onClick={() => router.push("/cover-letter")}>{t("Generate Cover Letter →", "生成求職信 →")}</Button>
            <Button variant="secondary" onClick={() => router.push("/application-records")}>{t("View Records →", "查看投遞記錄 →")}</Button>
          </div>
        </>
      )}
    </div>
  );
}
