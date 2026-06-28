"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";

export default function ApplicationRecordsPage() {
  const { applicationRecords, removeApplicationRecord, clearRecords, language, _hasHydrated } =
    useAppStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const t = (en: string, zh: string) => (language === "zh-TW" ? zh : en);

  if (!_hasHydrated) return <div className="py-20 text-center text-gray-400">Loading...</div>;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-500";
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(language === "zh-TW" ? "zh-TW" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadExcel = () => {
    const rows = applicationRecords.map((r) => ({
      [t("Job Title", "岗位名称")]: r.jobTitle,
      [t("Company", "公司")]: r.company || "-",
      [t("Match Score", "匹配度")]: `${r.matchScore}%`,
      [t("Skills", "技能")]: `${r.matchBreakdown.skills}%`,
      [t("Experience", "经验")]: `${r.matchBreakdown.experience}%`,
      [t("Education", "学历")]: `${r.matchBreakdown.education}%`,
      [t("Suggestions", "建议")]: r.suggestions.join("; "),
      [t("Missing Gaps", "待补强")]: r.missingGaps.join("; "),
      [t("Applied At", "投递时间")]: formatDate(r.appliedAt),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("Application Records", "投递记录"));
    XLSX.writeFile(wb, `job-application-records.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("Application Records", "投遞記錄")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t(
              "Automatically saved after each JD analysis. Download as Excel for tracking.",
              "每次 JD 分析後自動儲存，可下載 Excel 進行追蹤。"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {applicationRecords.length > 0 && (
            <>
              <Button onClick={handleDownloadExcel} variant="default">
                {t("Download Excel", "下載 Excel")}
              </Button>
              <Button onClick={() => setConfirmClear(true)} variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                {t("Clear All", "清除全部")}
              </Button>
            </>
          )}
        </div>
      </div>

      {applicationRecords.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-400 text-lg">
              {t(
                "No records yet. Go analyze a JD to start tracking your applications!",
                "尚無記錄。前往 JD 分析開始追蹤你的求職申請！"
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applicationRecords
            .slice()
            .reverse()
            .map((record) => {
              const isExpanded = expandedId === record.id;
              return (
                <Card
                  key={record.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{record.jobTitle}</span>
                          {record.company && (
                            <Badge variant="secondary" className="text-xs">
                              {record.company}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(record.appliedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className={`text-xl font-bold ${getScoreColor(record.matchScore)}`}>
                          {record.matchScore}%
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeApplicationRecord(record.id);
                          }}
                        >
                          {t("Delete", "刪除")}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {/* Match breakdown bars */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          {(["skills", "experience", "education"] as const).map((k) => (
                            <div key={k}>
                              <p className="text-[10px] text-gray-400 mb-0.5">
                                {k === "skills" ? t("Skills", "技能") : k === "experience" ? t("Experience", "經驗") : t("Education", "學歷")}
                              </p>
                              <div className="text-sm font-semibold">{record.matchBreakdown[k]}%</div>
                            </div>
                          ))}
                        </div>

                        {/* Suggestions */}
                        {record.suggestions.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-700 mb-1">
                              {t("Suggested Highlights", "建議強調")}
                            </p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {record.suggestions.map((s, i) => (
                                <li key={i} className="text-xs text-gray-600">{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Missing gaps */}
                        {record.missingGaps.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-500 mb-1">
                              {t("Missing Gaps", "待補強")}
                            </p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {record.missingGaps.map((g, i) => (
                                <li key={i} className="text-xs text-gray-600">{g}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Clear confirmation dialog */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Clear All Records?", "清除所有記錄？")}</DialogTitle>
            <DialogDescription>
              {t(
                "This will permanently delete all application records. This action cannot be undone.",
                "這將永久刪除所有投遞記錄，此操作無法撤銷。"
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="default"
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                clearRecords();
                setConfirmClear(false);
              }}
            >
              {t("Clear All", "全部清除")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
