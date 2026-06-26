"use client";

import { useState } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { useAppStore } from "@/stores/app-store";
import { generateCv } from "@/lib/ai-client";
import { exportToPdf } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RefineChat from "@/components/shared/RefineChat";

const CV_CSS = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

  .cv-page { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; font-size: 13px; line-height: 1.55; color: #1a1a1a; background: #fff; margin: 0; padding: 16mm 18mm; }
  body, html { margin: 0; padding: 0; }
  h1 { font-family: 'Inter', sans-serif; font-size: 22px; text-align: center; margin-bottom: 2px; font-weight: 800; letter-spacing: 0.5px; color: #111; }
  .contact { text-align: center; font-size: 11px; color: #555; margin-bottom: 14px; line-height: 1.6; }
  .contact strong { color: #444; font-weight: 700; }

  hr { border: none; border-top: 2px solid #333; margin: 12px 0; }

  h2 { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 800; color: #1a1a1a; text-transform: uppercase; letter-spacing: 2.5px; border-bottom: 1.5px solid #444; padding-bottom: 3px; margin: 16px 0 8px; }
  h3 { font-family: 'Inter', sans-serif; font-weight: 700; }

  .entry { margin-bottom: 10px; }
  /* Position/title: bold + 1px larger */
  .entry-title { font-weight: 800; font-size: 14px; color: #1a1a1a; }

  /* Company name + date: italic */
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; color: #666; }
  .entry-company { font-style: italic; font-weight: 600; font-size: 12px; color: #555; }
  .entry-sub { font-style: italic; font-weight: 600; font-size: 12px; color: #555; margin-bottom: 3px; }
  .entry-date { font-style: italic; font-weight: 400; color: #999; font-size: 11.5px; white-space: nowrap; }

  ul { margin: 4px 0 0 18px; padding: 0; }
  li { font-size: 12px; margin-bottom: 2px; line-height: 1.45; }

  .skills-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
  .skills-table td { padding: 3px 8px; vertical-align: top; }
  .skills-table td:first-child { font-weight: 800; white-space: nowrap; width: 130px; color: #333; }

  .skills p { margin: 3px 0; font-size: 12px; line-height: 1.45; }
  .skills p strong { font-weight: 800; }

  .tag { font-weight: 800; color: #1a1a1a; }
  li strong .tag { font-weight: 800; }
  li strong { font-weight: 700; color: #1a1a1a; }

  p { margin: 3px 0; font-size: 12px; line-height: 1.45; }
  p strong { font-weight: 800; color: #1a1a1a; }

  .footer { font-size: 11px; color: #666; margin-top: 12px; border-top: 1px solid #ccc; padding-top: 6px; }

  @media print {
    .cv-page { padding: 16mm 18mm; }
    body, html { margin: 0; padding: 0; }
    @page { margin: 0; }
    hr { border-color: #333; }
  }
</style>
`;

export default function CvGeneratorPage() {
  const profile = useProfileStore((s) => s.profile);
  const { _hasHydrated } = useProfileStore();
  const { currentAnalysis, currentCvHtml, setCvHtml, jdLanguage, language } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const t = (en: string, zh: string) => (language === "zh-TW" ? zh : en);

  const handleGenerate = async () => {
    if (!currentAnalysis) return;
    setLoading(true); setError("");
    try {
      const outputLang = jdLanguage || language;
      const html = await generateCv(profile, currentAnalysis, outputLang);
      setCvHtml(html);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CV generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportToPdf("cv-preview", `CV_${currentAnalysis?.jobTitle || "Tailored"}`);
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
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("Tailored CV", "客製化履歷")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t(`Based on: ${currentAnalysis.jobTitle}`, `基於：${currentAnalysis.jobTitle}`)}
          </p>
        </div>
        <div className="flex gap-2">
          {!currentCvHtml && (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? t("Generating...", "生成中...") : t("Generate CV", "生成履歷")}
            </Button>
          )}
          {currentCvHtml && (
            <>
              <Button variant="outline" onClick={() => { setCvHtml(null); setChatOpen(false); }}>
                {t("Regenerate", "重新生成")}
              </Button>
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
            <p className="text-gray-400 mt-6 text-sm">{t("AI is writing your CV...", "AI 正在撰寫你的履歷...")}</p>
          </CardContent>
        </Card>
      )}

      {currentCvHtml && (
        <div className={`grid gap-4 items-start ${chatOpen ? "grid-cols-1 xl:grid-cols-[1fr_380px]" : "grid-cols-1"}`}>
          {/* CV Preview: A4 width, centered */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("Preview", "預覽")}</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
              {/* A4 wrapper — 210mm at screen resolution, capped to container */}
              <div
                id="cv-preview"
                className="bg-white border shadow-md w-full"
                style={{
                  maxWidth: "100%",
                  color: "#222222",
                }}
                dangerouslySetInnerHTML={{ __html: CV_CSS + currentCvHtml }}
              />
            </CardContent>
          </Card>

          {/* Chat panel */}
          {chatOpen && (
            <div className="xl:sticky xl:top-20 max-h-[85vh]">
              <RefineChat
                currentContent={currentCvHtml}
                contentType="cv"
                onContentUpdated={(newContent) => setCvHtml(newContent)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
