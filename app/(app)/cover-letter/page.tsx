"use client";

import { useState } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { useAppStore } from "@/stores/app-store";
import { generateCoverLetter } from "@/lib/ai-client";
import { exportToPdf } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import RefineChat from "@/components/shared/RefineChat";

export default function CoverLetterPage() {
  const profile = useProfileStore((s) => s.profile);
  const { _hasHydrated } = useProfileStore();
  const { currentAnalysis, currentCoverLetter, setCoverLetter, jdLanguage, language } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [edited, setEdited] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const t = (en: string, zh: string) => (language === "zh-TW" ? zh : en);

  const handleGenerate = async () => {
    if (!currentAnalysis) return;
    setLoading(true); setError("");
    try {
      // Use JD-detected language for cover letter; fall back to UI language
      const outputLang = jdLanguage || language;
      const text = await generateCoverLetter(
        profile,
        currentAnalysis,
        outputLang,
        currentAnalysis.jobTitle,
        currentAnalysis.company
      );
      setCoverLetter(text);
      setEdited(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cover letter generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const text = edited || currentCoverLetter || "";
    await navigator.clipboard.writeText(text);
  };

  const handleExport = async () => {
    try {
      await exportToPdf("cl-preview", `Cover_Letter_${currentAnalysis?.company || currentAnalysis?.jobTitle || "Tailored"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  };

  if (!_hasHydrated) return <div className="py-20 text-center text-gray-400">Loading...</div>;

  if (!currentAnalysis) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-gray-400 mb-4">{t("No JD analysis yet.", "尚未分析 JD。")}</p>
          <a href="/jd-analysis" className="text-blue-600 text-sm underline">{t("Analyze a JD first →", "先分析 JD →")}</a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("Cover Letter", "求職信")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t(`Based on: ${currentAnalysis.jobTitle}`, `基於：${currentAnalysis.jobTitle}`)}
          </p>
        </div>
        <div className="flex gap-2">
          {!currentCoverLetter && (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? t("Writing...", "撰寫中...") : t("Generate Cover Letter", "生成求職信")}
            </Button>
          )}
          {currentCoverLetter && (
            <>
              <Button variant="outline" onClick={() => { setCoverLetter(null); setEdited(""); setChatOpen(false); }}>
                {t("Regenerate", "重新生成")}
              </Button>
              <Button variant="outline" onClick={handleCopy}>{t("Copy", "複製")}</Button>
              <Button onClick={handleExport}>{t("Export PDF", "匯出 PDF")}</Button>
              <Button variant="secondary" onClick={() => setChatOpen(!chatOpen)}>
                💬 {chatOpen ? t("Hide Chat", "隱藏對話") : t("AI Refine", "AI 修改")}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
            <p className="text-gray-400 mt-6 text-sm">{t("AI is writing your cover letter...", "AI 正在撰寫你的求職信...")}</p>
          </CardContent>
        </Card>
      )}

      {(currentCoverLetter || edited) && (
        <div className={`grid gap-4 items-start ${chatOpen ? "grid-cols-1 xl:grid-cols-[1fr_380px]" : "grid-cols-1"}`}>
          {/* Preview + manual edit */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("Edit before exporting", "匯出前可編輯")}</CardTitle></CardHeader>
            <CardContent>
              {/* A4 wrapper */}
              <div
                id="cl-preview"
                className="bg-white border shadow-md mx-auto"
                style={{
                  width: "100%",
                  maxWidth: "210mm",
                  minHeight: "150mm",
                  padding: "16mm 18mm",
                  color: "#222222",
                }}
              >
                <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed" style={{ color: "#222222" }}>{edited}</div>
              </div>
              <Textarea
                value={edited}
                onChange={(e) => setEdited(e.target.value)}
                className="mt-4 font-serif text-sm"
                rows={10}
              />
            </CardContent>
          </Card>

          {/* Chat panel */}
          {chatOpen && (
            <div className="xl:sticky xl:top-20 max-h-[85vh]">
              <RefineChat
                currentContent={edited || currentCoverLetter || ""}
                contentType="cover-letter"
                onContentUpdated={(newContent) => {
                  setEdited(newContent);
                  setCoverLetter(newContent);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
